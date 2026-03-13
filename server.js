const path = require("path");
const fs = require("fs");
const http = require("http");
const express = require("express");
const WebSocket = require("ws");
const mqtt = require("mqtt");

const PORT = 3000;

const MQTT_URL = "mqtt://192.168.137.89:1883";
const MQTT_TOPICS = ["hospital/#"];
const MQTT_USERNAME = undefined;
const MQTT_PASSWORD = undefined;
const MQTT_CLIENT_ID = `mri-dashboard-${Math.random().toString(16).slice(2)}`;

const MAX_POINTS = 120;
const ALERT_MAX = 200;
const FIREBASE_SERVICE_ACCOUNT =
  "/Users/sulistiantopratomo/Desktop/Capstone/capstone-project-adaee-firebase-adminsdk-fbsvc-af74b56f04.json";
const FIREBASE_DB_URL =
  "https://capstone-project-adaee-default-rtdb.firebaseio.com";
const IPFIX_CSV_PATH = "";
const IPFIX_POLL_MS = 5000;
const IPFIX_WINDOW_MS = 300000;
const IPFIX_COMMAND = "";
const IPFIX_HTTP_URL = "http://192.168.137.89:8080/ipfix_mqtt.csv";
const IPFIX_DEVICE_IP = "192.168.137.141";
const IPFIX_BROKER_IP = "192.168.137.89";
const IPFIX_MQTT_TOPIC_SUFFIXES = ["/ipfix", "/ipfix/csv", "/flows/ipfix"];
const SIM_DATASET_PATH = path.join(
  __dirname,
  "ML integration",
  "cleaned_data.csv"
);
const SIM_TICK_MS = 2500;
const SIM_SCORER_PATH = path.join(__dirname, "ML integration", "score_flow.py");

const app = express();
app.use(express.static(path.join(__dirname, "public")));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Set();

wss.on("connection", (ws, req) => {
  console.log(
    `[WS] client connected ${req.socket.remoteAddress || ""}`.trim()
  );
  ws.isAlive = true;
  ws.on("pong", () => {
    ws.isAlive = true;
  });

  clients.add(ws);
  ws.send(
    JSON.stringify({
      type: "init",
      payload: {
        telemetry: series.telemetry,
        status: latestStatus,
        alerts,
        state: series.state,
        ipfix: series.ipfix,
        cyber: series.cyber,
        lastCyber,
        lastIpfix,
        lastStatusSeen,
      },
    })
  );

  ws.on("close", (code, reason) => {
    console.warn("[WS] client closed", code, reason?.toString() || "");
    clients.delete(ws);
  });
  ws.on("error", (err) => {
    console.error("[WS] client error", err.message);
  });
});

function broadcast(obj) {
  const payload = JSON.stringify(obj);
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

const wsHeartbeat = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.warn("[WS] terminating stale client");
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 25000);

wss.on("close", () => {
  clearInterval(wsHeartbeat);
});

const series = {
  telemetry: [],
  state: [],
  ipfix: [],
  cyber: [],
};

const alerts = [];
let latestStatus = null;
let lastStatusSeen = 0;
let lastState = null;
let lastIpfix = null;
let lastGoodIpfixCsv = "";
let lastIpfixMqttSeen = 0;
let lastCyber = null;
let simulatedRows = [];
let simulatedRowIndex = 0;
let simulatorTimer = null;

let firebaseDb = null;
if (FIREBASE_SERVICE_ACCOUNT && FIREBASE_DB_URL) {
  try {
    const admin = require("firebase-admin");
    const serviceAccountPath = path.resolve(FIREBASE_SERVICE_ACCOUNT);
    const serviceAccount = JSON.parse(
      fs.readFileSync(serviceAccountPath, "utf8")
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: FIREBASE_DB_URL,
    });

    firebaseDb = admin.database();
    console.log("Firebase Admin initialized.");
  } catch (err) {
    console.error("Failed to init Firebase Admin:", err.message);
  }
}

function pushLimited(list, point, max) {
  list.push(point);
  if (list.length > max) list.shift();
}

