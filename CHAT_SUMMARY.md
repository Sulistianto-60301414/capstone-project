# Chat Summary: IPFIX + MQTT Troubleshooting

## What We Changed

- Updated `server.js` to support IPFIX ingestion from MQTT topics (not only HTTP CSV).
- Added support for IPFIX payload formats:
  - summary JSON (`flows`, `bytes`, `packets`, etc.)
  - `rows` JSON
  - CSV inside JSON (`csv`)
  - raw CSV text payload
- Added logic to skip HTTP IPFIX polling when fresh IPFIX arrives via MQTT.
- Added `scripts/setup_pi_ipfix_mqtt.sh` to automate Pi-side collector/publisher setup (later you chose manual steps).

## Main Issue Found

The dashboard HTTP fetch to `http://192.168.137.89:8080/ipfix_mqtt.csv` returned headers but no body bytes before timeout.  
That caused:

- `[IPFIX] http fetch failed: HTTP request timeout`
- `[IPFIX] no rows parsed (lines=0, commaLines=0)`

Later root cause became clearer:

- Pi collector was listening on UDP 2055.
- `tcpdump` on Pi showed no incoming IPFIX packets.
- So no fresh real flow data was reaching `nfcapd`.

## Network Architecture Clarification

- Raspberry Pi is **not** the router in your setup.
- Windows laptop Mobile Hotspot is the traffic path/router-like point.
- Therefore, IPFIX/flow export must come from that Windows hotspot machine (or another real exporter-capable router/firewall).

## What Worked

- MQTT broker connectivity works (`mosquitto_pub`/`mosquitto_sub` test topic succeeded).
- Publishing test payloads to `hospital/ipfix` works.
- Dashboard can consume IPFIX-style MQTT summaries.

## Why “Stuck” Happened

- `mosquitto_sub` is a continuous listener by design.
- Use `-C 1` to auto-exit after one message.
- Some terminal sessions had broken interrupt behavior; `stty sane` / `stty intr '^C'` fixes that on Linux shells.

## Windows Side Notes

- PowerShell commands were initially run in `cmd.exe`, causing syntax errors.
- `tshark` and `mosquitto_pub` were missing until installed and/or added to PATH.
- Correct `winget` package found for Mosquitto:
  - `EclipseFoundation.Mosquitto`

## Current Recommended Path to Real Data

1. Capture real traffic where routing actually happens (Windows hotspot machine).
2. Compute real bytes/packets for Arduino IP(s).
3. Publish those real metrics via MQTT to `hospital/ipfix`.
4. Let dashboard ingest MQTT IPFIX directly.

If true peer-level IPFIX is required, use a router/firewall/exporter that supports NetFlow/IPFIX natively and export to Pi (`192.168.137.89:2055`).

## Quick Status

- Dashboard backend: MQTT IPFIX-ready.
- Broker messaging: working.
- Real IPFIX export path: still pending exporter-side flow delivery.
