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
const IPFIX_POLL_MS = 0;
const IPFIX_WINDOW_MS = 300000;
const IPFIX_COMMAND = "";
const IPFIX_HTTP_URL = "http://192.168.137.89:8080/ipfix_mqtt.csv";
const IPFIX_DEVICE_IP = "192.168.137.141";
const IPFIX_BROKER_IP = "192.168.137.89";
const IPFIX_MQTT_TOPIC_SUFFIXES = ["/ipfix", "/ipfix/csv", "/flows/ipfix"];
const AI_PART_DIR = path.join(__dirname, "AI part");
const NETWORK_SAMPLE_PATH = path.join(AI_PART_DIR, "sample_network.csv");
const PROCESS_SAMPLE_PATH = path.join(AI_PART_DIR, "sample_process.csv");
const FUSION_SCORER_PATH = path.join(AI_PART_DIR, "fusion_score.py");
const SIM_TICK_MS = 2500;
const CONTROL_ATTACK_PRESETS = [
  "normal",
  "dos",
  "ransomware",
  "mitm",
  "malware",
  "data exfiltration",
];
const CONTROL_PARTS = ["network", "process", "memory"];
const CONTROL_MODES = ["normal", "abnormal", "attack"];

const app = express();
app.use(express.json());
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
        reset: true,
        telemetry: series.telemetry,
        status: latestStatus,
        alerts,
        state: series.state,
        ipfix: series.ipfix,
        cyber: series.cyber,
        lastCyber,
        lastIpfix,
        lastStatusSeen,
        controlState: getControlStatePayload(),
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

function createInitPayload(reset = false) {
  return {
    reset,
    telemetry: series.telemetry,
    status: latestStatus,
    alerts,
    state: series.state,
    ipfix: series.ipfix,
    cyber: series.cyber,
    lastCyber,
    lastIpfix,
    lastStatusSeen,
    controlState: getControlStatePayload(),
  };
}