function updateState(state, t) {
  if (!state || typeof state !== "string") return;
  if (state === lastState) return;
  lastState = state;
  const statePoint = { t, state };
  pushLimited(series.state, statePoint, MAX_POINTS);
  broadcast({ type: "state", payload: statePoint });

  if (firebaseDb) {
    firebaseDb
      .ref("/series/state")
      .child(String(t))
      .set(statePoint)
      .catch(() => {});
  }
}

function parsePayload(payload) {
  const text = payload.toString();
  if (!text.length) return null;

  try {
    const json = JSON.parse(text);
    if (json && typeof json === "object") return json;
    if (typeof json === "number") return { value: json };
  } catch (_) {
    const asNumber = Number(text);
    if (Number.isFinite(asNumber)) return { value: asNumber };
  }

  return null;
}

function extractTelemetry(obj, t) {
  if (!obj || typeof obj !== "object") return null;
  const point = { t };
  const fields = [
    "coil_temp_c",
    "gradient_temp_c",
    "helium_level_pct",
    "mag_field_t",
    "rf_power_pct",
    "vibration_g",
    "table_pos_mm",
    "uptime_s",
    "heart_rate",
    "spo2",
    "resp_rate",
    "systolic",
    "diastolic",
    "pulse_rate",
    "network_load",
  ];

  fields.forEach((key) => {
    const raw = obj[key];
    const num = typeof raw === "string" ? Number(raw) : raw;
    if (Number.isFinite(num)) point[key] = num;
  });

  if (typeof obj.state === "string") point.state = obj.state;
  if (typeof obj.device === "string") point.device = obj.device;

  if (Object.keys(point).length <= 1) return null;
  return point;
}

function handleTelemetry(obj) {
  const t = Date.now();
  const point = extractTelemetry(obj, t);
  if (!point) return;

  pushLimited(series.telemetry, point, MAX_POINTS);
  broadcast({ type: "telemetry", payload: point });
  updateState(point.state, t);

  if (firebaseDb) {
    firebaseDb.ref("/live/telemetry").set(point).catch(() => {});
    firebaseDb
      .ref("/series/telemetry")
      .child(String(t))
      .set(point)
      .catch(() => {});
  }
}

function handleStatus(obj) {
  if (!obj || typeof obj !== "object") return;
  const t = Date.now();
  latestStatus = { ...obj, t };
  lastStatusSeen = t;
  broadcast({ type: "status", payload: latestStatus });
  updateState(latestStatus.state, t);

  if (firebaseDb) {
    firebaseDb.ref("/live/status").set(latestStatus).catch(() => {});
  }
}

function handleAlert(obj) {
  if (!obj || typeof obj !== "object") return;
  const t = Date.now();
  const alert = { ...obj, t };
  pushLimited(alerts, alert, ALERT_MAX);
  broadcast({ type: "alert", payload: alert });

  if (firebaseDb) {
    firebaseDb
      .ref("/alerts")
      .child(String(t))
      .set(alert)
      .catch(() => {});
  }
}

function publishCyber(point) {
  lastCyber = point;
  pushLimited(series.cyber, point, MAX_POINTS);
  broadcast({ type: "cyber", payload: point });

  if (firebaseDb) {
    firebaseDb.ref("/live/cyber").set(point).catch(() => {});
    firebaseDb
      .ref("/series/cyber")
      .child(String(point.t))
      .set(point)
      .catch(() => {});
  }
}

function parseCsvLine(line) {
  const out = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(current);
      current = "";
      continue;
    }
    current += ch;
  }

  out.push(current);
  return out.map((part) => part.trim());
}

function loadSimulationDataset() {
  try {
    const csvText = fs.readFileSync(SIM_DATASET_PATH, "utf8");
    const lines = csvText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) return [];

    const headers = parseCsvLine(lines[0]);
    return lines.slice(1).map((line) => {
      const values = parseCsvLine(line);
      const row = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] ?? "";
      });
      return row;
    });
  } catch (err) {
    console.warn("[SIM] dataset load failed:", err.message);
    return [];
  }
}

function asNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function scoreRowWithModel(row) {
  try {
    const { spawnSync } = require("child_process");
    const result = spawnSync("python3", [SIM_SCORER_PATH], {
      input: JSON.stringify(row),
      encoding: "utf8",
      timeout: 10000,
    });

    if (result.error) {
      throw result.error;
    }
    if (result.status !== 0) {
      throw new Error(result.stderr?.trim() || `scorer exited with ${result.status}`);
    }

    return JSON.parse(result.stdout || "{}");
  } catch (err) {
    console.warn("[SIM] model scoring failed:", err.message);
    return {
      is_anomalous: false,
      anomaly_score: 0,
      attack_probability: 0,
      attack_prediction: "normal",
    };
  }
}


function buildTelemetryFromRow(row, index, t) {
  const load = asNumber(row.Load);
  const temp = asNumber(row.Temp, 28.5);
  const heartRate = asNumber(row.Heart_rate);
  const respRate = asNumber(row.Resp_Rate);
  const pulseRate = asNumber(row.Pulse_Rate);
  const anomaly = String(row.Label).trim() === "1";

  let state = "IDLE";
  if (anomaly) state = "ERROR";
  else if (load > 320000) state = "SCANNING";
  else if (load > 220000) state = "WARMUP";

  return {
    t,
    device: row.SrcAddr || "iomt-device-01",
    state,
    coil_temp_c: temp + (anomaly ? 10 : 0),
    gradient_temp_c: temp + 4 + (anomaly ? 3 : 0),
    helium_level_pct: clamp(95 - index * 0.03, 35, 100),
    mag_field_t: clamp(1.5 + (anomaly ? 0.015 : 0), 1.45, 1.56),
    rf_power_pct: clamp(load / 4500, 0, 100),
    vibration_g: clamp(asNumber(row.SrcJitter) / 15 + (anomaly ? 0.12 : 0.03), 0, 0.6),
    table_pos_mm: clamp((asNumber(row.Packet_num) * 14) % 1200, 0, 1200),
    uptime_s: index * 5,
    heart_rate: heartRate || pulseRate,
    spo2: asNumber(row.SpO2, 95),
    resp_rate: respRate,
    systolic: asNumber(row.SYS),
    diastolic: asNumber(row.DIA),
    pulse_rate: pulseRate,
    network_load: asNumber(row.Rate),
  };
}

function buildStatusFromRow(row, telemetry, t) {
  return {
    device: telemetry.device,
    ip: row.SrcAddr || telemetry.device,
    state: telemetry.state,
    uptime_s: telemetry.uptime_s,
    t,
  };
}

function buildIpfixSummaryFromRow(row, t) {
  const bytes = asNumber(row.TotBytes);
  const packets = asNumber(row.TotPkts);
  const srcAddr = row.SrcAddr || IPFIX_DEVICE_IP;
  const dstAddr = row.DstAddr || IPFIX_BROKER_IP;

  return {
    t,
    flows: 1,
    bytes,
    packets,
    flowRate: Math.max(0.01, asNumber(row.Rate) / 1000),
    mqttBytes: String(row.Dport) === "1883" ? bytes : 0,
    deviceBytes: asNumber(row.SrcBytes),
    brokerBytes: asNumber(row.DstBytes),
    topTalkers: [
      {
        ip: srcAddr,
        bytes,
        flows: 1,
      },
    ],
    topPairs: [
      {
        pair: `${srcAddr} → ${dstAddr}`,
        bytes,
        flows: 1,
        sa: srcAddr,
        da: dstAddr,
      },
    ],
  };
}

