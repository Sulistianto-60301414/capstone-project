# IoT Security Monitoring in Hospitals

Real-time monitoring dashboard and monitoring pipeline prototype for IoT Security Monitoring in Hospitals, using MQTT telemetry and simulated IPFIX-style dataset flows.

## 1. Project Summary

This capstone project provides:
- Live IoT/IoMT telemetry ingestion from MQTT topics and simulated datasets.
- Real-time web dashboard with gauges, trends, alerts, and state timeline.
- Network visibility using IPFIX-style summaries (flow rate, traffic volume, top talkers).
- Optional Firebase Realtime Database persistence for live and historical data.
- WebSocket streaming from backend to frontend for live updates.

Main use case:
- Help hospital operations and security teams monitor connected IoT/IoMT devices, detect anomalies, and inspect traffic behavior across the monitoring environment.

Current phase:
- Raspberry Pi integration is paused for now and will be revisited later.
- The current focus is simulating the pipeline with prepared datasets, CSV snapshots, and MQTT test payloads.

## 2. Tech Stack

- Backend: Node.js, Express, WebSocket (`ws`), MQTT (`mqtt`), Firebase Admin SDK.
- Frontend: HTML, CSS, vanilla JS, Chart.js.
- Data transport:
  - MQTT for telemetry/status/alerts and optional simulated IPFIX payloads.
  - HTTP polling fallback for IPFIX CSV snapshots during testing.
  - WebSocket from server to browser.

## 3. Repository Structure

```text
capstone-project/
├── server.js                         # Main backend server + MQTT/IPFIX/Firebase logic
├── public/
│   ├── index.html                    # Dashboard UI
│   ├── app.js                        # Frontend state + chart rendering + WS handling
│   ├── styles.css                    # Dashboard styling
│   ├── config.js                     # Runtime frontend config (local/dev)
│   └── config.example.js             # Config template
├── scripts/
│   └── setup_pi_ipfix_mqtt.sh        # Raspberry Pi setup script for IPFIX -> MQTT
├── .env.example                      # Intended configuration reference
├── package.json
└── README.md
```

## 4. Current Architecture

1. IoT/IoMT devices, gateways, or local test datasets publish telemetry to MQTT topics (for example: `hospital/device/001/...`).
2. `server.js` subscribes to MQTT and classifies payloads as:
   - telemetry (`.../telemetry`)
   - status (`.../status`)
   - alerts (`.../alerts`)
   - IPFIX (`.../ipfix`, `.../ipfix/csv`, `.../flows/ipfix`, or any topic containing `/ipfix`)
3. Backend normalizes data and broadcasts to all web clients via WebSocket.
4. Frontend receives events and updates charts/cards in real time.
5. Optional: backend writes data to Firebase Realtime DB (`/live`, `/series`, `/alerts`).
6. IPFIX fallback: if fresh IPFIX is not arriving from MQTT, backend can still poll CSV snapshots via HTTP or local file input for testing.

At the moment, the active workflow is dataset-based simulation rather than live Raspberry Pi collection.

## 5. Run Instructions

### Prerequisites
- Node.js 18+ (recommended).
- MQTT broker reachable from the machine running `server.js`.
- Optional: Firebase service account JSON for DB persistence.

### Install
```bash
npm install
```

### Start
```bash
npm start
```

Open:
- `http://localhost:3000`

## 6. Configuration

### Important (Current Code Behavior)

`server.js` currently uses hardcoded constants for most backend settings (MQTT, Firebase, IPFIX).
`.env` and `.env.example` are references and are **not actively loaded** by current backend logic.

If you want environment-variable based config, update `server.js` to read from `process.env`.

### Current Development Mode

The current focus is simulation:
- Raspberry Pi collection/export is temporarily paused.
- IPFIX-related testing is being done with local datasets, CSV snapshots, and MQTT test payloads.
- Live Pi/network capture will be reintroduced later after the simulated pipeline is stable.

### Frontend config (`public/config.js`)

Template file: `public/config.example.js`

Example:
```js
window.__APP_CONFIG__ = {
  wsUrl: "",
  maxPoints: 120,
  useFirebase: true,
  firebase: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    databaseURL: "",
  },
};
```

Notes:
- If `wsUrl` is empty, frontend auto-generates WS URL from current host.
- `maxPoints` controls client-side chart history length.

## 7. Data Contracts

### Telemetry payload (MQTT)
Expected numeric fields in the current simulated hospital monitoring flow:
- `coil_temp_c`
- `gradient_temp_c`
- `helium_level_pct`
- `mag_field_t`
- `rf_power_pct`
- `vibration_g`
- `table_pos_mm`
- `uptime_s`
- `heart_rate`
- `spo2`
- `resp_rate`
- `systolic`
- `diastolic`
- `pulse_rate`
- `network_load`

