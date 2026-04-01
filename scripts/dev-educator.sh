#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-mobile}"

if [[ "${MODE}" == "web" || "${MODE}" == "--web" ]]; then
  API_URL="${EXPO_PUBLIC_API_URL:-http://localhost:3000}"
  echo "[educator:web] EXPO_PUBLIC_API_URL=${API_URL}"
  EXPO_PUBLIC_API_URL="${API_URL}" pnpm --filter educator-app start -- --web --clear
  exit 0
fi

LOCAL_IP="$(hostname -I | awk '{print $1}')"
DEFAULT_API_URL="http://${LOCAL_IP}:3000"
API_URL="${EXPO_PUBLIC_API_URL:-$DEFAULT_API_URL}"

echo "[educator:mobile] EXPO_PUBLIC_API_URL=${API_URL}"
EXPO_PUBLIC_API_URL="${API_URL}" pnpm --filter educator-app start -- --lan --clear