function buildCyberFromRow(row, telemetry, ipfix, t) {
  const model = scoreRowWithModel(row);
  const rawScore = Number(model.anomaly_score);
  const normalizedScore = Number.isFinite(rawScore)
    ? clamp(Math.abs(rawScore) * 100, 0, 100)
    : 0;
  const attackCategory = String(model.attack_prediction || row["Attack Category"] || "normal").trim();
  const isAttack = Boolean(model.is_anomalous) && attackCategory.toLowerCase() !== "normal";
  const severity = isAttack
    ? normalizedScore >= 70
      ? "high"
      : "medium"
    : model.is_anomalous
    ? "medium"
    : "low";

  return {
    t,
    device: telemetry.device,
    deviceIp: row.SrcAddr || telemetry.device,
    destinationIp: row.DstAddr || IPFIX_BROKER_IP,
    attackCategory,
    isAttack,
    isAnomalous: Boolean(model.is_anomalous),
    severity,
    anomalyScore: normalizedScore,
    bytes: ipfix.bytes,
    packets: ipfix.packets,
    rate: asNumber(row.Rate),
    protocol: row.Dir || row.Flgs || "--",
    srcPort: row.Sport || "--",
    dstPort: row.Dport || "--",
    confidence: clamp(Number(model.attack_probability || 0), 0, 0.999),
    label: String(row.Label).trim(),
  };
}

function maybeRaiseAnomalyAlert(cyber, telemetry) {
  if (!cyber.isAnomalous) return;

  const code = cyber.isAttack ? "CYBER_ATTACK_DETECTED" : "ANOMALY_DETECTED";
  const details = cyber.isAttack
    ? `${cyber.attackCategory} activity detected from ${cyber.deviceIp} to ${cyber.destinationIp}`
    : `Unusual network behavior detected for ${cyber.deviceIp}`;

  handleAlert({
    severity: cyber.severity === "low" ? "medium" : cyber.severity,
    code,
    details,
    state: telemetry.state,
    device: telemetry.device,
  });
}

function replaySimulationRow() {
  if (!simulatedRows.length) return;

  const row = simulatedRows[simulatedRowIndex];
  simulatedRowIndex = (simulatedRowIndex + 1) % simulatedRows.length;
  const t = Date.now();

  const telemetry = buildTelemetryFromRow(row, simulatedRowIndex, t);
  const status = buildStatusFromRow(row, telemetry, t);
  const ipfix = buildIpfixSummaryFromRow(row, t);
  const cyber = buildCyberFromRow(row, telemetry, ipfix, t);

  handleTelemetry(telemetry);
  handleStatus(status);
  publishIpfixSummary(ipfix);
  publishCyber(cyber);
  maybeRaiseAnomalyAlert(cyber, telemetry);
}

function startDatasetSimulation() {
  simulatedRows = loadSimulationDataset();
  if (!simulatedRows.length) {
    console.warn("[SIM] no dataset rows loaded");
    return;
  }

  console.log(`[SIM] loaded ${simulatedRows.length} dataset rows from ${SIM_DATASET_PATH}`);
  replaySimulationRow();
  simulatorTimer = setInterval(replaySimulationRow, SIM_TICK_MS);
}

function parseIpfixCsv(csvText) {
  if (!csvText) return [];
  return csvText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line.includes(","))
    .filter((line) => !line.startsWith("ts,te,pr"))
    .filter((line) => !line.toLowerCase().startsWith("summary"))
    .filter((line) => !line.toLowerCase().startsWith("date first seen"))
    .filter((line) => !line.toLowerCase().startsWith("time window"))
    .filter((line) => !line.toLowerCase().startsWith("total flows"))
    .filter((line) => !line.toLowerCase().startsWith("sys:"))
    .map((line) => line.split(",").map((part) => part.trim()))
    .filter((parts) => parts.length >= 9)
    .map((parts) => ({
      ts: parts[0],
      te: parts[1],
      pr: parts[2],
      sa: parts[3],
      sp: parts[4],
      da: parts[5],
      dp: parts[6],
      pkt: Number(parts[7]),
      byt: Number(parts[8]),
    }))
    .filter((row) => row.sa && row.da && Number.isFinite(row.byt));
}

