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
  const viewReportBtnEl = document.getElementById("view-report-btn");
  const reportBackdropEl = document.getElementById("report-backdrop");
  const reportDrawerEl = document.getElementById("report-drawer");
  const reportCloseBtnEl = document.getElementById("report-close-btn");
  const reportDownloadBtnEl = document.getElementById("report-download-btn");
  const reportTitleEl = document.getElementById("report-title");
  const reportSubtitleEl = document.getElementById("report-subtitle");
  const reportSeverityEl = document.getElementById("report-severity");
  const reportAttackCategoryEl = document.getElementById("report-attack-category");
  const reportConfidenceEl = document.getElementById("report-confidence");
  const reportTriggeredByEl = document.getElementById("report-triggered-by");
  const reportAffectedPartsEl = document.getElementById("report-affected-parts");
  const reportDeviceNameEl = document.getElementById("report-device-name");
  const reportDetectedAtEl = document.getElementById("report-detected-at");
  const reportIncidentIdEl = document.getElementById("report-incident-id");
  const reportActionsEl = document.getElementById("report-actions");
  const anomalyScoreEl = document.getElementById("anomaly-score");
  const attackCategoryEl = document.getElementById("attack-category");
  const cyberConfidenceEl = document.getElementById("cyber-confidence");
  const heroDeviceEl = document.getElementById("hero-device");
  const heroLocationEl = document.getElementById("hero-location");
  const heroTriggeredByEl = document.getElementById("hero-triggered-by");
  const statActiveIncidentsEl = document.getElementById("stat-active-incidents");
  const statWatchDevicesEl = document.getElementById("stat-watch-devices");
  const statMonitoredDevicesEl = document.getElementById("stat-monitored-devices");
  const statObservedTrafficEl = document.getElementById("stat-observed-traffic");
  const focusDeviceEl = document.getElementById("focus-device");
  const focusLocationEl = document.getElementById("focus-location");
  const focusSourceEl = document.getElementById("focus-source");
  const focusTriggeredEl = document.getElementById("focus-triggered");
  const focusPathEl = document.getElementById("focus-path");
  const focusObservedEl = document.getElementById("focus-observed");
  const mainTopPathsEl = document.getElementById("main-top-paths");
  const cyberBytesEl = document.getElementById("cyber-bytes");
  const cyberPacketsEl = document.getElementById("cyber-packets");
  const cyberDeviceIpEl = document.getElementById("cyber-device-ip");
  const cyberSourceEl = document.getElementById("cyber-source");
  const cyberLocationEl = document.getElementById("cyber-location");
  const cyberDestinationIpEl = document.getElementById("cyber-destination-ip");
  const vitalsTempEl = document.getElementById("vitals-temp");
  const vitalsSpO2El = document.getElementById("vitals-spo2");
  const vitalsHeartEl = document.getElementById("vitals-heart");
  const vitalsRespEl = document.getElementById("vitals-resp");
  const mainEventsEl = document.getElementById("main-events");
  const modelNetworkCardEl = document.getElementById("model-network-card");
  const modelProcessCardEl = document.getElementById("model-process-card");
  const modelMemoryCardEl = document.getElementById("model-memory-card");
  const modelNetworkAnomalyEl = document.getElementById("model-network-anomaly");
  const modelNetworkAttackEl = document.getElementById("model-network-attack");
  const modelNetworkConfidenceEl = document.getElementById("model-network-confidence");
  const modelProcessAnomalyEl = document.getElementById("model-process-anomaly");
  const modelProcessAttackEl = document.getElementById("model-process-attack");
  const modelProcessConfidenceEl = document.getElementById("model-process-confidence");
  const modelMemoryAnomalyEl = document.getElementById("model-memory-anomaly");
  const modelMemoryAttackEl = document.getElementById("model-memory-attack");
  const modelMemoryConfidenceEl = document.getElementById("model-memory-confidence");
  const fusionAlertCardEl = document.getElementById("fusion-alert-card");
  const fusionAlertFlagEl = document.getElementById("fusion-alert-flag");
  const fusionSeverityEl = document.getElementById("fusion-severity");
  const fusionTriggeredByEl = document.getElementById("fusion-triggered-by");
  const fusionAffectedPartsEl = document.getElementById("fusion-affected-parts");
  const fusionReportTextEl = document.getElementById("fusion-report-text");
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
  const controlPanelEl = document.getElementById("control-panel");
  const overviewPanelEl = document.getElementById("overview-panel");
  const networkPanelEl = document.getElementById("network-panel");
  const devicePanelEl = document.getElementById("device-panel");
  const tabButtons = document.querySelectorAll(".tab-btn");
  const controlDeviceCountEl = document.getElementById("control-device-count");
  const controlStatusEl = document.getElementById("control-status");
  const controlPreviewEl = document.getElementById("control-preview");
  const globalAttackTypeEl = document.getElementById("global-attack-type");
  const globalAttackCustomWrapEl = document.getElementById(
    "global-attack-custom-wrap"
  );
  const globalAttackCustomEl = document.getElementById("global-attack-custom");
  const globalSourceEl = document.getElementById("global-source");
  const globalLocationEl = document.getElementById("global-location");
  const controlDeviceListEl = document.getElementById("control-device-list");
  const controlApplyBtnEl = document.getElementById("control-apply-btn");
  const controlResetBtnEl = document.getElementById("control-reset-btn");

  const maxPoints = config.maxPoints || 300;
  const alertMax = config.alertMax || 100;
  const debug = config.debug !== false;
  const attackPresets = [
    "normal",
    "dos",
    "ransomware",
    "mitm",
    "malware",
    "data exfiltration",
  ];
  const controlProfiles = {
    steady: {
      label: "Steady Ops",
      hint: "Mostly normal behavior with rare alerts.",
      probabilities: { normal: 88, abnormal: 9, attack: 3 },
    },
    watch: {
      label: "Watchlist",
      hint: "Elevated suspicious activity with occasional attacks.",
      probabilities: { normal: 58, abnormal: 27, attack: 15 },
    },
    incident: {
      label: "Incident Drill",
      hint: "Frequent attack conditions for demos and response walkthroughs.",
      probabilities: { normal: 20, abnormal: 20, attack: 60 },
    },
  };

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
  let latestIpfixPoint = null;
  let alerts = [];
  let selectedDevice = null;
  const deviceSet = new Set();
  let selectedSource = "all";
  let hasRealData = false;
  let cyberHistory = [];
  const latestCyberByDevice = new Map();
  let alertToastTimer = null;
  let reportHideTimer = null;
  let currentReportPoint = null;
  let selectedReportKey = null;
  let reportSelectionLocked = false;
  let controlState = {
    enabled: true,
    deviceCount: 4,
    globalScenario: {
      attackType: "dos",
      affectedParts: ["process"],
      source: "Control Generator",
      location: "Ward A",
      probabilities: { normal: 70, abnormal: 20, attack: 10 },
    },
    deviceOverrides: {},
  };

  function normalizeDevice(value) {
    if (typeof value !== "string" || !value.trim()) return null;
    return value.trim();
  }

  function createDefaultScenario() {
    return {
      attackType: "dos",
      affectedParts: ["process"],
      source: "Control Generator",
      location: "Ward A",
      probabilities: { normal: 70, abnormal: 20, attack: 10 },
    };
  }

  function normalizeScenario(input) {
    const parts = Array.isArray(input?.affectedParts)
      ? input.affectedParts.filter((part) =>
          ["network", "process", "memory"].includes(part)
        )
      : ["process"];
    let attackType = String(input?.attackType || "").trim().toLowerCase();
    if (!attackType || attackType === "custom") attackType = "dos";
    const probabilitiesInput = input?.probabilities || {};
    const probabilities = {
      normal: Math.max(0, Number(probabilitiesInput.normal) || 0),
      abnormal: Math.max(0, Number(probabilitiesInput.abnormal) || 0),
      attack: Math.max(0, Number(probabilitiesInput.attack) || 0),
    };
    if (probabilities.normal + probabilities.abnormal + probabilities.attack <= 0) {
      probabilities.normal = 70;
      probabilities.abnormal = 20;
      probabilities.attack = 10;
    }
    return {
      attackType,
      affectedParts: parts.length ? parts : ["process"],
      source: String(input?.source || "Control Generator").trim() || "Control Generator",
      location: String(input?.location || "Ward A").trim() || "Ward A",
      probabilities,
    };
  }

  function getDeviceNames(deviceCount = 4) {
    return Array.from({ length: Math.max(1, deviceCount) }, (_, idx) => `iomt-node-${idx + 1}`);
  }

  function clampPercent(value) {
    return Math.max(0, Math.min(100, Number.parseInt(value, 10) || 0));
  }

  function distributePercentages(total, weights) {
    if (total <= 0) return weights.map(() => 0);
    const safeWeights = weights.map((weight) => Math.max(0, Number(weight) || 0));
    const weightTotal = safeWeights.reduce((sum, weight) => sum + weight, 0);
    if (weightTotal <= 0) {
      const even = Math.floor(total / safeWeights.length);
      const remainder = total - even * safeWeights.length;
      return safeWeights.map((_, index) => even + (index < remainder ? 1 : 0));
    }
    const raw = safeWeights.map((weight) => (weight / weightTotal) * total);
    const floored = raw.map((value) => Math.floor(value));
    let remainder = total - floored.reduce((sum, value) => sum + value, 0);
    const order = raw
      .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
      .sort((left, right) => right.fraction - left.fraction);
    order.forEach(({ index }) => {
      if (remainder <= 0) return;
      floored[index] += 1;
      remainder -= 1;
    });
    return floored;
  }

  function getProbabilityElements(prefix) {
    return {
      normalEl: document.getElementById(`${prefix}-prob-normal`),
      abnormalEl: document.getElementById(`${prefix}-prob-abnormal`),
      attackEl: document.getElementById(`${prefix}-prob-attack`),
      readoutEl: document.getElementById(`${prefix}-prob-readout`),
    };
  }

  function getProbabilityValues(prefix) {
    const { normalEl, abnormalEl, attackEl } = getProbabilityElements(prefix);
    return {
      normal: clampPercent(normalEl?.value),
      abnormal: clampPercent(abnormalEl?.value),
      attack: clampPercent(attackEl?.value),
    };
  }

  function setProbabilityValues(prefix, probabilities) {
    const { normalEl, abnormalEl, attackEl } = getProbabilityElements(prefix);
    if (normalEl) normalEl.value = String(clampPercent(probabilities.normal));
    if (abnormalEl) abnormalEl.value = String(clampPercent(probabilities.abnormal));
    if (attackEl) attackEl.value = String(clampPercent(probabilities.attack));
  }

  function describeProfile(probabilities) {
    const { normal, abnormal, attack } = probabilities;
    if (attack >= 50) return "Attack-heavy profile";
    if (abnormal >= 25) return "Elevated monitoring profile";
    if (normal >= 70) return "Steady monitoring profile";
    return "Balanced mixed profile";
  }

  function buildProbabilitySummary(probabilities) {
    return `Normal ${probabilities.normal}% · Abnormal ${probabilities.abnormal}% · Attack ${probabilities.attack}%`;
  }

  function getMatchingProfileKey(probabilities) {
    return (
      Object.entries(controlProfiles).find(([, profile]) => {
        const profileProb = profile.probabilities;
        return (
          profileProb.normal === probabilities.normal &&
          profileProb.abnormal === probabilities.abnormal &&
          profileProb.attack === probabilities.attack
        );
      })?.[0] || null
    );
  }

  function updatePresetButtons(prefix) {
    const probabilities = getProbabilityValues(prefix);
    const activeProfile = getMatchingProfileKey(probabilities);
    document
      .querySelectorAll(`.control-preset-btn[data-prefix="${prefix}"]`)
      .forEach((button) => {
        button.classList.toggle(
          "active",
          button.getAttribute("data-profile") === activeProfile
        );
      });
  }

  function updateControlPreview() {
    if (!controlPreviewEl) return;
    const deviceCount =
      Math.min(12, Math.max(1, Number.parseInt(controlDeviceCountEl?.value || "4", 10) || 4));
    document.querySelectorAll("[data-control-device-count]").forEach((button) => {
      button.classList.toggle(
        "active",
        Number.parseInt(button.getAttribute("data-control-device-count"), 10) === deviceCount
      );
    });
    const globalScenario = readScenarioInputs("global");
    const overrideCount = getDeviceNames(deviceCount).filter((deviceName) => {
      return document.getElementById(`${deviceName}-enabled`)?.checked;
    }).length;
    controlPreviewEl.innerHTML = `
      <div class="control-preview-line">
        <span class="control-preview-label">Fleet</span>
        <strong>${deviceCount} devices</strong>
      </div>
      <div class="control-preview-line">
        <span class="control-preview-label">Global profile</span>
        <strong>${describeProfile(globalScenario.probabilities)}</strong>
      </div>
      <div class="control-preview-line">
        <span class="control-preview-label">Overrides</span>
        <strong>${overrideCount} device${overrideCount === 1 ? "" : "s"}</strong>
      </div>
      <div class="control-preview-line">
        <span class="control-preview-label">Attack label</span>
        <strong>${formatAttackLabel(globalScenario.attackType)}</strong>
      </div>
    `;
  }

  function refreshDeviceSummary(deviceName) {
    const enabledEl = document.getElementById(`${deviceName}-enabled`);
    const summaryBadgeEl = document.getElementById(`${deviceName}-summary-badge`);
    const summaryHintEl = document.getElementById(`${deviceName}-summary-hint`);
    const summaryLocationEl = document.getElementById(`${deviceName}-summary-location`);
    const summaryMixEl = document.getElementById(`${deviceName}-summary-mix`);
    const scenario = readScenarioInputs(deviceName);
    const enabled = Boolean(enabledEl?.checked);
    if (summaryBadgeEl) {
      summaryBadgeEl.textContent = enabled ? "Override" : "Global";
      summaryBadgeEl.classList.toggle("override", enabled);
    }
    if (summaryHintEl) {
      summaryHintEl.textContent = enabled
        ? "Custom override active"
        : "Using global default";
    }
    if (summaryLocationEl) {
      summaryLocationEl.textContent = scenario.location || "Ward A";
    }
    if (summaryMixEl) {
      summaryMixEl.textContent = buildProbabilitySummary(scenario.probabilities);
    }
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
    if (controlPanelEl) controlPanelEl.classList.toggle("hidden", panelId !== "control-panel");
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

  function dateTimeLabel(ts) {
    const date = new Date(ts);
    return date.toLocaleString();
  }

  function formatAttackLabel(value) {
    const text = String(value || "normal").replace(/[_-]+/g, " ").trim();
    if (!text) return "Normal";
    return text.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function getSeverity(value, fallback = "low") {
    const severity = String(value || fallback).toLowerCase();
    if (severity === "high" || severity === "medium" || severity === "low") {
      return severity;
    }
    return fallback;
  }

  function getSeverityRank(value) {
    const severity = getSeverity(value, "low");
    if (severity === "high") return 3;
    if (severity === "medium") return 2;
    return 1;
  }

  function updateModelCard(cardEl, anomalyEl, attackEl, confidenceEl, model) {
    if (!model) {
      if (anomalyEl) anomalyEl.textContent = "--";
      if (attackEl) attackEl.textContent = "--";
      if (confidenceEl) confidenceEl.textContent = "--";
      if (cardEl) {
        cardEl.classList.remove("model-alert", "model-attack");
      }
      return;
    }
    const anomaly = Boolean(model.anomaly);
    if (anomalyEl) anomalyEl.textContent = anomaly ? "YES" : "NO";
    if (attackEl) attackEl.textContent = formatAttackLabel(model.attackType || "normal");
    if (confidenceEl) confidenceEl.textContent = `${Math.round((model.confidence || 0) * 100)}%`;
    if (cardEl) {
      cardEl.classList.toggle("model-alert", anomaly);
      cardEl.classList.toggle("model-attack", Boolean(model.attacked));
    }
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

  function resetClientState() {
    latestStatus = null;
    latestTelemetry = {};
    latestIpfixPoint = null;
    alerts = [];
    cyberHistory = [];
    latestCyberByDevice.clear();
    selectedDevice = null;
    deviceSet.clear();
    currentReportPoint = null;
    selectedReportKey = null;
    reportSelectionLocked = false;
    lastStatusSeen = 0;
    resetCharts();
    if (mainEventsEl) mainEventsEl.innerHTML = "";
    updateDevicePicker();
    if (deviceIdEl) deviceIdEl.textContent = "--";
    if (deviceIpEl) deviceIpEl.textContent = "--";
    if (sourceNoteEl) sourceNoteEl.textContent = "";
    updateStateBadge(null);
    updateOnlineStatus();
    renderMainSnapshot();
  }

  function setControlStatus(message, isError = false) {
    if (!controlStatusEl) return;
    controlStatusEl.textContent = message;
    controlStatusEl.classList.toggle("error", isError);
  }

  function syncAttackInput(selectEl, customWrapEl, customInputEl) {
    if (!selectEl || !customWrapEl) return;
    const showCustom = selectEl.value === "custom";
    customWrapEl.classList.toggle("hidden", !showCustom);
    if (!showCustom && customInputEl) customInputEl.value = customInputEl.value.trim();
  }

  function rebalanceProbabilities(prefix, changedKind) {
    const probabilities = getProbabilityValues(prefix);
    const kinds = ["normal", "abnormal", "attack"];
    const changedValue = clampPercent(probabilities[changedKind]);
    const otherKinds = kinds.filter((kind) => kind !== changedKind);
    const remainder = 100 - changedValue;
    const redistributed = distributePercentages(
      remainder,
      otherKinds.map((kind) => probabilities[kind])
    );
    const nextProbabilities = {
      [changedKind]: changedValue,
      [otherKinds[0]]: redistributed[0],
      [otherKinds[1]]: redistributed[1],
    };
    setProbabilityValues(prefix, nextProbabilities);
    updateProbabilityReadout(prefix);
  }

  function applyScenarioProfile(prefix, profileKey) {
    const profile = controlProfiles[profileKey];
    if (!profile) return;
    setProbabilityValues(prefix, profile.probabilities);
    if (prefix !== "global") {
      const enabledEl = document.getElementById(`${prefix}-enabled`);
      if (enabledEl && !enabledEl.checked) enabledEl.checked = true;
      setOverrideInputsDisabled(prefix, false);
      refreshDeviceSummary(prefix);
    }
    updateProbabilityReadout(prefix);
    updateControlPreview();
  }

  function setScenarioInputs(prefix, scenario) {
    const attackTypeEl = document.getElementById(`${prefix}-attack-type`);
    const attackCustomEl = document.getElementById(`${prefix}-attack-custom`);
    const attackCustomWrapEl = document.getElementById(`${prefix}-attack-custom-wrap`);
    const sourceEl = document.getElementById(`${prefix}-source`);
    const locationEl = document.getElementById(`${prefix}-location`);
    const normalEl = document.getElementById(`${prefix}-prob-normal`);
    const abnormalEl = document.getElementById(`${prefix}-prob-abnormal`);
    const attackEl = document.getElementById(`${prefix}-prob-attack`);
    if (attackTypeEl) {
      const presetMatch = attackPresets.includes(scenario.attackType)
        ? scenario.attackType
        : "custom";
      attackTypeEl.value = presetMatch;
    }
    if (attackCustomEl) {
      attackCustomEl.value =
        !attackPresets.includes(scenario.attackType) ? scenario.attackType : "";
    }
    if (attackCustomWrapEl) {
      syncAttackInput(attackTypeEl, attackCustomWrapEl, attackCustomEl);
    }
    if (sourceEl) sourceEl.value = scenario.source || "Control Generator";
    if (locationEl) locationEl.value = scenario.location || "Ward A";
    setProbabilityValues(prefix, {
      normal: scenario.probabilities?.normal ?? 70,
      abnormal: scenario.probabilities?.abnormal ?? 20,
      attack: scenario.probabilities?.attack ?? 10,
    });
    document
      .querySelectorAll(`input[data-part-group="${prefix}"]`)
      .forEach((input) => {
        input.checked = scenario.affectedParts.includes(input.value);
      });
    updateProbabilityReadout(prefix);
  }

  function readScenarioInputs(prefix) {
    const attackTypeEl = document.getElementById(`${prefix}-attack-type`);
    const attackCustomEl = document.getElementById(`${prefix}-attack-custom`);
    const sourceEl = document.getElementById(`${prefix}-source`);
    const locationEl = document.getElementById(`${prefix}-location`);
    const normalEl = document.getElementById(`${prefix}-prob-normal`);
    const abnormalEl = document.getElementById(`${prefix}-prob-abnormal`);
    const attackEl = document.getElementById(`${prefix}-prob-attack`);
    let attackType = attackTypeEl ? attackTypeEl.value : "dos";
    if (attackType === "custom") {
      attackType = attackCustomEl?.value?.trim() || "custom attack";
    }
    const affectedParts = Array.from(
      document.querySelectorAll(`input[data-part-group="${prefix}"]:checked`)
    ).map((input) => input.value);
    return normalizeScenario({
      attackType,
      affectedParts,
      source: sourceEl?.value?.trim() || "Control Generator",
      location: locationEl?.value?.trim() || "Ward A",
      probabilities: {
        normal: Number(normalEl?.value || 0),
        abnormal: Number(abnormalEl?.value || 0),
        attack: Number(attackEl?.value || 0),
      },
    });
  }

  function updateProbabilityReadout(prefix) {
    const { readoutEl } = getProbabilityElements(prefix);
    if (!readoutEl) return;
    const probabilities = getProbabilityValues(prefix);
    readoutEl.innerHTML = `
      <div class="control-prob-meter" aria-hidden="true">
        <span class="control-prob-segment normal" style="width:${probabilities.normal}%"></span>
        <span class="control-prob-segment abnormal" style="width:${probabilities.abnormal}%"></span>
        <span class="control-prob-segment attack" style="width:${probabilities.attack}%"></span>
      </div>
      <div class="control-prob-values">
        <span>Normal ${probabilities.normal}%</span>
        <span>Abnormal ${probabilities.abnormal}%</span>
        <span>Attack ${probabilities.attack}%</span>
      </div>
      <div class="control-prob-caption">${describeProfile(probabilities)}</div>
    `;
    updatePresetButtons(prefix);
  }

  function setOverrideInputsDisabled(deviceName, disabled) {
    const controlsEl = document.getElementById(`${deviceName}-controls`);
    const summaryBadgeEl = document.getElementById(`${deviceName}-summary-badge`);
    const summaryHintEl = document.getElementById(`${deviceName}-summary-hint`);
    if (!controlsEl) return;
    controlsEl.classList.toggle("is-disabled", disabled);
    controlsEl
      .querySelectorAll("input, select, button")
      .forEach((element) => {
        if (element.id === `${deviceName}-enabled`) return;
        element.disabled = disabled;
      });
    if (summaryBadgeEl) {
      summaryBadgeEl.textContent = disabled ? "Global" : "Override";
      summaryBadgeEl.classList.toggle("override", !disabled);
    }
    if (summaryHintEl) {
      summaryHintEl.textContent = disabled
        ? "Using global default"
        : "Custom override active";
    }
    refreshDeviceSummary(deviceName);
  }

  function attachScenarioControlListeners(prefix, { autoEnableOverride = false } = {}) {
    const attackTypeEl = document.getElementById(`${prefix}-attack-type`);
    const customWrapEl = document.getElementById(`${prefix}-attack-custom-wrap`);
    const customInputEl = document.getElementById(`${prefix}-attack-custom`);
    const enableOverride = () => {
      if (!autoEnableOverride) return;
      const enabledEl = document.getElementById(`${prefix}-enabled`);
      if (enabledEl && !enabledEl.checked) {
        enabledEl.checked = true;
        setOverrideInputsDisabled(prefix, false);
      }
    };

    attackTypeEl?.addEventListener("change", () => {
      syncAttackInput(attackTypeEl, customWrapEl, customInputEl);
      enableOverride();
      if (autoEnableOverride) refreshDeviceSummary(prefix);
      updateControlPreview();
    });

    customInputEl?.addEventListener("input", () => {
      enableOverride();
      if (autoEnableOverride) refreshDeviceSummary(prefix);
      updateControlPreview();
    });

    ["source", "location"].forEach((field) => {
      document.getElementById(`${prefix}-${field}`)?.addEventListener("input", () => {
        enableOverride();
        if (autoEnableOverride) refreshDeviceSummary(prefix);
        updateControlPreview();
      });
    });

    ["normal", "abnormal", "attack"].forEach((kind) => {
      document.getElementById(`${prefix}-prob-${kind}`)?.addEventListener("input", () => {
        enableOverride();
        rebalanceProbabilities(prefix, kind);
        if (autoEnableOverride) refreshDeviceSummary(prefix);
        updateControlPreview();
      });
    });

    document
      .querySelectorAll(`input[data-part-group="${prefix}"]`)
      .forEach((input) => {
        input.addEventListener("change", () => {
          enableOverride();
          if (autoEnableOverride) refreshDeviceSummary(prefix);
          updateControlPreview();
        });
      });

    document
      .querySelectorAll(`.control-preset-btn[data-prefix="${prefix}"]`)
      .forEach((button) => {
        button.addEventListener("click", () => {
          applyScenarioProfile(prefix, button.getAttribute("data-profile"));
        });
      });
  }

  function renderControlDevices() {
    if (!controlDeviceListEl) return;
    const deviceCount = Math.max(1, Number(controlState.deviceCount) || 4);
    const deviceNames = getDeviceNames(deviceCount);
    controlDeviceListEl.innerHTML = "";
    deviceNames.forEach((deviceName) => {
      const override = controlState.deviceOverrides?.[deviceName];
      const scenario = normalizeScenario(override?.scenario || createDefaultScenario());
      const overrideEnabled = Boolean(override?.enabled);
      const card = document.createElement("div");
      card.className = "control-device-card";
      card.innerHTML = `
        <details class="control-device-shell" ${overrideEnabled ? "open" : ""}>
          <summary class="control-device-summary">
            <div class="control-device-summary-copy">
              <h4>${deviceName}</h4>
              <p id="${deviceName}-summary-hint" class="hint">
                ${overrideEnabled ? "Custom override active" : "Using global default"}
              </p>
            </div>
            <div class="control-device-summary-meta">
              <span id="${deviceName}-summary-badge" class="control-device-badge ${overrideEnabled ? "override" : ""}">
                ${overrideEnabled ? "Override" : "Global"}
              </span>
              <span id="${deviceName}-summary-location">${scenario.location || "Ward A"}</span>
              <span id="${deviceName}-summary-mix">${buildProbabilitySummary(scenario.probabilities)}</span>
            </div>
          </summary>
          <div class="control-device-body">
            <div class="control-device-head">
              <label class="control-switch compact">
                <input id="${deviceName}-enabled" type="checkbox" ${overrideEnabled ? "checked" : ""} />
                <span>Enable override for this device</span>
              </label>
              <div class="control-preset-group">
                <button class="control-preset-btn" type="button" data-prefix="${deviceName}" data-profile="steady">Steady Ops</button>
                <button class="control-preset-btn" type="button" data-prefix="${deviceName}" data-profile="watch">Watchlist</button>
                <button class="control-preset-btn" type="button" data-prefix="${deviceName}" data-profile="incident">Incident Drill</button>
              </div>
            </div>
            <div id="${deviceName}-prob-readout" class="control-prob-readout"></div>
            <details class="control-advanced" ${overrideEnabled ? "open" : ""}>
              <summary class="control-advanced-summary">Advanced override settings</summary>
              <div id="${deviceName}-controls" class="control-device-controls">
                <div class="control-scenario-grid">
                  <label class="control-field">
                    <span class="label">Attack type</span>
                    <select id="${deviceName}-attack-type">
                      <option value="dos">DoS</option>
                      <option value="ransomware">Ransomware</option>
                      <option value="mitm">MITM</option>
                      <option value="malware">Malware</option>
                      <option value="data exfiltration">Data Exfiltration</option>
                      <option value="custom">Custom</option>
                    </select>
                  </label>
                  <label id="${deviceName}-attack-custom-wrap" class="control-field hidden">
                    <span class="label">Custom attack</span>
                    <input id="${deviceName}-attack-custom" type="text" placeholder="attack label" />
                  </label>
                  <label class="control-field">
                    <span class="label">Source</span>
                    <input id="${deviceName}-source" type="text" placeholder="Control Generator" />
                  </label>
                  <label class="control-field">
                    <span class="label">Location</span>
                    <input id="${deviceName}-location" type="text" placeholder="Ward A" />
                  </label>
                </div>
                <div class="control-prob-grid">
                  <label class="control-field">
                    <span class="label">Normal share</span>
                    <input id="${deviceName}-prob-normal" type="range" min="0" max="100" step="1" />
                  </label>
                  <label class="control-field">
                    <span class="label">Abnormal share</span>
                    <input id="${deviceName}-prob-abnormal" type="range" min="0" max="100" step="1" />
                  </label>
                  <label class="control-field">
                    <span class="label">Attack share</span>
                    <input id="${deviceName}-prob-attack" type="range" min="0" max="100" step="1" />
                  </label>
                </div>
                <div class="control-parts">
                  <p class="label">Affected parts</p>
                  <label><input type="checkbox" data-part-group="${deviceName}" value="network" /> Network</label>
                  <label><input type="checkbox" data-part-group="${deviceName}" value="process" /> Process</label>
                  <label><input type="checkbox" data-part-group="${deviceName}" value="memory" /> Memory</label>
                </div>
              </div>
            </details>
          </div>
        </details>
      `;
      controlDeviceListEl.appendChild(card);
      setScenarioInputs(deviceName, scenario);
      attachScenarioControlListeners(deviceName, { autoEnableOverride: true });
      document.getElementById(`${deviceName}-enabled`)?.addEventListener("change", (event) => {
        setOverrideInputsDisabled(deviceName, !event.target.checked);
        updateControlPreview();
      });
      setOverrideInputsDisabled(deviceName, !overrideEnabled);
    });
    updateControlPreview();
  }

  function renderControlState() {
    if (controlDeviceCountEl) controlDeviceCountEl.value = String(controlState.deviceCount || 4);
    setScenarioInputs("global", normalizeScenario(controlState.globalScenario));
    renderControlDevices();
    updateControlPreview();
    renderMainSnapshot();
    setControlStatus("Control-driven injection is active.");
  }

  function collectControlPayload() {
    const payload = {
      enabled: true,
      deviceCount: Number.parseInt(controlDeviceCountEl?.value || "4", 10) || 4,
      globalScenario: readScenarioInputs("global"),
      deviceOverrides: {},
    };
    getDeviceNames(payload.deviceCount).forEach((deviceName) => {
      const enabled = document.getElementById(`${deviceName}-enabled`)?.checked;
      if (!enabled) return;
      payload.deviceOverrides[deviceName] = {
        enabled: true,
        scenario: readScenarioInputs(deviceName),
      };
    });
    return payload;
  }

  async function loadControlState() {
    try {
      setControlStatus("Loading control state.");
      const response = await fetch("/api/control");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = await response.json();
      controlState = payload.controlState || controlState;
      renderControlState();
    } catch (err) {
      setControlStatus(`Failed to load control state: ${err.message}`, true);
    }
  }

  function getLatestCyberPoint() {
    return cyberHistory.length ? cyberHistory[cyberHistory.length - 1] : null;
  }

  function getCurrentFleetPoints() {
    return Array.from(latestCyberByDevice.values());
  }

  function isAlertPoint(point) {
    return Boolean(point?.fusion?.alert);
  }

  function getLatestAlertCyberPoint() {
    for (let idx = cyberHistory.length - 1; idx >= 0; idx -= 1) {
      if (isAlertPoint(cyberHistory[idx])) return cyberHistory[idx];
    }
    return null;
  }

  function getPrimaryAlertPoint() {
    const activeAlerts = getCurrentFleetPoints().filter((point) => isAlertPoint(point));
    if (!activeAlerts.length) return null;
    return activeAlerts.sort((left, right) => {
      const severityDelta =
        getSeverityRank(right.severity || right.fusion?.severity) -
        getSeverityRank(left.severity || left.fusion?.severity);
      if (severityDelta !== 0) return severityDelta;
      return (right.t || 0) - (left.t || 0);
    })[0];
  }

  function getLatestAlertReportPoint() {
    if (!alerts.length) return null;
    return getReportPointForAlert(alerts[alerts.length - 1]) || getLatestAlertCyberPoint();
  }

  function getTriggeredByLabel(point) {
    if (!point) return "--";
    const fusion = point.fusion || {};
    const surfaces = fusion.triggeredBy || fusion.attackedParts || fusion.anomalousParts || [];
    return surfaces.length ? surfaces.map((item) => formatAttackLabel(item)).join(" + ") : "--";
  }

  function isWatchPoint(point) {
    if (!point) return false;
    if (isAlertPoint(point)) return true;
    if (Array.isArray(point.fusion?.anomalousParts) && point.fusion.anomalousParts.length) {
      return true;
    }
    return Number(point.anomalyScore || 0) >= 35;
  }

  function getFocusPoint() {
    return getPrimaryAlertPoint() || getLatestAlertReportPoint() || getLatestCyberPoint();
  }

  function renderMainTopPaths() {
    if (!mainTopPathsEl) return;
    const topPaths = latestIpfixPoint?.topPairs || latestIpfixPoint?.topTalkers || [];
    mainTopPathsEl.innerHTML = "";
    if (!topPaths.length) {
      const empty = document.createElement("div");
      empty.className = "main-top-paths-empty";
      empty.textContent = "Waiting for network path data.";
      mainTopPathsEl.appendChild(empty);
      return;
    }

    topPaths.slice(0, 4).forEach((item) => {
      const row = document.createElement("div");
      row.className = "path-row";
      row.innerHTML = `
        <div class="path-copy">
          <p class="path-name">${item.pair || item.ip || "--"}</p>
          <p class="path-meta">${item.flows ? `${item.flows} flows` : "Observed path"}</p>
        </div>
        <p class="path-volume">${formatBytes(item.bytes || 0)}</p>
      `;
      mainTopPathsEl.appendChild(row);
    });
  }

  function renderMainSnapshot() {
    const fleetPoints = getCurrentFleetPoints();
    const heroPoint = getPrimaryAlertPoint();
    const heroFusion = heroPoint?.fusion || {};
    const focusPoint = getFocusPoint();
    const activeIncidents = fleetPoints.filter((point) => isAlertPoint(point)).length;
    const watchDevices = fleetPoints.filter((point) => isWatchPoint(point)).length;
    const monitoredDevices = fleetPoints.length || Number(controlState.deviceCount || 0) || 0;
    const trafficVolume = latestIpfixPoint?.bytes ?? focusPoint?.bytes ?? null;

    if (statActiveIncidentsEl) statActiveIncidentsEl.textContent = String(activeIncidents);
    if (statWatchDevicesEl) statWatchDevicesEl.textContent = String(watchDevices);
    if (statMonitoredDevicesEl) statMonitoredDevicesEl.textContent = String(monitoredDevices);
    if (statObservedTrafficEl) {
      statObservedTrafficEl.textContent =
        trafficVolume === null ? "--" : formatBytes(trafficVolume);
    }

    if (anomalyScoreEl) {
      anomalyScoreEl.textContent = heroPoint
        ? formatNumber(heroPoint.anomalyScore || 0, 1)
        : "--";
    }
    if (attackCategoryEl) {
      attackCategoryEl.textContent = heroPoint
        ? formatAttackLabel(heroPoint.attackCategory || heroFusion.attackType || "normal")
        : "--";
    }
    if (cyberConfidenceEl) {
      cyberConfidenceEl.textContent = heroPoint
        ? `${Math.round((heroPoint.confidence || 0) * 100)}%`
        : "--";
    }
    if (heroDeviceEl) heroDeviceEl.textContent = heroPoint?.device || "--";
    if (heroLocationEl) heroLocationEl.textContent = heroPoint?.location || "--";
    if (heroTriggeredByEl) heroTriggeredByEl.textContent = getTriggeredByLabel(heroPoint);

    if (anomalyStatusEl) {
      anomalyStatusEl.textContent = heroPoint
        ? `${formatAttackLabel(
            heroFusion.attackType || heroPoint.attackCategory || "anomalous behavior"
          )} detected on ${heroPoint.device || "device"}`
        : "No active alert";
    }
    if (anomalyMessageEl) {
      anomalyMessageEl.textContent = heroPoint
        ? heroFusion.report ||
          "Unusual activity was detected and should be reviewed by the security administrator."
        : "The console is monitoring the hospital fleet and will elevate the next confirmed incident here.";
    }
    if (anomalyBannerEl) {
      anomalyBannerEl.classList.toggle("alert", Boolean(heroPoint));
    }

    if (focusDeviceEl) focusDeviceEl.textContent = focusPoint?.device || "--";
    if (focusLocationEl) focusLocationEl.textContent = focusPoint?.location || "--";
    if (focusSourceEl) focusSourceEl.textContent = focusPoint?.source || "--";
    if (focusTriggeredEl) focusTriggeredEl.textContent = getTriggeredByLabel(focusPoint);
    if (focusPathEl) {
      focusPathEl.textContent = focusPoint
        ? `${focusPoint.deviceIp || "--"} -> ${focusPoint.destinationIp || "--"}`
        : "--";
    }
    if (focusObservedEl) {
      focusObservedEl.textContent = focusPoint
        ? `${formatBytes(focusPoint.bytes || 0)} · ${focusPoint.packets || 0} packets`
        : "--";
    }

    renderMainTopPaths();
  }

  function getReportRenderPoint() {
    return currentReportPoint || getPrimaryAlertPoint() || getLatestAlertReportPoint();
  }

  function getIncidentState(point) {
    if (!point) return "--";
    const latestForDevice = point.device ? latestCyberByDevice.get(point.device) : null;
    if (latestForDevice?.fusion?.alert) {
      return "Active incident";
    }
    return "Recorded incident";
  }

  function getIncidentId(point) {
    if (!point) return "--";
    const stamp = new Date(point.t || Date.now())
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\..+/, "");
    return `INC-${point.device || "DEVICE"}-${stamp}`.toUpperCase();
  }

  function buildExecutiveSummary(point) {
    if (!point) return "No incident report is available yet.";
    const fusion = point.fusion || {};
    const severity = getSeverity(fusion.severity || point.severity || "low");
    const confidencePct = Math.round((point.confidence || 0) * 100);
    const classification = formatAttackLabel(
      point.attackCategory || fusion.attackType || "anomalous behavior"
    );
    const triggeredBy =
      (fusion.triggeredBy || fusion.attackedParts || fusion.anomalousParts || [])
        .map((item) => formatAttackLabel(item))
        .join(", ") || "the monitored control surface";
    return `An incident affecting ${point.device || "the selected device"} was detected at ${
      point.location || "the monitored location"
    }. The event is classified as ${classification} with ${severity} severity and ${confidencePct}% confidence. Detection was driven by ${triggeredBy}. Observed traffic on the path ${
      point.deviceIp || "--"
    } to ${point.destinationIp || "--"} reached ${formatBytes(point.bytes || 0)} across ${
      point.packets || 0
    } packets during the recorded window.`;
  }

  function getRecommendedActions(point) {
    if (!point) {
      return ["Reports are generated automatically when a new alert is raised."];
    }
    const attack = String(point.attackCategory || point.fusion?.attackType || "").toLowerCase();
    const severity = getSeverity(point.fusion?.severity || point.severity || "low");
    const actions = [];

    if (severity === "high") {
      actions.push("Isolate the affected device from clinical and broker-facing network paths immediately.");
      actions.push("Escalate to the incident response lead and preserve volatile evidence before remediation.");
    } else if (severity === "medium") {
      actions.push("Place the device under active review and confirm whether the observed behavior matches maintenance activity.");
      actions.push("Check adjacent devices and broker logs for the same pattern before the incident window expands.");
    } else {
      actions.push("Keep the device under observation and validate the event against expected operations.");
    }

    if (attack.includes("dos")) {
      actions.push("Inspect rate spikes, broker saturation, and any upstream source repeatedly targeting the device path.");
    } else if (attack.includes("ransomware")) {
      actions.push("Remove the device from shared storage paths and verify backup and recovery readiness before reconnecting it.");
    } else if (attack.includes("mitm")) {
      actions.push("Review broker certificates, switch paths, and segmented links for interception or redirection.");
    } else if (attack.includes("malware")) {
      actions.push("Run host and process integrity checks, then compare active binaries and services against the approved baseline.");
    } else if (attack.includes("exfiltration")) {
      actions.push("Review outbound destinations and block unapproved egress until data handling is confirmed.");
    } else {
      actions.push("Capture device, broker, and network evidence for analyst review and correlation.");
    }

    return actions.slice(0, 4);
  }

  function renderReportActions(actions) {
    if (!reportActionsEl) return;
    reportActionsEl.innerHTML = "";
    actions.forEach((action, index) => {
      const item = document.createElement("div");
      item.className = "report-action-item";
      item.innerHTML = `
        <span class="report-action-index">${index + 1}</span>
        <p>${action}</p>
      `;
      reportActionsEl.appendChild(item);
    });
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function buildDownloadReportHtml(point) {
    const fusion = point?.fusion || {};
    const severity = getSeverity(fusion.severity || point?.severity || "low");
    const summary = buildExecutiveSummary(point);
    const actions = getRecommendedActions(point);
    const triggeredBy = (fusion.triggeredBy || []).join(", ") || "--";
    const affectedParts =
      (fusion.attackedParts || fusion.anomalousParts || []).join(", ") || "--";
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(getIncidentId(point))}</title>
  <style>
    :root { color-scheme: light; }
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; background: #f4f7f8; color: #162126; }
    .page { max-width: 960px; margin: 0 auto; padding: 40px 28px 56px; }
    .header { display: flex; justify-content: space-between; gap: 24px; padding-bottom: 24px; border-bottom: 2px solid #d9e4e7; }
    .eyebrow { margin: 0 0 8px; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #47656c; }
    h1, h2 { margin: 0; font-family: Arial, Helvetica, sans-serif; }
    h1 { font-size: 32px; line-height: 1.05; }
    h2 { font-size: 15px; letter-spacing: 0.08em; text-transform: uppercase; color: #29484f; margin-bottom: 14px; }
    .muted { color: #5e747b; line-height: 1.6; }
    .badge { display: inline-block; padding: 8px 12px; border: 1px solid #c4d3d8; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; }
    .section { margin-top: 28px; background: #fff; border: 1px solid #d9e4e7; padding: 22px; }
    .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
    .cell { border: 1px solid #e3ecef; padding: 14px; min-height: 74px; }
    .label { margin: 0 0 6px; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: #5d757d; }
    .value { margin: 0; font-size: 15px; font-weight: 700; line-height: 1.4; }
    .summary { font-size: 16px; line-height: 1.75; color: #1d2a2f; }
    .actions { margin: 0; padding-left: 18px; line-height: 1.8; }
    @media print { body { background: #fff; } .page { padding: 24px; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div>
        <p class="eyebrow">Hospital Cyber Alert Console</p>
        <h1>${escapeHtml(formatAttackLabel(point?.attackCategory || fusion.attackType || "incident"))} Incident Report</h1>
        <p class="muted">${escapeHtml(dateTimeLabel(point?.t || Date.now()))} · ${escapeHtml(
          point?.device || "Unknown device"
        )} · ${escapeHtml(point?.location || "Unknown location")}</p>
      </div>
      <div>
        <p class="label">Report ID</p>
        <p class="value">${escapeHtml(getIncidentId(point))}</p>
        <p class="label" style="margin-top: 16px;">Severity</p>
        <p class="badge">${escapeHtml(severity)}</p>
      </div>
    </div>

    <div class="section">
      <h2>Executive Summary</h2>
      <p class="summary">${escapeHtml(summary)}</p>
    </div>

    <div class="section">
      <h2>Incident Overview</h2>
      <div class="grid">
        <div class="cell"><p class="label">Case Status</p><p class="value">${escapeHtml(getIncidentState(point))}</p></div>
        <div class="cell"><p class="label">Classification</p><p class="value">${escapeHtml(formatAttackLabel(point?.attackCategory || fusion.attackType || "incident"))}</p></div>
        <div class="cell"><p class="label">Confidence</p><p class="value">${escapeHtml(`${Math.round((point?.confidence || 0) * 100)}%`)}</p></div>
        <div class="cell"><p class="label">Detection Surface</p><p class="value">${escapeHtml(triggeredBy)}</p></div>
        <div class="cell"><p class="label">Affected Scope</p><p class="value">${escapeHtml(affectedParts)}</p></div>
        <div class="cell"><p class="label">Observed Traffic</p><p class="value">${escapeHtml(`${formatBytes(point?.bytes || 0)} · ${point?.packets || 0} packets`)}</p></div>
      </div>
    </div>

    <div class="section">
      <h2>Context</h2>
      <div class="grid">
        <div class="cell"><p class="label">Device IP</p><p class="value">${escapeHtml(point?.deviceIp || "--")}</p></div>
        <div class="cell"><p class="label">Destination IP</p><p class="value">${escapeHtml(point?.destinationIp || "--")}</p></div>
        <div class="cell"><p class="label">Source</p><p class="value">${escapeHtml(point?.source || "--")}</p></div>
      </div>
    </div>

    <div class="section">
      <h2>Recommended Actions</h2>
      <ol class="actions">${actions.map((action) => `<li>${escapeHtml(action)}</li>`).join("")}</ol>
    </div>
  </div>
</body>
</html>`;
  }

  function downloadReport(point) {
    if (!point) return;
    const blob = new Blob([buildDownloadReportHtml(point)], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date(point.t || Date.now()).toISOString().replace(/[:.]/g, "-");
    link.href = url;
    link.download = `${getIncidentId(point).toLowerCase()}-${timestamp}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function getReportPointForAlert(alert) {
    if (!cyberHistory.length) return null;
    const targetTime = alert?.t || 0;
    for (let idx = cyberHistory.length - 1; idx >= 0; idx -= 1) {
      const point = cyberHistory[idx];
      if ((point.t || 0) <= targetTime) return point;
    }
    return getLatestCyberPoint();
  }

  function openReportDrawer() {
    if (!reportDrawerEl || !reportBackdropEl) return;
    if (reportHideTimer) clearTimeout(reportHideTimer);
    reportDrawerEl.classList.remove("hidden");
    reportBackdropEl.classList.remove("hidden");
    requestAnimationFrame(() => {
      reportDrawerEl.classList.add("open");
      reportBackdropEl.classList.add("open");
    });
    reportDrawerEl.setAttribute("aria-hidden", "false");
    document.body.classList.add("drawer-open");
  }

  function closeReportDrawer() {
    if (!reportDrawerEl || !reportBackdropEl) return;
    reportDrawerEl.classList.remove("open");
    reportBackdropEl.classList.remove("open");
    reportDrawerEl.setAttribute("aria-hidden", "true");
    document.body.classList.remove("drawer-open");
    if (reportHideTimer) clearTimeout(reportHideTimer);
    reportHideTimer = setTimeout(() => {
      reportDrawerEl.classList.add("hidden");
      reportBackdropEl.classList.add("hidden");
    }, 220);
  }

  function renderReportDrawer() {
    const point = getReportRenderPoint();
    if (!point) {
      if (reportTitleEl) reportTitleEl.textContent = "Incident report unavailable";
      if (reportSubtitleEl) {
        reportSubtitleEl.textContent = "A downloadable report will be available after the next recorded alert.";
      }
      if (reportSeverityEl) {
        reportSeverityEl.textContent = "--";
        reportSeverityEl.className = "tag medium";
      }
      if (reportDrawerEl) reportDrawerEl.classList.remove("report-alert");
      if (reportDownloadBtnEl) reportDownloadBtnEl.disabled = true;
      if (fusionAlertFlagEl) fusionAlertFlagEl.textContent = "--";
      if (reportAttackCategoryEl) reportAttackCategoryEl.textContent = "--";
      if (reportConfidenceEl) reportConfidenceEl.textContent = "--";
      if (reportTriggeredByEl) reportTriggeredByEl.textContent = "--";
      if (reportAffectedPartsEl) reportAffectedPartsEl.textContent = "--";
      if (reportDeviceNameEl) reportDeviceNameEl.textContent = "--";
      if (reportDetectedAtEl) reportDetectedAtEl.textContent = "--";
      if (reportIncidentIdEl) reportIncidentIdEl.textContent = "--";
      if (fusionReportTextEl) {
        fusionReportTextEl.textContent = "No incident has been recorded yet.";
      }
      renderReportActions(getRecommendedActions(null));
      if (cyberDeviceIpEl) cyberDeviceIpEl.textContent = "--";
      if (cyberSourceEl) cyberSourceEl.textContent = "--";
      if (cyberLocationEl) cyberLocationEl.textContent = "--";
      if (cyberDestinationIpEl) cyberDestinationIpEl.textContent = "--";
      if (cyberBytesEl) cyberBytesEl.textContent = "--";
      if (cyberPacketsEl) cyberPacketsEl.textContent = "--";
      return;
    }

    const fusion = point.fusion || {};
    const severity = getSeverity(fusion.severity || point.severity, "low");
    const triggeredBy = (fusion.triggeredBy || []).join(" + ") || "--";
    const affectedParts =
      (fusion.attackedParts || fusion.anomalousParts || []).join(", ") || "--";
    const reportAttack = formatAttackLabel(
      point.attackCategory || fusion.attackType || "normal"
    );
    const reportConfidence = `${Math.round((point.confidence || 0) * 100)}%`;
    const reportTitle = `${reportAttack} incident report`;

    if (reportTitleEl) reportTitleEl.textContent = reportTitle;
    if (reportSubtitleEl) {
      reportSubtitleEl.textContent = `${dateTimeLabel(point.t || Date.now())} · ${
        point.device || "Device"
      } · ${point.location || "Unknown location"}`;
    }
    if (reportSeverityEl) {
      reportSeverityEl.textContent = severity;
      reportSeverityEl.className = `tag ${severity}`;
    }
    if (reportDownloadBtnEl) reportDownloadBtnEl.disabled = false;
    if (fusionAlertFlagEl) fusionAlertFlagEl.textContent = getIncidentState(point);
    if (reportAttackCategoryEl) reportAttackCategoryEl.textContent = reportAttack;
    if (reportConfidenceEl) reportConfidenceEl.textContent = reportConfidence;
    if (reportTriggeredByEl) reportTriggeredByEl.textContent = triggeredBy;
    if (reportAffectedPartsEl) reportAffectedPartsEl.textContent = affectedParts;
    if (reportDeviceNameEl) reportDeviceNameEl.textContent = point.device || "--";
    if (reportDetectedAtEl) reportDetectedAtEl.textContent = dateTimeLabel(point.t || Date.now());
    if (reportIncidentIdEl) reportIncidentIdEl.textContent = getIncidentId(point);
    if (fusionReportTextEl) {
      fusionReportTextEl.textContent = buildExecutiveSummary(point);
    }
    renderReportActions(getRecommendedActions(point));
    if (cyberDeviceIpEl) cyberDeviceIpEl.textContent = point.deviceIp || "--";
    if (cyberSourceEl) cyberSourceEl.textContent = point.source || "--";
    if (cyberLocationEl) cyberLocationEl.textContent = point.location || "--";
    if (cyberDestinationIpEl) {
      cyberDestinationIpEl.textContent = point.destinationIp || "--";
    }
    if (cyberBytesEl) cyberBytesEl.textContent = formatBytes(point.bytes || 0);
    if (cyberPacketsEl) cyberPacketsEl.textContent = `${point.packets || 0}`;

    if (fusionAlertCardEl) {
      fusionAlertCardEl.classList.toggle("fusion-high", severity === "high");
      fusionAlertCardEl.classList.toggle("fusion-medium", severity === "medium");
      fusionAlertCardEl.classList.toggle("fusion-low", severity === "low");
    }
    if (reportDrawerEl) {
      reportDrawerEl.classList.toggle("report-alert", Boolean(point));
    }
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
          backgroundColor:
            idx === 0 ? "rgba(22, 50, 79, 0.08)" : "rgba(14, 165, 233, 0.08)",
          tension: 0.36,
          borderWidth: 2.5,
          pointRadius: 0,
          pointHoverRadius: 4,
          fill: idx === 0,
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
            display: false,
          },
          tooltip: {
            backgroundColor: "#10263f",
            titleColor: "#f8fbff",
            bodyColor: "#dce7f3",
            padding: 12,
            displayColors: false,
          },
        },
        scales: {
          x: {
            ticks: {
              color: "#607286",
              maxTicksLimit: 6,
              autoSkip: true,
              maxRotation: 0,
            },
            grid: { color: "rgba(31, 52, 73, 0.08)" },
          },
          y: {
            ticks: {
              color: "#607286",
              maxTicksLimit: 5,
              callback: (value) => {
                if (unit) return `${value}${unit}`;
                if (Math.abs(value) >= 1000) return Number(value).toLocaleString();
                return Number.isInteger(value) ? value : Number(value).toFixed(1);
              },
            },
            grid: { color: "rgba(31, 52, 73, 0.08)" },
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
          ticks: { color: "#607286" },
          grid: { color: "rgba(31, 52, 73, 0.08)" },
        },
        y: {
          min: 0,
          max: 4,
          ticks: {
            color: "#607286",
            callback: (value) => stateLabels[value] || "",
          },
          grid: { color: "rgba(31, 52, 73, 0.08)" },
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
    const roughMax = Math.max(fallbackMax, maxValue * 1.2);
    const magnitude = roughMax <= 0 ? 1 : 10 ** Math.floor(Math.log10(roughMax));
    const roundedMax = Math.ceil(roughMax / magnitude) * magnitude;
    chart.options.scales.y.min = 0;
    chart.options.scales.y.max = roundedMax;
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

  function getIncidentFeedItems() {
    return alerts
      .slice(-8)
      .map((alert) => {
        const reportPoint = getReportPointForAlert(alert);
        const fusion = reportPoint?.fusion || {};
        const triggeredBy = (fusion.triggeredBy || []).join(" + ") || "No trigger";
        const classification = formatAttackLabel(
          reportPoint?.attackCategory || fusion.attackType || alert.code || "incident"
        );
        const device = alert.device || reportPoint?.device || "Unknown device";
        return {
          id: `alert-${alert.t || 0}`,
          t: alert.t,
          severity: getSeverity(alert.severity || reportPoint?.severity || "medium"),
          title: classification,
          device,
          details: `${reportPoint?.location || "Unknown location"} · ${
            reportPoint?.source || "Unknown source"
          }`,
          meta: `${triggeredBy} · ${formatBytes(reportPoint?.bytes || 0)} · ${
            reportPoint?.packets || 0
          } pkts`,
          reportPoint,
        };
      })
      .sort((a, b) => (b.t || 0) - (a.t || 0));
  }

  function renderMainEvents() {
    if (!mainEventsEl) return;
    mainEventsEl.innerHTML = "";
    const items = getIncidentFeedItems();
    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "main-events-empty";
      empty.textContent = "No alert incidents yet.";
      mainEventsEl.appendChild(empty);
      return;
    }

    items.forEach((item) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "main-event";
      if (item.id === selectedReportKey) {
        row.classList.add("selected");
      }
      row.innerHTML = `
        <div class="event-time">${item.t ? timeLabel(item.t) : "--"}</div>
        <div><span class="tag ${item.severity}">${item.severity}</span></div>
        <div class="event-copy">
          <div class="event-title">${item.title}</div>
          <div class="event-device">${item.device}</div>
          <div class="event-meta">${item.details}</div>
        </div>
        <div class="event-side">
          <div class="event-meta">${item.meta}</div>
          <span class="event-link">Open report</span>
        </div>
      `;
      row.addEventListener("click", () => {
        const latestPoint = getPrimaryAlertPoint() || getLatestAlertReportPoint() || getLatestCyberPoint();
        selectedReportKey = item.id;
        currentReportPoint = item.reportPoint || latestPoint;
        reportSelectionLocked =
          Boolean(item.reportPoint) && item.reportPoint !== latestPoint;
        renderReportDrawer();
        renderMainEvents();
        openReportDrawer();
      });
      mainEventsEl.appendChild(row);
    });
  }

  function applyCyber(point) {
    if (!point) return;
    const latestBeforePush = getLatestCyberPoint();
    cyberHistory.push(point);
    if (cyberHistory.length > maxPoints) cyberHistory.shift();
    if (point.device) {
      latestCyberByDevice.set(point.device, point);
    }

    const label = timeLabel(point.t || Date.now());
    pushPoint(riskChart, label, point, ["anomalyScore"]);
    pushPoint(trafficChart, label, point, ["bytes"]);
    updateDynamicYAxis(riskChart, 100);
    updateDynamicYAxis(trafficChart, 1000);

    if (
      point.fusion?.alert &&
      (!reportSelectionLocked ||
        !currentReportPoint ||
        currentReportPoint === latestBeforePush)
    ) {
      currentReportPoint = point;
      selectedReportKey = alerts.length ? `alert-${alerts[alerts.length - 1].t || 0}` : null;
      reportSelectionLocked = false;
    }

    renderMainSnapshot();
    renderReportDrawer();
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
    latestIpfixPoint = point;
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
    renderMainSnapshot();
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
    renderReportDrawer();
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
    renderReportDrawer();
  }

  function applyStatePoint(point) {
    log("state point", point);
    if (!point || !point.state || stateMap[point.state] === undefined) return;
    pushStatePoint(stateChart, timeLabel(point.t), stateMap[point.state]);
  }

  function applyInit(payload) {
    log("init payload", payload);
    if (payload.reset) {
      resetClientState();
    }
    if (payload.controlState) {
      controlState = payload.controlState;
      renderControlState();
    }
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
    if (
      payload.lastIpfix &&
      (!payload.ipfix?.length ||
        payload.lastIpfix.t !== payload.ipfix[payload.ipfix.length - 1]?.t)
    ) {
      applyIpfix(payload.lastIpfix);
    }
    if (payload.cyber && payload.cyber.length) {
      payload.cyber.forEach((point) => applyCyber(point));
    }
    if (
      payload.lastCyber &&
      (!payload.cyber?.length ||
        payload.lastCyber.t !== payload.cyber[payload.cyber.length - 1]?.t ||
        payload.lastCyber.device !== payload.cyber[payload.cyber.length - 1]?.device)
    ) {
      applyCyber(payload.lastCyber);
    }
    updateDevicePicker();
    renderMainEvents();
    renderMainSnapshot();
    renderReportDrawer();
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
        if (!reportSelectionLocked && alerts.length) {
          selectedReportKey = `alert-${alerts[alerts.length - 1].t || 0}`;
        }
        renderAlerts();
        renderMainEvents();
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

  if (controlDeviceCountEl) {
    controlDeviceCountEl.addEventListener("change", () => {
      controlState.deviceCount =
        Math.min(12, Math.max(1, Number.parseInt(controlDeviceCountEl.value, 10) || 4));
      renderControlDevices();
      updateControlPreview();
    });
  }

  attachScenarioControlListeners("global");

  document.querySelectorAll("[data-control-device-count]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextCount = Math.min(
        12,
        Math.max(1, Number.parseInt(button.getAttribute("data-control-device-count"), 10) || 4)
      );
      controlState.deviceCount = nextCount;
      if (controlDeviceCountEl) controlDeviceCountEl.value = String(nextCount);
      renderControlDevices();
      updateControlPreview();
    });
  });

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

  if (controlApplyBtnEl) {
    controlApplyBtnEl.addEventListener("click", async () => {
      try {
        setControlStatus("Applying control state.");
        const response = await fetch("/api/control", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(collectControlPayload()),
        });
        const payload = await response.json();
        if (!response.ok || payload.ok === false) {
          throw new Error(payload.error || `HTTP ${response.status}`);
        }
        controlState = payload.controlState || controlState;
        renderControlState();
        setControlStatus("Control state applied.");
      } catch (err) {
        setControlStatus(`Failed to apply control state: ${err.message}`, true);
      }
    });
  }

  if (controlResetBtnEl) {
    controlResetBtnEl.addEventListener("click", async () => {
      try {
        setControlStatus("Resetting control defaults.");
        const response = await fetch("/api/control/reset", {
          method: "POST",
        });
        const payload = await response.json();
        if (!response.ok || payload.ok === false) {
          throw new Error(payload.error || `HTTP ${response.status}`);
        }
        controlState = payload.controlState || controlState;
        renderControlState();
        setControlStatus("Returned to default control distribution.");
      } catch (err) {
        setControlStatus(`Failed to reset control state: ${err.message}`, true);
      }
    });
  }

  if (viewReportBtnEl) {
    viewReportBtnEl.addEventListener("click", () => {
      renderReportDrawer();
      openReportDrawer();
    });
  }

  if (reportDownloadBtnEl) {
    reportDownloadBtnEl.addEventListener("click", () => {
      const point = getReportRenderPoint();
      if (!point) return;
      downloadReport(point);
    });
  }

  if (reportCloseBtnEl) {
    reportCloseBtnEl.addEventListener("click", () => {
      closeReportDrawer();
    });
  }

  if (reportBackdropEl) {
    reportBackdropEl.addEventListener("click", () => {
      closeReportDrawer();
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && reportDrawerEl && !reportDrawerEl.classList.contains("hidden")) {
      closeReportDrawer();
    }
  });

  setSelectedSource(selectedSource);
  setActiveTab("main-panel");
  loadControlState();
  renderMainEvents();
  renderReportDrawer();
})();
