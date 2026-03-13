#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/setup_pi_ipfix_mqtt.sh
#   PI_HOST=192.168.137.89 PI_USER=boj DEVICE_IP=192.168.137.142 ./scripts/setup_pi_ipfix_mqtt.sh

PI_HOST="${PI_HOST:-192.168.137.89}"
PI_USER="${PI_USER:-boj}"
BROKER_HOST="${BROKER_HOST:-192.168.137.89}"
TOPIC="${TOPIC:-hospital/ipfix}"
DEVICE_IP="${DEVICE_IP:-192.168.137.142}"
NFDUMP_DIR="${NFDUMP_DIR:-/var/cache/nfdump}"
IPFIX_PORT="${IPFIX_PORT:-2055}"
INTERVAL="${INTERVAL:-5}"

echo "Connecting to ${PI_USER}@${PI_HOST}"
echo "Config: broker=${BROKER_HOST} topic=${TOPIC} device_ip=${DEVICE_IP} nfdump_dir=${NFDUMP_DIR} port=${IPFIX_PORT}"

ssh -tt "${PI_USER}@${PI_HOST}" \
  "BROKER_HOST='${BROKER_HOST}' TOPIC='${TOPIC}' DEVICE_IP='${DEVICE_IP}' NFDUMP_DIR='${NFDUMP_DIR}' IPFIX_PORT='${IPFIX_PORT}' INTERVAL='${INTERVAL}' bash -se" <<'REMOTE'
set -euo pipefail

echo "[1/7] Installing required packages"
sudo apt update
sudo apt install -y nfdump mosquitto-clients

echo "[2/7] Preparing directories"
sudo mkdir -p "${NFDUMP_DIR}"
sudo chown "$USER":"$USER" "${NFDUMP_DIR}" || true
mkdir -p "$HOME/ipfix-mqtt"

echo "[3/7] Creating IPFIX -> MQTT publisher script"
cat > "$HOME/ipfix-mqtt/ipfix_to_mqtt.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

BROKER_HOST="${BROKER_HOST:-192.168.137.89}"
TOPIC="${TOPIC:-hospital/ipfix}"
DEVICE_IP="${DEVICE_IP:-192.168.137.142}"
NFDUMP_DIR="${NFDUMP_DIR:-/var/cache/nfdump}"
INTERVAL="${INTERVAL:-5}"

while true; do
  START="$(date -u -d '5 minutes ago' '+%Y/%m/%d.%H:%M:%S')"
  END="$(date -u '+%Y/%m/%d.%H:%M:%S')"
  OUT="$(nfdump -R "$NFDUMP_DIR" -t "$START-$END" -o csv "src ip $DEVICE_IP or dst ip $DEVICE_IP" 2>/dev/null || true)"

  ROWS="$(printf "%s\n" "$OUT" | awk -F, '
    NR==1 {
      for (i=1; i<=NF; i++) {
        key=$i
        gsub(/^[ \t]+|[ \t]+$/, "", key)
        col[key]=i
      }
      next
    }
    NR>1 {
      ts_i=col["ts"]; te_i=col["te"]; pr_i=col["pr"]; sa_i=col["sa"]; da_i=col["da"]; sp_i=col["sp"]; dp_i=col["dp"]
      pkt_i=col["pkt"]; byt_i=col["byt"]; ipkt_i=col["ipkt"]; opkt_i=col["opkt"]; ibyt_i=col["ibyt"]; obyt_i=col["obyt"]
      if (!ts_i || !sa_i || !da_i) next

      ts=$ts_i; te=(te_i ? $te_i : ""); pr=(pr_i ? $pr_i : ""); sa=$sa_i; da=$da_i; sp=(sp_i ? $sp_i : ""); dp=(dp_i ? $dp_i : "")
      gsub(/^[ \t]+|[ \t]+$/, "", ts); gsub(/^[ \t]+|[ \t]+$/, "", te); gsub(/^[ \t]+|[ \t]+$/, "", pr)
      gsub(/^[ \t]+|[ \t]+$/, "", sa); gsub(/^[ \t]+|[ \t]+$/, "", da); gsub(/^[ \t]+|[ \t]+$/, "", sp); gsub(/^[ \t]+|[ \t]+$/, "", dp)

      pkt = 0
      byt = 0
      if (pkt_i) pkt = $pkt_i + 0
      else pkt = (ipkt_i ? $ipkt_i + 0 : 0) + (opkt_i ? $opkt_i + 0 : 0)
      if (byt_i) byt = $byt_i + 0
      else byt = (ibyt_i ? $ibyt_i + 0 : 0) + (obyt_i ? $obyt_i + 0 : 0)

      printf "%s{\"ts\":\"%s\",\"te\":\"%s\",\"pr\":\"%s\",\"sa\":\"%s\",\"sp\":\"%s\",\"da\":\"%s\",\"dp\":\"%s\",\"pkt\":%s,\"byt\":%s}",
        (count++?",":""), ts,te,pr,sa,sp,da,dp,pkt,byt
    }
    END { if (count==0) printf "" }
  ')"

  TS="$(date +%s%3N)"
  if [ -n "$ROWS" ]; then
    MSG="{\"t\":$TS,\"deviceIp\":\"$DEVICE_IP\",\"rows\":[$ROWS]}"
  else
    MSG="{\"t\":$TS,\"deviceIp\":\"$DEVICE_IP\",\"rows\":[]}"
  fi

  mosquitto_pub -h "$BROKER_HOST" -t "$TOPIC" -m "$MSG" || true
  sleep "$INTERVAL"
done
EOF
chmod +x "$HOME/ipfix-mqtt/ipfix_to_mqtt.sh"

echo "[4/7] Creating nfcapd systemd service"
sudo tee /etc/systemd/system/nfcapd.service >/dev/null <<EOF
[Unit]
Description=nfcapd IPFIX Collector
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/nfcapd -l ${NFDUMP_DIR} -p ${IPFIX_PORT} -t 60
Restart=always
RestartSec=2

[Install]
WantedBy=multi-user.target
EOF

echo "[5/7] Creating ipfix-to-mqtt systemd service"
sudo tee /etc/systemd/system/ipfix-to-mqtt.service >/dev/null <<EOF
[Unit]
Description=Publish IPFIX rows to MQTT
After=network.target nfcapd.service
Requires=nfcapd.service

[Service]
Type=simple
User=${USER}
Environment=BROKER_HOST=${BROKER_HOST}
Environment=TOPIC=${TOPIC}
Environment=DEVICE_IP=${DEVICE_IP}
Environment=NFDUMP_DIR=${NFDUMP_DIR}
Environment=INTERVAL=${INTERVAL}
ExecStart=/bin/bash /home/${USER}/ipfix-mqtt/ipfix_to_mqtt.sh
Restart=always
RestartSec=2

[Install]
WantedBy=multi-user.target
EOF

echo "[6/7] Enabling and starting services"
sudo systemctl daemon-reload
sudo systemctl enable nfcapd.service
sudo systemctl restart nfcapd.service
sudo systemctl enable ipfix-to-mqtt.service
sudo systemctl restart ipfix-to-mqtt.service

echo "[7/7] Status check"
sudo systemctl --no-pager --full status nfcapd.service | sed -n '1,25p'
sudo systemctl --no-pager --full status ipfix-to-mqtt.service | sed -n '1,25p'
echo "Recent MQTT publisher logs:"
sudo journalctl -u ipfix-to-mqtt.service -n 20 --no-pager || true
REMOTE

echo "Done."
echo "Test from any machine:"
echo "  mosquitto_sub -h ${BROKER_HOST} -t '${TOPIC}' -v"