function summarizeIpfix(rows, now) {
  const parseTimestamp = (value) => {
    if (!value) return NaN;
    const normalized = value.replace(" ", "T");
    const t = Date.parse(normalized);
    if (Number.isFinite(t)) return t;
    const alt = Date.parse(value);
    return Number.isFinite(alt) ? alt : NaN;
  };

  const cutoff = now - IPFIX_WINDOW_MS;
  const recent = rows.filter((row) => {
    const t = parseTimestamp(row.ts);
    return Number.isFinite(t) && t >= cutoff;
  });
  const fallback = rows.length && !recent.length;
  const windowRows = fallback ? rows : recent;

  const totals = windowRows.reduce(
    (acc, row) => {
      acc.flows += 1;
      acc.bytes += row.byt || 0;
      acc.packets += row.pkt || 0;
      return acc;
    },
    { flows: 0, bytes: 0, packets: 0 }
  );

  const talkerMap = new Map();
  const pairMap = new Map();
  windowRows.forEach((row) => {
    const key = row.sa;
    const entry = talkerMap.get(key) || { ip: key, bytes: 0, flows: 0 };
    entry.bytes += row.byt || 0;
    entry.flows += 1;
    talkerMap.set(key, entry);

    const pairKey = `${row.sa} → ${row.da}`;
    const pairEntry = pairMap.get(pairKey) || {
      pair: pairKey,
      bytes: 0,
      flows: 0,
      sa: row.sa,
      da: row.da,
    };
    pairEntry.bytes += row.byt || 0;
    pairEntry.flows += 1;
    pairMap.set(pairKey, pairEntry);
  });

  const topTalkers = Array.from(talkerMap.values())
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 5);
  const topPairs = Array.from(pairMap.values())
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 6);

  const mqttFlows = windowRows.filter(
    (row) => String(row.dp) === "1883" || String(row.sp) === "1883"
  );
  const mqttBytes = mqttFlows.reduce((sum, row) => sum + (row.byt || 0), 0);

  const deviceToBroker = windowRows.filter(
    (row) => row.sa === IPFIX_DEVICE_IP && row.da === IPFIX_BROKER_IP
  );
  const brokerToDevice = windowRows.filter(
    (row) => row.sa === IPFIX_BROKER_IP && row.da === IPFIX_DEVICE_IP
  );

  return {
    t: now,
    flows: totals.flows,
    bytes: totals.bytes,
    packets: totals.packets,
    flowRate: totals.flows / Math.max(1, IPFIX_WINDOW_MS / 1000),
    mqttBytes,
    deviceBytes: deviceToBroker.reduce((sum, row) => sum + (row.byt || 0), 0),
    brokerBytes: brokerToDevice.reduce((sum, row) => sum + (row.byt || 0), 0),
    topTalkers,
    topPairs,
  };
}

function publishIpfixSummary(summary) {
  lastIpfix = summary;
  pushLimited(series.ipfix, summary, MAX_POINTS);
  broadcast({ type: "ipfix", payload: summary });

  if (firebaseDb) {
    firebaseDb.ref("/live/ipfix").set(summary).catch(() => {});
    firebaseDb
      .ref("/series/ipfix")
      .child(String(summary.t))
      .set(summary)
      .catch(() => {});
  }
}

function topicLooksLikeIpfix(topic) {
  if (!topic) return false;
  const lower = topic.toLowerCase();
  return (
    IPFIX_MQTT_TOPIC_SUFFIXES.some((suffix) => lower.endsWith(suffix)) ||
    lower.includes("/ipfix")
  );
}

function normalizeIpfixRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const ts = String(row.ts || row.time || row.timestamp || "").trim();
      const sa = String(row.sa || row.src || row.src_ip || "").trim();
      const da = String(row.da || row.dst || row.dst_ip || "").trim();
      const sp = String(row.sp || row.src_port || "").trim();
      const dp = String(row.dp || row.dst_port || "").trim();
      const pkt = Number(row.pkt ?? row.packets ?? 0);
      const byt = Number(row.byt ?? row.bytes ?? 0);
      if (!ts || !sa || !da || !Number.isFinite(byt)) return null;
      return {
        ts,
        te: String(row.te || row.end || row.end_time || ""),
        pr: String(row.pr || row.proto || row.protocol || ""),
        sa,
        sp,
        da,
        dp,
        pkt: Number.isFinite(pkt) ? pkt : 0,
        byt,
      };
    })
    .filter(Boolean);
}

