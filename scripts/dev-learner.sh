#!/usr/bin/env bash
set -euo pipefail

LOCAL_IP="$(hostname -I | awk '{print $1}')"
DEFAULT_API_URL="http://${LOCAL_IP}:3000"
API_URL="${EXPO_PUBLIC_API_URL:-$DEFAULT_API_URL}"

echo "[learner] EXPO_PUBLIC_API_URL=${API_URL}"
EXPO_PUBLIC_API_URL="${API_URL}" pnpm --filter learner-app start
