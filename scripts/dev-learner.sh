#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-mobile}"

pnpm --filter @letras/shared-types build
pnpm --filter @letras/shared-utils build

EXPO_PID="$(lsof -tiTCP:8081 -sTCP:LISTEN || true)"
if [[ -n "${EXPO_PID}" ]]; then
  kill "${EXPO_PID}" || true
  sleep 1
fi

if [[ "${MODE}" == "web" || "${MODE}" == "--web" ]]; then
  API_URL="${EXPO_PUBLIC_API_URL:-http://localhost:3000}"
  echo "[learner:web] EXPO_PUBLIC_API_URL=${API_URL}"
  EXPO_PUBLIC_API_URL="${API_URL}" pnpm --filter learner-app exec expo start --web --clear
  exit 0
fi

LOCAL_IP="$(hostname -I | awk '{print $1}')"
DEFAULT_API_URL="http://${LOCAL_IP}:3000"
API_URL="${EXPO_PUBLIC_API_URL:-$DEFAULT_API_URL}"

echo "[learner:mobile] EXPO_PUBLIC_API_URL=${API_URL}"
EXPO_PUBLIC_API_URL="${API_URL}" pnpm --filter learner-app exec expo start --lan --clear