function handleIpfixFromMqtt(topic, parsed, rawText) {
  const now = Date.now();

  if (parsed && typeof parsed === "object") {
    const hasSummaryNumbers =
      Number.isFinite(Number(parsed.flows)) &&
      Number.isFinite(Number(parsed.bytes ?? parsed.byt));
    if (hasSummaryNumbers) {
      const summary = {
        t: Number(parsed.t) || now,
        flows: Number(parsed.flows) || 0,
        bytes: Number(parsed.bytes ?? parsed.byt) || 0,
        packets: Number(parsed.packets ?? parsed.pkt) || 0,
        flowRate:
          Number(parsed.flowRate) ||
          Number(parsed.flows || 0) / Math.max(1, IPFIX_WINDOW_MS / 1000),
        mqttBytes: Number(parsed.mqttBytes) || 0,
        deviceBytes: Number(parsed.deviceBytes) || 0,
        brokerBytes: Number(parsed.brokerBytes) || 0,
        topTalkers: Array.isArray(parsed.topTalkers) ? parsed.topTalkers : [],
        topPairs: Array.isArray(parsed.topPairs) ? parsed.topPairs : [],
      };
      publishIpfixSummary(summary);
      lastIpfixMqttSeen = now;
      return true;
    }

    const rows = normalizeIpfixRows(parsed.rows);
    if (rows.length) {
      const summary = summarizeIpfix(rows, now);
      publishIpfixSummary(summary);
      lastIpfixMqttSeen = now;
      return true;
    }

    if (typeof parsed.csv === "string") {
      const csvRows = parseIpfixCsv(parsed.csv);
      if (csvRows.length) {
        const summary = summarizeIpfix(csvRows, now);
        publishIpfixSummary(summary);
        lastIpfixMqttSeen = now;
        return true;
      }
    }
  }

  if (typeof rawText === "string" && rawText.includes(",")) {
    const csvRows = parseIpfixCsv(rawText);
    if (csvRows.length) {
      const summary = summarizeIpfix(csvRows, now);
      publishIpfixSummary(summary);
      lastIpfixMqttSeen = now;
      return true;
    }
  }

  console.warn("[IPFIX] MQTT payload received but could not parse", topic);
  return false;
}

function fetchIpfixCsv(url) {
  return new Promise((resolve, reject) => {
    let client;
    try {
      const parsed = new URL(url);
      client = parsed.protocol === "https:" ? require("https") : require("http");
    } catch (err) {
      reject(err);
      return;
    }

    const req = client.get(
      url,
      {
        headers: {
          "Cache-Control": "no-cache",
          Connection: "close",
        },
      },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        res.setEncoding("utf8");
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => resolve(data));
        res.on("error", reject);
      }
    );

    req.on("error", reject);
    req.setTimeout(4000, () => {
      req.destroy(new Error("HTTP request timeout"));
    });
  });
}

function fetchIpfixCsvViaCurl(url) {
  return new Promise((resolve, reject) => {
    const { execFile } = require("child_process");
    execFile(
      "curl",
      ["-fsSL", "--max-time", "4", "--connect-timeout", "2", url],
      { encoding: "utf8", maxBuffer: 5 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error(stderr?.trim() || err.message));
          return;
        }
        resolve(stdout);
      }
    );
  });
}

