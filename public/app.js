(() => {
  const config = window.__APP_CONFIG__ || {};
  const wsUrl =
    config.wsUrl ||
    (location.protocol === "https:"
      ? `wss://${location.host}`
      : `ws://${location.host}`);

  const statusEl = document.getElementById("ws-status");
  const wsDotEl = document.getElementById("ws-dot");
  const wsTextEl = document.getElementById("ws-text");
  const lastTickEl = document.getElementById("last-tick");
  const sourceNoteEl = document.getElementById("source-note");

  const deviceIdEl = document.getElementById("device-id");
  const devicePickerEl = document.getElementById("device-picker");
  const sourceLabelEl = document.getElementById("source-label");
  const sourcePickerEl = document.getElementById("source-picker");
  const stateBadgeEl = document.getElementById("state-badge");
  const lastSeenEl = document.getElementById("last-seen");
  const onlineChipEl = document.getElementById("online-chip");
  const deviceIpEl = document.getElementById("device-ip");

  const coilTempValueEl = document.getElementById("coil-temp-value");
  const heliumValueEl = document.getElementById("helium-value");
  const rfValueEl = document.getElementById("rf-value");
  const vibrationValueEl = document.getElementById("vibration-value");
  const tableValueEl = document.getElementById("table-value");

  const tableFillEl = document.getElementById("table-fill");
  const tableMarkerEl = document.getElementById("table-marker");
  const alertsBodyEl = document.getElementById("alerts-body");
  const anomalyBannerEl = document.getElementById("anomaly-banner");
  const anomalyStatusEl = document.getElementById("anomaly-status");
  const anomalyMessageEl = document.getElementById("anomaly-message");
  const alertToastEl = document.getElementById("alert-toast");
  const alertToastTitleEl = document.getElementById("alert-toast-title");
  const alertToastMessageEl = document.getElementById("alert-toast-message");
  const alertToastSeverityEl = document.getElementById("alert-toast-severity");
  const anomalyScoreEl = document.getElementById("anomaly-score");
  const attackCategoryEl = document.getElementById("attack-category");
  const cyberConfidenceEl = document.getElementById("cyber-confidence");
  const cyberBytesEl = document.getElementById("cyber-bytes");
  const cyberPacketsEl = document.getElementById("cyber-packets");
  const cyberDeviceIpEl = document.getElementById("cyber-device-ip");
  const cyberDestinationIpEl = document.getElementById("cyber-destination-ip");
  const vitalsTempEl = document.getElementById("vitals-temp");
  const vitalsSpO2El = document.getElementById("vitals-spo2");
  const vitalsHeartEl = document.getElementById("vitals-heart");
  const vitalsRespEl = document.getElementById("vitals-resp");
  const mainEventsEl = document.getElementById("main-events");
  const alertCountsEl = document.getElementById("alert-counts");
  const ipfixFlowrateEl = document.getElementById("ipfix-flowrate");
  const ipfixBytesEl = document.getElementById("ipfix-bytes");
  const ipfixTalkersEl = document.getElementById("ipfix-talkers");
  const ipfixDeviceEl = document.getElementById("ipfix-device");
  const ipfixBrokerEl = document.getElementById("ipfix-broker");
  const mqttSectionEl = document.getElementById("mqtt-section");
  const mqttTrendsEl = document.getElementById("mqtt-trends");
  const mqttExtrasEl = document.getElementById("mqtt-extras");
  const ipfixSectionEl = document.getElementById("ipfix-section");
  const mainPanelEl = document.getElementById("main-panel");
  const overviewPanelEl = document.getElementById("overview-panel");
  const networkPanelEl = document.getElementById("network-panel");
  const devicePanelEl = document.getElementById("device-panel");
  const tabButtons = document.querySelectorAll(".tab-btn");

  const maxPoints = config.maxPoints || 300;
  const alertMax = config.alertMax || 100;
  const debug = config.debug !== false;

  function log(...args) {
    if (debug) console.log("[DASH]", ...args);
  }

  function warn(...args) {
    if (debug) console.warn("[DASH]", ...args);
  }

  function errLog(...args) {
    if (debug) console.error("[DASH]", ...args);
  }

  const stateMap = {
    IDLE: 0,
    WARMUP: 1,
    SCANNING: 2,
    COOLDOWN: 3,
    ERROR: 4,
  };

  const stateLabels = ["IDLE", "WARMUP", "SCANNING", "COOLDOWN", "ERROR"];

  const stateColors = {
    IDLE: "state-idle",
    WARMUP: "state-warmup",
    SCANNING: "state-scanning",
    COOLDOWN: "state-cooldown",
    ERROR: "state-error",
  };

  let lastStatusSeen = 0;
  let latestStatus = null;
  let latestTelemetry = {};
  let alerts = [];
  let selectedDevice = null;
  const deviceSet = new Set();
  let selectedSource = "all";
  let hasRealData = false;
  let cyberHistory = [];
  let alertToastTimer = null;

  function normalizeDevice(value) {
    if (typeof value !== "string" || !value.trim()) return null;
    return value.trim();
  }

  function updateDevicePicker() {
    if (!devicePickerEl) return;
    const options = ["All devices", ...Array.from(deviceSet).sort()];
    if (!options.length) {
      devicePickerEl.innerHTML = "";
      return;
    }
    devicePickerEl.innerHTML = "";
    options.forEach((device) => {
      const option = document.createElement("option");
      option.value = device === "All devices" ? "__all__" : device;
      option.textContent = device;
      if (
        (device === "All devices" && !selectedDevice) ||
        device === selectedDevice
      ) {
        option.selected = true;
      }
      devicePickerEl.appendChild(option);
    });
  }

  function setSelectedDevice(device) {
    selectedDevice = device;
    if (deviceIdEl) deviceIdEl.textContent = device || "--";
    updateDevicePicker();
    resetCharts();
  }

  function setSelectedSource(source) {
    selectedSource = source || "all";
    if (sourceLabelEl) {
      sourceLabelEl.textContent =
        selectedSource === "mqtt"
          ? "MQTT"
          : selectedSource === "ipfix"
          ? "IPFIX"
          : "All";
    }
    if (mqttSectionEl) mqttSectionEl.classList.toggle("hidden", selectedSource === "ipfix");
    if (mqttTrendsEl) mqttTrendsEl.classList.toggle("hidden", selectedSource === "ipfix");
    if (mqttExtrasEl) mqttExtrasEl.classList.toggle("hidden", selectedSource === "ipfix");
    if (ipfixSectionEl) ipfixSectionEl.classList.toggle("hidden", selectedSource === "mqtt");
  }

  function setActiveTab(panelId) {
    if (mainPanelEl) mainPanelEl.classList.toggle("hidden", panelId !== "main-panel");
    if (overviewPanelEl) overviewPanelEl.classList.toggle("hidden", panelId !== "overview-panel");
    if (networkPanelEl) networkPanelEl.classList.toggle("hidden", panelId !== "network-panel");
    if (devicePanelEl) devicePanelEl.classList.toggle("hidden", panelId !== "device-panel");
    tabButtons.forEach((btn) => {
      const isActive = btn.getAttribute("data-panel") === panelId;
      btn.classList.toggle("active", isActive);
    });
  }

  function resetCharts() {
    [tempChart, heliumChart, rfChart, vibrationChart, magChart, stateChart, ipfixRateChart, ipfixBytesChart, riskChart, trafficChart].forEach((chart) => {
      chart.data.labels = [];
      chart.data.datasets.forEach((dataset) => {
        dataset.data = [];
      });
      chart.update("none");
    });
  }

  function setStatus(connected) {
    if (wsTextEl) wsTextEl.textContent = connected ? "Live" : "Disconnected";
    if (wsDotEl) {
      wsDotEl.className = "dot";
    }
    statusEl?.classList.toggle("connected", connected);
  }

  function formatNumber(value, digits = 1) {
    if (!Number.isFinite(value)) return "--";
    return value.toFixed(digits);
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes)) return "--";
    if (bytes < 1024) return `${bytes} B`;
    const units = ["KB", "MB", "GB", "TB"];
    let value = bytes / 1024;
    let idx = 0;
    while (value >= 1024 && idx < units.length - 1) {
      value /= 1024;
      idx += 1;
    }
    return `${value.toFixed(2)} ${units[idx]}`;
  }

  function timeLabel(ts) {
    const date = new Date(ts);
    return date.toLocaleTimeString();
  }

  function secondsAgo(ts) {
    if (!ts) return null;
    return Math.max(0, Math.round((Date.now() - ts) / 1000));
  }

  function updateOnlineStatus() {
    const age = secondsAgo(lastStatusSeen);
    if (age === null) {
      lastSeenEl.textContent = "--";
      onlineChipEl.textContent = "--";
      onlineChipEl.className = "status-chip";
      return;
    }

    lastSeenEl.textContent = `${age}s ago`;
    log("status age", age);

    if (age <= 25) {
      onlineChipEl.textContent = "Online";
      onlineChipEl.className = "status-chip online";
    } else if (age <= 60) {
      onlineChipEl.textContent = "Warning";
      onlineChipEl.className = "status-chip warn";
    } else {
      onlineChipEl.textContent = "Offline";
      onlineChipEl.className = "status-chip offline";
    }
  }

  function updateStateBadge(state) {
    stateBadgeEl.textContent = state || "--";
    const base = "badge";
    const map = {
      IDLE: "state-idle",
      WARMUP: "state-warmup",
      SCANNING: "state-scanning",
      COOLDOWN: "state-cooldown",
      ERROR: "state-error",
    };
    stateBadgeEl.className = `${base} ${map[state] || "state-idle"}`;
  }

  function createLineChart(ctx, { labels, colors, suggestedMin, suggestedMax, unit }) {
    return new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: labels.map((label, idx) => ({
          label,
          data: [],
          borderColor: colors[idx % colors.length],
          backgroundColor: "rgba(124, 58, 237, 0.12)",
          tension: 0.32,
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 3,
          fill: false,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          legend: {
            labels: { color: "#cbd5f5" },
          },
        },
        scales: {
          x: {
            ticks: { color: "#94a3b8" },
            grid: { color: "rgba(148, 163, 184, 0.12)" },
          },
          y: {
            ticks: {
              color: "#94a3b8",
              callback: (value) => (unit ? `${value}${unit}` : value),
            },
            grid: { color: "rgba(148, 163, 184, 0.12)" },
            suggestedMin,
            suggestedMax,
          },
        },
      },
    });
  }

  function createGauge(ctx, { min, max, color }) {
    const chart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["value", "remaining"],
        datasets: [
          {
            data: [0, 100],
            backgroundColor: [color, "rgba(148, 163, 184, 0.2)"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        rotation: -90,
        circumference: 180,
        cutout: "70%",
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
      },
    });

    return {
      chart,
      min,
      max,
      baseColor: color,
    };
  }

  function setGauge(gauge, value, { warn, high, invert }) {
    if (!Number.isFinite(value)) {
      gauge.chart.data.datasets[0].data = [0, 100];
      gauge.chart.update("none");
      return;
    }

    const range = gauge.max - gauge.min;
    const clamped = Math.min(gauge.max, Math.max(gauge.min, value));
    const pct = ((clamped - gauge.min) / range) * 100;
    gauge.chart.data.datasets[0].data = [pct, 100 - pct];

    let color = gauge.baseColor;
    if (warn !== undefined && high !== undefined) {
      if (invert) {
        if (value <= high) {
          color = "#ef4444";
        } else if (value <= warn) {
          color = "#f59e0b";
        }
      } else {
        if (value >= high) {
          color = "#ef4444";
        } else if (value >= warn) {
          color = "#f59e0b";
        }
      }
    }

    gauge.chart.data.datasets[0].backgroundColor[0] = color;
    gauge.chart.update("none");
  }

  function pushPoint(chart, label, values, fieldOrder) {
    chart.data.labels.push(label);
    chart.data.datasets.forEach((dataset, idx) => {
      const field = fieldOrder[idx];
      dataset.data.push(values[field] ?? null);
    });

    if (chart.data.labels.length > maxPoints) {
      chart.data.labels.shift();
      chart.data.datasets.forEach((dataset) => dataset.data.shift());
    }

    chart.update("none");
  }

  function pushStatePoint(chart, label, stateValue) {
    chart.data.labels.push(label);
    chart.data.datasets[0].data.push(stateValue);
    if (chart.data.labels.length > maxPoints) {
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
    }
    chart.update("none");
  }

  const gauges = {
    coil: createGauge(document.getElementById("gauge-coil"), {
      min: 24,
      max: 60,
      color: "#38bdf8",
    }),
    helium: createGauge(document.getElementById("gauge-helium"), {
      min: 0,
      max: 100,
      color: "#22c55e",
    }),
    rf: createGauge(document.getElementById("gauge-rf"), {
      min: 0,
      max: 100,
      color: "#f59e0b",
    }),
    vibration: createGauge(document.getElementById("gauge-vibration"), {
      min: 0,
      max: 0.6,
      color: "#a855f7",
    }),
  };

  const tempChart = createLineChart(document.getElementById("chart-temps"), {
    labels: ["coil_temp_c", "gradient_temp_c"],
    colors: ["#38bdf8", "#f97316"],
    suggestedMin: 20,
    suggestedMax: 80,
    unit: "°C",
  });

  const heliumChart = createLineChart(document.getElementById("chart-helium"), {
    labels: ["helium_level_pct"],
    colors: ["#22c55e"],
    suggestedMin: 20,
    suggestedMax: 100,
    unit: "%",
  });

  const rfChart = createLineChart(document.getElementById("chart-rf"), {
    labels: ["rf_power_pct"],
    colors: ["#f59e0b"],
    suggestedMin: 0,
    suggestedMax: 100,
    unit: "%",
  });

  const vibrationChart = createLineChart(
    document.getElementById("chart-vibration"),
    {
      labels: ["vibration_g"],
      colors: ["#a855f7"],
      suggestedMin: 0,
      suggestedMax: 0.6,
      unit: "g",
    }
  );

  const magChart = createLineChart(document.getElementById("chart-mag"), {
    labels: ["mag_field_t"],
    colors: ["#60a5fa"],
    suggestedMin: 1.45,
    suggestedMax: 1.55,
    unit: "T",
  });

  const stateChart = new Chart(document.getElementById("chart-state"), {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "state",
          data: [],
          borderColor: "#38bdf8",
          backgroundColor: "rgba(56, 189, 248, 0.2)",
          stepped: true,
          borderWidth: 2,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          ticks: { color: "#94a3b8" },
          grid: { color: "rgba(148, 163, 184, 0.12)" },
        },
        y: {
          min: 0,
          max: 4,
          ticks: {
            color: "#94a3b8",
            callback: (value) => stateLabels[value] || "",
          },
          grid: { color: "rgba(148, 163, 184, 0.12)" },
        },
      },
    },
  });

  const ipfixRateChart = createLineChart(
    document.getElementById("chart-ipfix-rate"),
    {
      labels: ["flowRate"],
      colors: ["#38bdf8"],
      suggestedMin: 0,
      suggestedMax: 0.1,
      unit: "",
    }
  );

  const ipfixBytesChart = createLineChart(
    document.getElementById("chart-ipfix-bytes"),
    {
      labels: ["bytes"],
      colors: ["#22c55e"],
      suggestedMin: 0,
      suggestedMax: 1000000,
      unit: "",
    }
  );


  const riskChart = createLineChart(document.getElementById("chart-risk"), {
    labels: ["anomalyScore"],
    colors: ["#ef4444"],
    suggestedMin: 0,
    suggestedMax: 100,
    unit: "",
  });

  const trafficChart = createLineChart(document.getElementById("chart-traffic"), {
    labels: ["bytes"],
    colors: ["#0ea5e9"],
    suggestedMin: 0,
    suggestedMax: 1000000,
    unit: "",
  });

  function updateDynamicYAxis(chart, fallbackMax = 1) {
    const values = chart.data.datasets
      .flatMap((dataset) => dataset.data)
      .filter((value) => Number.isFinite(value));
    const maxValue = values.length ? Math.max(...values) : fallbackMax;
    chart.options.scales.y.min = 0;
    chart.options.scales.y.max = Math.max(fallbackMax, maxValue * 1.2);
  }

  function updateGauges(point) {
    log("update gauges", point);
    if (point.coil_temp_c !== undefined) {
      coilTempValueEl.textContent = `${formatNumber(point.coil_temp_c, 1)} °C`;
      setGauge(gauges.coil, point.coil_temp_c, { warn: 45, high: 55 });
    }
    if (point.helium_level_pct !== undefined) {
      heliumValueEl.textContent = `${formatNumber(point.helium_level_pct, 1)} %`;
      setGauge(gauges.helium, point.helium_level_pct, {
        warn: 50,
        high: 30,
        invert: true,
      });
    }
    if (point.rf_power_pct !== undefined) {
      rfValueEl.textContent = `${formatNumber(point.rf_power_pct, 1)} %`;
      setGauge(gauges.rf, point.rf_power_pct, {});
    }
    if (point.vibration_g !== undefined) {
      vibrationValueEl.textContent = `${formatNumber(point.vibration_g, 3)} g`;
      setGauge(gauges.vibration, point.vibration_g, { warn: 0.25, high: 0.4 });
    }
  }

  function updateTablePosition(value) {
    log("update table pos", value);
    if (!Number.isFinite(value)) return;
    const clamped = Math.min(1200, Math.max(0, value));
    const pct = (clamped / 1200) * 100;
    tableFillEl.style.width = `${pct}%`;
    tableMarkerEl.style.left = `${pct}%`;
    tableValueEl.textContent = `${Math.round(clamped)} mm`;
  }


  function updateVitals(point) {
    if (point.coil_temp_c !== undefined && vitalsTempEl) {
      vitalsTempEl.textContent = `${formatNumber(point.coil_temp_c, 1)} °C`;
    }
    if (point.spo2 !== undefined && vitalsSpO2El) {
      vitalsSpO2El.textContent = `${formatNumber(point.spo2, 0)} %`;
    }
    if (point.heart_rate !== undefined && vitalsHeartEl) {
      vitalsHeartEl.textContent = `${formatNumber(point.heart_rate, 0)} bpm`;
    }
    if (point.resp_rate !== undefined && vitalsRespEl) {
      vitalsRespEl.textContent = `${formatNumber(point.resp_rate, 0)} rpm`;
    }
  }

  function renderMainEvents() {
    if (!mainEventsEl) return;
    mainEventsEl.innerHTML = "";
    const recentCyber = cyberHistory.slice(-6).reverse();
    const recentAlerts = alerts.slice(-6).reverse();
    const items = [];

    recentCyber.forEach((item) => {
      items.push({
        t: item.t,
        severity: item.severity || (item.isAttack ? "high" : "low"),
        title: item.isAttack ? item.attackCategory || "attack" : "anomaly watch",
        details: `${item.deviceIp || "--"} → ${item.destinationIp || "--"}`,
        meta: `${formatBytes(item.bytes || 0)} · ${item.packets || 0} pkts`,
      });
    });

    recentAlerts.forEach((item) => {
      items.push({
        t: item.t,
        severity: item.severity || "medium",
        title: item.code || "alert",
        details: item.details || "--",
        meta: item.state || "--",
      });
    });

    items
      .sort((a, b) => (b.t || 0) - (a.t || 0))
      .slice(0, 8)
      .forEach((item) => {
        const row = document.createElement("div");
        row.className = "main-event";
        row.innerHTML = `
          <div class="event-meta">${item.t ? timeLabel(item.t) : "--"}</div>
          <div><span class="tag ${item.severity}">${item.severity}</span></div>
          <div>
            <div>${item.title}</div>
            <div class="event-meta">${item.details}</div>
          </div>
          <div class="event-meta">${item.meta}</div>
        `;
        mainEventsEl.appendChild(row);
      });
  }

  function applyCyber(point) {
    if (!point) return;
    cyberHistory.push(point);
    if (cyberHistory.length > maxPoints) cyberHistory.shift();

    const label = timeLabel(point.t || Date.now());
    pushPoint(riskChart, label, point, ["anomalyScore"]);
    pushPoint(trafficChart, label, point, ["bytes"]);
    updateDynamicYAxis(riskChart, 100);
    updateDynamicYAxis(trafficChart, 1000);

    if (anomalyScoreEl) anomalyScoreEl.textContent = formatNumber(point.anomalyScore || 0, 1);
    if (attackCategoryEl) attackCategoryEl.textContent = point.attackCategory || "normal";
    if (cyberConfidenceEl) cyberConfidenceEl.textContent = `${Math.round((point.confidence || 0) * 100)}%`;
    if (cyberBytesEl) cyberBytesEl.textContent = formatBytes(point.bytes || 0);
    if (cyberPacketsEl) cyberPacketsEl.textContent = `${point.packets || 0}`;
    if (cyberDeviceIpEl) cyberDeviceIpEl.textContent = point.deviceIp || "--";
    if (cyberDestinationIpEl) cyberDestinationIpEl.textContent = point.destinationIp || "--";

    if (anomalyStatusEl) {
      anomalyStatusEl.textContent = point.isAttack
        ? "Attack detected in simulated flow"
        : point.isAnomalous
        ? "Anomalous behavior detected"
        : "No anomaly in latest sample";
    }
    if (anomalyMessageEl) {
      anomalyMessageEl.textContent = point.isAttack
        ? `${point.attackCategory || "Attack"} detected from ${point.deviceIp || "--"} to ${point.destinationIp || "--"}`
        : `Latest sample from ${point.deviceIp || "--"} scored ${formatNumber(point.anomalyScore || 0, 1)} on the anomaly scale.`;
    }
    if (anomalyBannerEl) {
      anomalyBannerEl.classList.toggle("alert", Boolean(point.isAnomalous));
    }

    renderMainEvents();
  }

  function showDashboardAlert(alert) {
    if (!alertToastEl || !alert) return;

    const severity = (alert.severity || "medium").toLowerCase();
    if (alertToastTitleEl) {
      alertToastTitleEl.textContent = alert.code || "Anomaly detected";
    }
    if (alertToastMessageEl) {
      alertToastMessageEl.textContent = alert.details || "A new anomaly was detected in the monitored traffic.";
    }
    if (alertToastSeverityEl) {
      alertToastSeverityEl.textContent = severity;
      alertToastSeverityEl.className = `alert-toast-severity ${severity}`;
    }

    alertToastEl.classList.remove("hidden");
    if (alertToastTimer) {
      clearTimeout(alertToastTimer);
    }
    alertToastTimer = setTimeout(() => {
      alertToastEl.classList.add("hidden");
    }, 6000);
  }

  function renderAlerts() {
    log("render alerts", alerts.length);
    alertsBodyEl.innerHTML = "";
    const recent = alerts.slice(-alertMax).reverse();
    recent.forEach((alert) => {
      const row = document.createElement("div");
      row.className = "alerts-row";
      const severity = alert.severity || "--";
      const severityClass =
        severity === "high" ? "high" : severity === "medium" ? "medium" : "";
      row.innerHTML = `
        <span>${alert.t ? timeLabel(alert.t) : "--"}</span>
        <span class="severity ${severityClass}">${severity}</span>
        <span>${alert.code || "--"}</span>
        <span>${alert.details || "--"}</span>
        <span>${alert.state || "--"}</span>
      `;
      alertsBodyEl.appendChild(row);
    });

    const counts = alerts.reduce(
      (acc, alert) => {
        if (alert.severity === "high") acc.high += 1;
        if (alert.severity === "medium") acc.medium += 1;
        return acc;
      },
      { high: 0, medium: 0 }
    );
    alertCountsEl.textContent = `High: ${counts.high} · Medium: ${counts.medium}`;
  }

  function renderIpfixTalkers(list) {
    if (!ipfixTalkersEl) return;
    ipfixTalkersEl.innerHTML = "";
    (list || []).forEach((item) => {
      const row = document.createElement("div");
      row.className = "talker-row";
      row.innerHTML = `
        <span>${item.pair || item.ip || "--"}</span>
        <span class="bytes">${formatBytes(item.bytes || 0)}</span>
      `;
      ipfixTalkersEl.appendChild(row);
    });
  }

  function applyIpfix(point) {
    if (!point) return;
    log("ipfix", point);
    const label = timeLabel(point.t || Date.now());
    pushPoint(ipfixRateChart, label, point, ["flowRate"]);
    pushPoint(ipfixBytesChart, label, point, ["bytes"]);
    updateDynamicYAxis(ipfixRateChart, 0.05);
    updateDynamicYAxis(ipfixBytesChart, 1000);
    ipfixRateChart.update("none");
    ipfixBytesChart.update("none");
    if (ipfixFlowrateEl) {
      ipfixFlowrateEl.textContent = `${formatNumber(point.flowRate || 0, 2)} fps`;
    }
    if (ipfixBytesEl) {
      ipfixBytesEl.textContent = formatBytes(point.bytes || 0);
    }
    if (ipfixDeviceEl) {
      ipfixDeviceEl.textContent = formatBytes(point.deviceBytes || 0);
    }
    if (ipfixBrokerEl) {
      ipfixBrokerEl.textContent = formatBytes(point.brokerBytes || 0);
    }
    renderIpfixTalkers(point.topPairs || point.topTalkers || []);
  }

  function applyTelemetry(point) {
    log("telemetry", point);
    if (selectedDevice && point.device && point.device !== selectedDevice) {
      return;
    }
    latestTelemetry = { ...latestTelemetry, ...point };
    updateGauges(point);
    updateTablePosition(point.table_pos_mm);
    updateVitals(point);
    updateStateBadge(point.state || latestTelemetry.state);

    const label = timeLabel(point.t || Date.now());
    pushPoint(tempChart, label, point, ["coil_temp_c", "gradient_temp_c"]);
    pushPoint(heliumChart, label, point, ["helium_level_pct"]);
    pushPoint(rfChart, label, point, ["rf_power_pct"]);
    pushPoint(vibrationChart, label, point, ["vibration_g"]);
    pushPoint(magChart, label, point, ["mag_field_t"]);

    if (point.state && stateMap[point.state] !== undefined) {
      pushStatePoint(stateChart, label, stateMap[point.state]);
    }

    lastTickEl.textContent = timeLabel(point.t || Date.now());
  }

  function applyStatus(status) {
    log("status", status);
    if (selectedDevice && status.device && status.device !== selectedDevice) {
      return;
    }
    latestStatus = status;
    if (status.device) deviceIdEl.textContent = status.device;
    if (status.ip) deviceIpEl.textContent = status.ip;
    if (status.state) updateStateBadge(status.state);
    if (status.uptime_s !== undefined) {
      sourceNoteEl.textContent = `Uptime: ${Math.round(status.uptime_s)}s`;
    }
    lastStatusSeen = status.t || Date.now();
    updateOnlineStatus();
  }

  function applyStatePoint(point) {
    log("state point", point);
    if (!point || !point.state || stateMap[point.state] === undefined) return;
    pushStatePoint(stateChart, timeLabel(point.t), stateMap[point.state]);
  }

  function applyInit(payload) {
    log("init payload", payload);
    if (
      (payload.telemetry && payload.telemetry.length) ||
      (payload.state && payload.state.length) ||
      payload.status ||
      (payload.alerts && payload.alerts.length) ||
      (payload.ipfix && payload.ipfix.length) ||
      payload.lastIpfix
    ) {
      markRealData();
    }
    if (payload.telemetry && payload.telemetry.length) {
      payload.telemetry.forEach((point) => {
        const device = normalizeDevice(point.device);
        if (device) deviceSet.add(device);
      });
      if (!selectedDevice && deviceSet.size) {
        setSelectedDevice(null);
      }
      payload.telemetry.forEach((point) => applyTelemetry(point));
    }
    if (payload.state && payload.state.length) {
      payload.state.forEach((point) => applyStatePoint(point));
    }
    if (payload.status) {
      const device = normalizeDevice(payload.status.device);
      if (device) deviceSet.add(device);
      if (!selectedDevice && device) setSelectedDevice(device);
      applyStatus(payload.status);
    }
    if (payload.alerts) {
      alerts = payload.alerts.slice(-alertMax);
      renderAlerts();
    }
    if (payload.lastStatusSeen) {
      lastStatusSeen = payload.lastStatusSeen;
      updateOnlineStatus();
    }
    if (payload.ipfix && payload.ipfix.length) {
      payload.ipfix.forEach((point) => applyIpfix(point));
    }
    if (payload.lastIpfix) {
      applyIpfix(payload.lastIpfix);
    }
    if (payload.cyber && payload.cyber.length) {
      payload.cyber.forEach((point) => applyCyber(point));
    }
    if (payload.lastCyber) {
      applyCyber(payload.lastCyber);
    }
    updateDevicePicker();
  }

  function connect() {
    let socket = new WebSocket(wsUrl);

    socket.addEventListener("open", () => {
      console.log("[WS] connected", wsUrl);
      log("ws open");
      setStatus(true);
    });
    socket.addEventListener("close", (event) => {
      console.warn("[WS] closed", event.code, event.reason || "");
      warn("ws close", event);
      setStatus(false);
      setTimeout(connect, 2000);
    });
    socket.addEventListener("error", (err) => {
      console.error("[WS] error", err);
      errLog("ws error", err);
      setStatus(false);
    });

    socket.addEventListener("message", (event) => {
      console.log("[WS] message", event.data);
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch (err) {
        console.error("[WS] JSON parse error", err);
        errLog("ws json error", err);
        return;
      }
      if (msg.type === "init") {
        applyInit(msg.payload || {});
        return;
      }
      if (msg.type === "telemetry") {
        markRealData();
        const device = normalizeDevice(msg.payload?.device);
        if (device) {
          deviceSet.add(device);
          if (selectedDevice === null) setSelectedDevice(null);
        }
        applyTelemetry(msg.payload || {});
      }
      if (msg.type === "status") {
        markRealData();
        const device = normalizeDevice(msg.payload?.device);
        if (device) {
          deviceSet.add(device);
          if (selectedDevice === null) setSelectedDevice(null);
        }
        applyStatus(msg.payload || {});
      }
      if (msg.type === "alert") {
        markRealData();
        alerts.push(msg.payload || {});
        if (alerts.length > alertMax) alerts.shift();
        renderAlerts();
        renderMainEvents();
        showDashboardAlert(msg.payload || {});
      }
      if (msg.type === "state") {
        markRealData();
        applyStatePoint(msg.payload || {});
      }
      if (msg.type === "ipfix") {
        markRealData();
        applyIpfix(msg.payload || {});
      }
      if (msg.type === "cyber") {
        markRealData();
        applyCyber(msg.payload || {});
      }
    });
  }

  connect();
  setInterval(updateOnlineStatus, 1000);

  if (devicePickerEl) {
    devicePickerEl.addEventListener("change", (event) => {
      const value = event.target.value;
      if (value === "__all__") {
        setSelectedDevice(null);
        return;
      }
      const normalized = normalizeDevice(value);
      if (normalized) setSelectedDevice(normalized);
    });
  }

  if (sourcePickerEl) {
    sourcePickerEl.addEventListener("change", (event) => {
      setSelectedSource(event.target.value);
    });
  }

  function markRealData() {
    if (hasRealData) return;
    hasRealData = true;
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-panel");
      if (target) setActiveTab(target);
    });
  });

  setSelectedSource(selectedSource);
  setActiveTab("main-panel");
})();