Optional:
- `state` (IDLE / WARMUP / SCANNING / COOLDOWN / ERROR)
- `device` (device identifier)

Example:
```json
{
  "device": "iomt-device-01",
  "state": "SCANNING",
  "coil_temp_c": 42.1,
  "gradient_temp_c": 39.4,
  "helium_level_pct": 86.7,
  "mag_field_t": 1.50,
  "rf_power_pct": 61.2,
  "vibration_g": 0.08,
  "table_pos_mm": 735,
  "uptime_s": 12940,
  "heart_rate": 92,
  "spo2": 97,
  "resp_rate": 18
}
```

### Status payload
Example:
```json
{
  "device": "iomt-device-01",
  "ip": "10.0.1.172",
  "state": "IDLE",
  "uptime_s": 13010
}
```

### Alert payload
Example:
```json
{
  "severity": "high",
  "code": "CYBER_ATTACK_DETECTED",
  "details": "Anomalous network activity detected for the monitored IoMT device",
  "state": "ERROR"
}
```

### IPFIX payload options

`server.js` accepts:
1. Pre-aggregated summary object (contains `flows`, `bytes`, etc.)
2. Object with `rows: [...]` where each row has `ts, sa, da, sp, dp, pkt, byt`
3. Object with `csv` string
4. Raw CSV text payload

## 8. MQTT Topic Routing

Configured subscription in backend:
- `hospital/#` (current hardcoded value)

Message classification logic:
- Topic ends with `/telemetry` -> telemetry handler
- Topic ends with `/status` -> status handler
- Topic ends with `/alerts` -> alert handler
- Topic looks like IPFIX (contains `/ipfix` or known suffixes) -> IPFIX handler
- Otherwise -> treated as telemetry fallback

## 9. Firebase Realtime DB Writes

When Firebase is initialized, backend writes:
- `/live/telemetry`
- `/live/status`
- `/live/ipfix`
- `/series/telemetry/{timestamp}`
- `/series/state/{timestamp}`
- `/series/ipfix/{timestamp}`
- `/alerts/{timestamp}`

## 10. Current IPFIX Workflow

The Raspberry Pi workflow is not the active focus right now.

Current practice:
- Simulate IPFIX inputs using prepared datasets and CSV files.
- Publish test IPFIX payloads over MQTT when validating backend ingestion.
- Use the dashboard to validate parsing, summarization, and frontend rendering.

Planned later:
- Return to Raspberry Pi collection/export.
- Reconnect live network-flow capture to the same dashboard pipeline after the simulated flow is stable.

## 11. Dashboard Features

- Overview tab:
  - Coil, Helium, RF, Vibration gauges
  - Temperature, magnetic field, RF, vibration trend charts
- Network Insights tab:
  - IPFIX flow rate and bytes charts
  - Top source-destination talkers
  - Device->Broker and Broker->Device traffic summary
- Device Insights tab:
  - State timeline
  - Table position (0-1200 mm)
  - Alert queue with severity counters
- Filters:
  - Device selector
  - Source selector (`All`, `MQTT`, `IPFIX`)

## 12. Known Limitations

- Backend configuration is hardcoded in `server.js`; `.env` is not yet wired.
- `public/config.js` includes Firebase client keys and should be managed carefully for production workflows.
- No automated tests are included yet.
- No authentication/authorization is implemented for dashboard access.
- Live Raspberry Pi IPFIX collection is currently paused, so network-flow views are being validated with simulated data.

## 13. Suggested Next Improvements

1. Move backend constants to environment variables (`process.env`) and validate with a config schema.
2. Add unit tests for parsing and summarization (`parseIpfixCsv`, `summarizeIpfix`, MQTT handlers).
3. Add structured logging and log levels for production troubleshooting.
4. Add authentication and TLS for MQTT, WS, and dashboard HTTP endpoints.
5. Add Docker support for reproducible deployment.

## 14. Quick Troubleshooting

- Dashboard loads but no data:
  - Verify MQTT broker is reachable.
  - Confirm topic format matches suffix rules (`/telemetry`, `/status`, `/alerts`).
  - Check backend console logs for `[MQTT]` and `[WS]`.
- IPFIX panel empty:
  - Confirm IPFIX topic includes `/ipfix` or configured suffixes.
  - Verify the dataset or CSV snapshot being used for simulation is available.
  - Verify HTTP CSV endpoint is reachable if using poll fallback.
  - Check backend logs for `[IPFIX] no rows parsed`.
- Firebase not writing:
  - Validate service account JSON path.
  - Verify `databaseURL` and project permissions.