async function readIpfixSnapshot() {
  const now = Date.now();
  let csvText = "";
  let sourceUsed = "";

  if (IPFIX_COMMAND) {
    try {
      const { execSync } = require("child_process");
      csvText = execSync(IPFIX_COMMAND, { encoding: "utf8" });
      sourceUsed = "command";
    } catch (err) {
      console.warn("[IPFIX] command failed:", err.message);
    }
  } else if (IPFIX_HTTP_URL && !csvText) {
    try {
      console.log(`[IPFIX] fetching ${IPFIX_HTTP_URL}`);
      try {
        csvText = await fetchIpfixCsvViaCurl(IPFIX_HTTP_URL);
        sourceUsed = "http-curl";
      } catch (curlErr) {
        console.warn("[IPFIX] curl fetch failed, trying node http:", curlErr.message);
        csvText = await fetchIpfixCsv(IPFIX_HTTP_URL);
        sourceUsed = "http-node";
      }
    } catch (err) {
      console.warn("[IPFIX] http fetch failed:", err.message);
    }
  }

  if (!csvText && IPFIX_CSV_PATH) {
    try {
      csvText = fs.readFileSync(IPFIX_CSV_PATH, "utf8");
      sourceUsed = "file";
    } catch (err) {
      if (err.code !== "ENOENT") {
        console.warn("[IPFIX] read failed:", err.message);
      }
    }
  }

  if (!csvText.trim() && lastGoodIpfixCsv) {
    console.warn("[IPFIX] empty CSV read, using last good snapshot");
    csvText = lastGoodIpfixCsv;
    sourceUsed = sourceUsed || "cache";
  }

  const rows = parseIpfixCsv(csvText);
  if (!rows.length) {
    const lines = csvText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const withCommas = lines.filter((line) => line.includes(",")).length;
    console.warn(
      `[IPFIX] no rows parsed (lines=${lines.length}, commaLines=${withCommas})`
    );
    console.warn("[IPFIX] sample lines:", lines.slice(0, 5));
    return;
  }

  lastGoodIpfixCsv = csvText;

  const summary = summarizeIpfix(rows, now);
  console.log(
    `[IPFIX] source=${sourceUsed || "unknown"} rows=${rows.length} flows=${summary.flows} bytes=${summary.bytes} rate=${summary.flowRate.toFixed(2)}`
  );
  publishIpfixSummary(summary);
}

let ipfixPollTimer = null;

async function pollIpfixOnce() {
  try {
    const mqttFresh = Date.now() - lastIpfixMqttSeen < IPFIX_POLL_MS * 2;
    if (mqttFresh) {
      console.log("[IPFIX] skipping HTTP poll (fresh MQTT IPFIX data)");
      return;
    }
    await readIpfixSnapshot();
  } catch (err) {
    console.warn("[IPFIX] poll failed:", err.message);
  } finally {
    if (IPFIX_POLL_MS > 0) {
      ipfixPollTimer = setTimeout(pollIpfixOnce, IPFIX_POLL_MS);
    }
  }
}

if (IPFIX_POLL_MS > 0) {
  pollIpfixOnce();
}

const mqttClient = mqtt.connect(MQTT_URL, {
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
  reconnectPeriod: 2000,
  clientId: MQTT_CLIENT_ID,
  clean: true,
});

mqttClient.on("connect", () => {
  console.log(`MQTT connected: ${MQTT_URL}`);
  if (MQTT_TOPICS.length) {
    mqttClient.subscribe(MQTT_TOPICS, (err, granted) => {
      if (err) {
        console.error("MQTT subscribe error:", err.message);
      } else {
        console.log("[MQTT] subscribed", granted);
      }
    });
  }
});

mqttClient.on("reconnect", () => {
  console.log("[MQTT] reconnecting...");
});

mqttClient.on("offline", () => {
  console.warn("[MQTT] offline");
});

mqttClient.on("end", () => {
  console.warn("[MQTT] connection ended");
});

mqttClient.on("message", (topic, payload) => {
  const text = payload.toString();
  console.log("[MQTT] raw", topic, text);
  const parsed = parsePayload(payload);
  if (topicLooksLikeIpfix(topic)) {
    handleIpfixFromMqtt(topic, parsed, text);
    return;
  }
  if (!parsed) {
    console.warn("[MQTT] Unparsed payload", topic, text);
    return;
  }
  console.log("[MQTT] message", topic, text);

  if (topic.endsWith("/telemetry")) {
    handleTelemetry(parsed);
    return;
  }
  if (topic.endsWith("/status")) {
    handleStatus(parsed);
    return;
  }
  if (topic.endsWith("/alerts")) {
    handleAlert(parsed);
    return;
  }

  handleTelemetry(parsed);
});

mqttClient.on("error", (err) => {
  console.error("MQTT error:", err.message);
});

process.on("uncaughtException", (err) => {
  console.error("[PROCESS] uncaughtException", err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("[PROCESS] unhandledRejection", err);
});

server.listen(PORT, () => {
  console.log(`Dashboard running on http://localhost:${PORT}`);
  startDatasetSimulation();
});