function broadcastInitSnapshot(reset = false) {
  broadcast({
    type: "init",
    payload: createInitPayload(reset),
  });
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
let simulatedNetworkRows = [];
let simulatedProcessRows = [];
let simulatedFrames = [];
let simulatedFrameIndex = 0;
let simulatorTimer = null;
let controlState = createDefaultControlState();
const deviceRuntime = new Map();

const INCIDENT_WINDOW_MS = {
  normal: [120000, 300000],
  abnormal: [45000, 120000],
  attack: [90000, 240000],
};

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

function resetPublishedState() {
  series.telemetry.length = 0;
  series.state.length = 0;
  series.ipfix.length = 0;
  series.cyber.length = 0;
  alerts.length = 0;
  latestStatus = null;
  lastStatusSeen = 0;
  lastState = null;
  lastIpfix = null;
  lastCyber = null;
  simulatedFrameIndex = 0;
  deviceRuntime.clear();
}

function createDefaultScenario(mode = "normal") {
  return {
    attackType: mode === "attack" ? "dos" : "dos",
    affectedParts: ["process"],
    source: "Control Generator",
    location: "Ward A",
    probabilities:
      mode === "attack"
        ? { normal: 0, abnormal: 0, attack: 100 }
        : { normal: 70, abnormal: 20, attack: 10 },
  };
}

function createDefaultControlState() {
  return {
    enabled: true,
    deviceCount: 4,
    globalScenario: createDefaultScenario(),
    deviceOverrides: {},
  };
}

function normalizeScenario(input, fallbackMode = "normal") {
  const affectedParts = Array.isArray(input?.affectedParts)
    ? input.affectedParts.filter((part) => CONTROL_PARTS.includes(part))
    : ["process"];
  const attackTypeRaw = String(input?.attackType || "").trim().toLowerCase();
  const probabilitiesInput = input?.probabilities || {};
  const probabilities = {
    normal: Math.max(0, Number(probabilitiesInput.normal) || 0),
    abnormal: Math.max(0, Number(probabilitiesInput.abnormal) || 0),
    attack: Math.max(0, Number(probabilitiesInput.attack) || 0),
  };
  const totalWeight =
    probabilities.normal + probabilities.abnormal + probabilities.attack;
  if (totalWeight <= 0) {
    probabilities.normal = 70;
    probabilities.abnormal = 20;
    probabilities.attack = 10;
  }

  return {
    attackType:
      attackTypeRaw && attackTypeRaw !== "custom" ? attackTypeRaw : "dos",
    affectedParts: affectedParts.length ? affectedParts : ["process"],
    source: String(input?.source || "Control Generator").trim() || "Control Generator",
    location: String(input?.location || "Ward A").trim() || "Ward A",
    probabilities,
  };
}

function normalizeControlState(input) {
  const deviceCount = Math.min(
    12,
    Math.max(1, Number.parseInt(input?.deviceCount, 10) || 4)
  );
  const enabled = true;
  const globalScenario = normalizeScenario(input?.globalScenario, "normal");
  const deviceOverrides = {};

  if (input?.deviceOverrides && typeof input.deviceOverrides === "object") {
    Object.entries(input.deviceOverrides).forEach(([device, override]) => {
      if (typeof device !== "string" || !device.trim()) return;
      if (!override || typeof override !== "object" || !override.enabled) return;
      deviceOverrides[device.trim()] = {
        enabled: true,
        scenario: normalizeScenario(override.scenario || override, "normal"),
      };
    });
  }

  return {
    enabled,
    deviceCount,
    globalScenario,
    deviceOverrides,
  };
}

function getControlStatePayload() {
  return JSON.parse(JSON.stringify(controlState));
}

function getDeviceSlot(index, deviceCount = 4) {
  return ((index % deviceCount) + deviceCount) % deviceCount;
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
  latestStatus = {
    ...obj,
    source: String(obj.source || "Control Generator"),
    location: String(obj.location || "Ward A"),
    t,
  };
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
  const safePoint = {
    ...point,
    source: String(point?.source || "Control Generator"),
    location: String(point?.location || "Ward A"),
  };
  lastCyber = safePoint;
  pushLimited(series.cyber, safePoint, MAX_POINTS);
  broadcast({ type: "cyber", payload: safePoint });

  if (firebaseDb) {
    firebaseDb.ref("/live/cyber").set(safePoint).catch(() => {});
    firebaseDb
      .ref("/series/cyber")
      .child(String(safePoint.t))
      .set(safePoint)
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

function loadCsvRecords(filePath) {
  try {
    const csvText = fs.readFileSync(filePath, "utf8");
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
    console.warn(`[SIM] CSV load failed for ${filePath}:`, err.message);
    return [];
  }
}

function loadFusionFrames() {
  try {
    const { spawnSync } = require("child_process");
    const result = spawnSync("python3", [FUSION_SCORER_PATH], {
      encoding: "utf8",
      timeout: 15000,
      cwd: __dirname,
    });

    if (result.error) {
      throw result.error;
    }
    if (result.status !== 0) {
      throw new Error(result.stderr?.trim() || `fusion scorer exited with ${result.status}`);
    }

    const parsed = JSON.parse(result.stdout || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("[SIM] fusion scoring failed:", err.message);
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

function deriveDeviceIp(index, deviceCount = 4) {
  return `10.0.1.${172 + getDeviceSlot(index, deviceCount)}`;
}

function deriveDestinationIp(index, deviceCount = 4) {
  return `10.0.1.${150 + ((getDeviceSlot(index, deviceCount) + 1) % Math.max(2, deviceCount))}`;
}

function deriveDeviceName(index, deviceCount = 4) {
  return `iomt-node-${getDeviceSlot(index, deviceCount) + 1}`;
}

function getScenarioForDevice(deviceName) {
  const override = controlState.deviceOverrides[deviceName];
  if (override?.enabled && override.scenario) {
    return override.scenario;
  }
  return controlState.globalScenario;
}

function chooseScenarioMode(scenario) {
  const weights = scenario?.probabilities || {};
  const normal = Math.max(0, Number(weights.normal) || 0);
  const abnormal = Math.max(0, Number(weights.abnormal) || 0);
  const attack = Math.max(0, Number(weights.attack) || 0);
  const total = normal + abnormal + attack;
  if (total <= 0) return "normal";
  const roll = Math.random() * total;
  if (roll < normal) return "normal";
  if (roll < normal + abnormal) return "abnormal";
  return "attack";
}

function randomBetween(min, max) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return 60000;
  if (max <= min) return min;
  return Math.round(min + Math.random() * (max - min));
}

function buildScenarioState(baseScenario, now, incidentSeq = 1) {
  const mode = chooseScenarioMode(baseScenario);
  const duration = randomBetween(
    INCIDENT_WINDOW_MS[mode]?.[0] || 60000,
    INCIDENT_WINDOW_MS[mode]?.[1] || 120000
  );
  return {
    id: `${mode}-${incidentSeq}-${now}`,
    mode,
    attackType: mode === "attack" ? baseScenario.attackType || "dos" : "normal",
    affectedParts:
      mode === "normal"
        ? []
        : Array.isArray(baseScenario.affectedParts) && baseScenario.affectedParts.length
        ? baseScenario.affectedParts
        : ["process"],
    source: baseScenario.source,
    location: baseScenario.location,
    startedAt: now,
    expiresAt: now + duration,
  };
}

function resolveScenarioState(deviceName, baseScenario, now) {
  const runtime = deviceRuntime.get(deviceName);
  if (runtime && runtime.expiresAt > now) {
    return { scenario: runtime, transitioned: false };
  }

  const nextSeq = (runtime?.sequence || 0) + 1;
  const scenario = {
    ...buildScenarioState(baseScenario, now, nextSeq),
    sequence: nextSeq,
  };
  deviceRuntime.set(deviceName, scenario);
  const transitioned = true;
  return { scenario, transitioned };
}

function applyScenarioToModel(baseModel, partKey, scenario) {
  const affected = scenario.affectedParts.includes(partKey);
  const model = { ...(baseModel || {}) };
  model.part = partKey;
  model.label = String(model.label || `${partKey} model`);

  if (scenario.mode === "normal") {
    model.anomaly = false;
    model.attacked = false;
    model.attackType = "normal";
    model.confidence = 0.16;
    model.anomalyScore = 8;
    return model;
  }

  if (scenario.mode === "abnormal") {
    model.anomaly = affected;
    model.attacked = false;
    model.attackType = affected ? "normal" : "normal";
    model.confidence = affected ? 0.72 : 0.26;
    model.anomalyScore = affected ? 64 : 18;
    return model;
  }

  model.anomaly = affected;
  model.attacked = affected;
  model.attackType = affected ? scenario.attackType : "normal";
  model.confidence = affected ? 0.91 : 0.24;
  model.anomalyScore = affected ? 92 : 14;
  return model;
}

function buildControlledFusion(models, scenario) {
  const attacked = models.filter((item) => item.attacked);
  const anomalous = models.filter((item) => item.anomaly);
  const alert = scenario.mode !== "normal";
  let severity = "low";
  if (attacked.length >= 2) severity = "high";
  else if (attacked.length === 1 || anomalous.length >= 2 || scenario.mode === "abnormal") severity = "medium";

  const triggeredBy = (attacked.length ? attacked : anomalous).map((item) => item.part);
  const attackType =
    scenario.mode === "attack"
      ? scenario.attackType
      : scenario.mode === "abnormal"
      ? "anomalous behavior"
      : "normal";
  const confidenceSource = attacked.length ? attacked : anomalous;
  const confidence = confidenceSource.length
    ? Math.max(...confidenceSource.map((item) => Number(item.confidence) || 0))
    : 0.15;
  const scoreSource = anomalous.length ? anomalous : models;
  const score =
    scoreSource.reduce((sum, item) => sum + (Number(item.anomalyScore) || 0), 0) /
    Math.max(1, scoreSource.length);

  let report =
    "No active alert. The device is operating within its expected pattern.";
  if (scenario.mode === "abnormal") {
    report = `The system flagged unusual activity on ${triggeredBy.join(
      " and "
    )}. Admin review is recommended if this pattern continues.`;
  } else if (scenario.mode === "attack") {
    report = `A likely ${attackType} incident is affecting ${triggeredBy.join(
      " and "
    )}. The dashboard is treating this as an active security alert.`;
  }

  return {
    alert,
    severity,
    triggeredBy,
    attackedParts: attacked.map((item) => item.part),
    anomalousParts: anomalous.map((item) => item.part),
    attackType,
    attackVotes:
      scenario.mode === "attack"
        ? { [attackType]: attacked.length || 1 }
        : {},
    confidence: Number(confidence.toFixed(4)),
    score: Number(score.toFixed(2)),
    report,
  };
}

function buildControlledTelemetry(baseTelemetry, scenario, index, deviceCount) {
  const telemetry = { ...baseTelemetry };
  telemetry.device = deriveDeviceName(index, deviceCount);
  telemetry.source = scenario.source;
  telemetry.location = scenario.location;

  if (scenario.mode === "normal") {
    telemetry.state = "IDLE";
    telemetry.coil_temp_c = 30.2;
    telemetry.gradient_temp_c = 33.5;
    telemetry.helium_level_pct = 92;
    telemetry.rf_power_pct = 4;
    telemetry.vibration_g = 0.03;
    telemetry.network_load = 80;
  } else if (scenario.mode === "abnormal") {
    telemetry.state = "WARMUP";
    telemetry.coil_temp_c = 38.4;
    telemetry.gradient_temp_c = 41.8;
    telemetry.helium_level_pct = 84;
    telemetry.rf_power_pct = 37;
    telemetry.vibration_g = 0.21;
    telemetry.network_load = 240;
  } else {
    telemetry.state = "ERROR";
    telemetry.coil_temp_c = 47.8;
    telemetry.gradient_temp_c = 52.2;
    telemetry.helium_level_pct = 71;
    telemetry.rf_power_pct = 79;
    telemetry.vibration_g = 0.42;
    telemetry.network_load = 420;
  }

  telemetry.uptime_s = getDeviceSlot(index, deviceCount) * 60 + simulatedFrameIndex * 5;
  return telemetry;
}

function buildControlledIpfix(baseIpfix, scenario, index, deviceCount) {
  const summary = { ...baseIpfix };
  const deviceIp = deriveDeviceIp(index, deviceCount);
  const destinationIp = deriveDestinationIp(index, deviceCount);
  const baseBytes =
    scenario.mode === "normal"
      ? 24000
      : scenario.mode === "abnormal"
      ? 185000
      : 760000;
  const basePackets =
    scenario.mode === "normal"
      ? 46
      : scenario.mode === "abnormal"
      ? 260
      : 980;
  summary.bytes = baseBytes;
  summary.packets = basePackets;
  summary.flows = scenario.mode === "normal" ? 1 : scenario.mode === "abnormal" ? 3 : 7;
  summary.flowRate = scenario.mode === "normal" ? 0.02 : scenario.mode === "abnormal" ? 0.12 : 0.38;
  summary.mqttBytes = Math.round(summary.bytes * 0.42);
  summary.deviceBytes = Math.round(summary.bytes * 0.58);
  summary.brokerBytes = Math.round(summary.bytes * 0.42);
  summary.topTalkers = [{ ip: deviceIp, bytes: summary.bytes, flows: summary.flows }];
  summary.topPairs = [
    {
      pair: `${deviceIp} → ${destinationIp}`,
      bytes: summary.bytes,
      flows: summary.flows,
      sa: deviceIp,
      da: destinationIp,
    },
  ];
  summary.source = scenario.source;
  summary.location = scenario.location;
  return summary;
}

function buildTelemetryFromRows(networkRow, processRow, frame, index, t) {
  const deviceCount = controlState.enabled ? controlState.deviceCount : 4;
  const load = asNumber(networkRow.Load);
  const temp = asNumber(networkRow.Temp, 28.5);
  const heartRate = asNumber(networkRow.Heart_rate) || asNumber(networkRow.Pulse_Rate);
  const respRate = asNumber(networkRow.Resp_Rate);
  const pulseRate = asNumber(networkRow.Pulse_Rate);
  const severity = String(frame?.fusion?.severity || "low").toLowerCase();

  let state = "IDLE";
  if (severity === "high") state = "ERROR";
  else if (load > 320000) state = "SCANNING";
  else if (load > 220000 || severity === "medium") state = "WARMUP";

  const tempOffset = severity === "high" ? 8 : severity === "medium" ? 3 : 0;
  const processCpu = asNumber(processRow.CPU);

  return {
    t,
    device: deriveDeviceName(index, deviceCount),
    state,
    coil_temp_c: temp + tempOffset,
    gradient_temp_c: temp + 4 + tempOffset * 0.5,
    helium_level_pct: clamp(95 - index * 0.15, 35, 100),
    mag_field_t: clamp(1.5 + (severity === "high" ? 0.015 : 0), 1.45, 1.56),
    rf_power_pct: clamp(load / 4500, 0, 100),
    vibration_g: clamp(asNumber(networkRow.SrcJitter) / 15 + (severity === "high" ? 0.12 : 0.03), 0, 0.6),
    table_pos_mm: clamp((asNumber(networkRow.TotPkts) * 28 + index * 20) % 1200, 0, 1200),
    uptime_s: index * 5,
    heart_rate: heartRate,
    spo2: asNumber(networkRow.SpO2, 95),
    resp_rate: respRate,
    systolic: asNumber(networkRow.SYS),
    diastolic: asNumber(networkRow.DIA),
    pulse_rate: pulseRate,
    network_load: asNumber(networkRow.Rate),
    process_cpu: processCpu,
  };
}

function buildStatusFromRows(telemetry, index, t) {
  const deviceCount = controlState.enabled ? controlState.deviceCount : 4;
  return {
    device: telemetry.device,
    ip: deriveDeviceIp(index, deviceCount),
    state: telemetry.state,
    uptime_s: telemetry.uptime_s,
    t,
  };
}

function buildIpfixSummaryFromRow(networkRow, t, index) {
  const deviceCount = controlState.enabled ? controlState.deviceCount : 4;
  const bytes = asNumber(networkRow.TotBytes);
  const packets = asNumber(networkRow.TotPkts);
  const srcAddr = deriveDeviceIp(index, deviceCount);
  const dstAddr = deriveDestinationIp(index, deviceCount);

  return {
    t,
    flows: 1,
    bytes,
    packets,
    flowRate: Math.max(0.01, asNumber(networkRow.Rate) / 1000),
    mqttBytes: String(networkRow.Dport) === "1883" ? bytes : 0,
    deviceBytes: asNumber(networkRow.SrcBytes),
    brokerBytes: asNumber(networkRow.DstBytes),
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

function buildCyberFromFrame(frame, networkRow, telemetry, ipfix, index, t) {
  const deviceCount = controlState.enabled ? controlState.deviceCount : 4;
  const fusion = frame?.fusion || {};
  const finalAttack = String(fusion.attackType || "normal").trim();
  const isAttack = fusion.alert && !["normal", "anomalous behavior"].includes(finalAttack.toLowerCase());

  return {
    t,
    device: telemetry.device,
    deviceIp: deriveDeviceIp(index, deviceCount),
    destinationIp: deriveDestinationIp(index, deviceCount),
    attackCategory: finalAttack,
    isAttack,
    isAnomalous: Boolean(fusion.alert),
    severity: String(fusion.severity || "low").toLowerCase(),
    anomalyScore: Number(fusion.score) || 0,
    bytes: ipfix.bytes,
    packets: ipfix.packets,
    rate: asNumber(networkRow.Rate),
    protocol: String(networkRow.Dir || networkRow.Flgs || "--"),
    srcPort: String(networkRow.Sport || "--"),
    dstPort: String(networkRow.Dport || "--"),
    confidence: clamp(Number(fusion.confidence || 0), 0, 0.999),
    fusion,
    models: {
      network: frame?.network || null,
      process: frame?.process || null,
      memory: frame?.memory || null,
    },
  };
}

function maybeRaiseAnomalyAlert(cyber, telemetry) {
  if (!cyber?.fusion?.alert || !cyber.transitioned) return;

  const triggeredBy = (cyber.fusion.triggeredBy || []).join(" + ") || "Unknown";
  const affectedParts = (cyber.fusion.attackedParts || cyber.fusion.anomalousParts || []).join(", ") || "Unknown";
  const code = cyber.isAttack ? "FUSION_ATTACK_ALERT" : "FUSION_ANOMALY_ALERT";
  const details = `${cyber.fusion.report} Source: ${cyber.source || "Unknown"}. Location: ${
    cyber.location || "Unknown"
  }. Triggered by: ${triggeredBy}. Affected parts: ${affectedParts}.`;

  handleAlert({
    severity: cyber.severity === "low" ? "medium" : cyber.severity,
    code,
    details,
    state: telemetry.state,
    device: telemetry.device,
  });
}

function replaySimulationRow() {
  simulatedFrameIndex = (simulatedFrameIndex + 1) % 1000000;
  const t = Date.now();
  for (let deviceIndex = 0; deviceIndex < controlState.deviceCount; deviceIndex += 1) {
    const deviceName = deriveDeviceName(deviceIndex, controlState.deviceCount);
    const { scenario, transitioned } = resolveScenarioState(
      deviceName,
      getScenarioForDevice(deviceName),
      t
    );
    const models = {
      network: applyScenarioToModel(null, "network", scenario),
      process: applyScenarioToModel(null, "process", scenario),
      memory: applyScenarioToModel(null, "memory", scenario),
    };
    const fusion = buildControlledFusion(Object.values(models), scenario);
    const telemetry = buildControlledTelemetry(
      { t, device: deviceName },
      scenario,
      deviceIndex,
      controlState.deviceCount
    );
    const status = buildStatusFromRows(telemetry, deviceIndex, t);
    const ipfix = buildControlledIpfix({}, scenario, deviceIndex, controlState.deviceCount);
    status.source = scenario.source;
    status.location = scenario.location;
    const cyber = {
      t,
      device: telemetry.device,
      deviceIp: deriveDeviceIp(deviceIndex, controlState.deviceCount),
      destinationIp: deriveDestinationIp(deviceIndex, controlState.deviceCount),
      source: scenario.source,
      location: scenario.location,
      attackCategory: fusion.attackType,
      isAttack:
        fusion.alert &&
        !["normal", "anomalous behavior"].includes(fusion.attackType.toLowerCase()),
      isAnomalous: fusion.alert,
      severity: fusion.severity,
      anomalyScore: fusion.score,
      bytes: ipfix.bytes,
      packets: ipfix.packets,
      rate: telemetry.network_load || 0,
      protocol: "--",
      srcPort: "--",
      dstPort: "--",
      confidence: fusion.confidence,
      fusion,
      models,
      transitioned,
    };

    handleTelemetry(telemetry);
    handleStatus(status);
    publishIpfixSummary(ipfix);
    publishCyber(cyber);
    maybeRaiseAnomalyAlert(cyber, telemetry);
  }
}

function startDatasetSimulation() {
  console.log("[CONTROL] control-driven injection loop started");
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
  const safeSummary = {
    ...summary,
    source: String(summary?.source || "Control Generator"),
    location: String(summary?.location || "Ward A"),
  };
  lastIpfix = safeSummary;
  pushLimited(series.ipfix, safeSummary, MAX_POINTS);
  broadcast({ type: "ipfix", payload: safeSummary });

  if (firebaseDb) {
    firebaseDb.ref("/live/ipfix").set(safeSummary).catch(() => {});
    firebaseDb
      .ref("/series/ipfix")
      .child(String(safeSummary.t))
      .set(safeSummary)
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

function applyControlState(nextState) {
  controlState = normalizeControlState(nextState);
  resetPublishedState();
  broadcastInitSnapshot(true);
  if (simulatedFrames.length && simulatedNetworkRows.length && simulatedProcessRows.length) {
    replaySimulationRow();
  }
  return getControlStatePayload();
}

app.get("/api/control", (_req, res) => {
  res.json({
    controlState: getControlStatePayload(),
    attackPresets: [...CONTROL_ATTACK_PRESETS, "custom"],
    parts: CONTROL_PARTS,
    modes: CONTROL_MODES,
  });
});

app.post("/api/control", (req, res) => {
  try {
    const next = applyControlState(req.body || {});
    res.json({
      ok: true,
      controlState: next,
    });
  } catch (err) {
    res.status(400).json({
      ok: false,
      error: err.message || "Invalid control payload",
    });
  }
});

app.post("/api/control/reset", (_req, res) => {
  const next = applyControlState(createDefaultControlState());
  res.json({
    ok: true,
    controlState: next,
  });
});

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
