#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-local}"

cleanup() {
  if [[ -n "${API_PID:-}" ]]; then
    kill "${API_PID}" >/dev/null 2>&1 || true
    wait "${API_PID}" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

resolve_local_ip() {
  local ip
  ip="$(hostname -I 2>/dev/null | awk '{print $1}')"

  if [[ -n "${ip}" ]]; then
    echo "${ip}"
    return
  fi

  ip="$(ip route get 1.1.1.1 2>/dev/null | awk '/src/ {for (i=1;i<=NF;i++) if ($i=="src") {print $(i+1); exit}}')"
  if [[ -n "${ip}" ]]; then
    echo "${ip}"
    return
  fi

  echo "127.0.0.1"
}

pnpm --filter @letras/shared-types build
pnpm --filter @letras/shared-utils build

EXPO_PID="$(lsof -tiTCP:8081 -sTCP:LISTEN || true)"
if [[ -n "${EXPO_PID}" ]]; then
  kill "${EXPO_PID}" || true
  sleep 1
fi

case "${MODE}" in
  web|--web)
    DEFAULT_API_URL="http://localhost:3000"
    EXPO_ARGS=(--web --clear)
    ;;
  emulator|--emulator)
    DEFAULT_API_URL="http://10.0.2.2:3000"
    EXPO_ARGS=(--clear)
    ;;
  local|--local|mobile|--mobile)
    LOCAL_IP="$(resolve_local_ip)"
    DEFAULT_API_URL="http://${LOCAL_IP}:3000"
    EXPO_ARGS=(--lan --clear)
    ;;
  *)
    echo "Modo invalido: ${MODE}"
    echo "Use: local | emulator | web"
    exit 1
    ;;
esac

API_URL="${EXPO_PUBLIC_API_URL:-${DEFAULT_API_URL}}"

echo "[dev-mobile-local] Iniciando API..."
pnpm --filter api dev &
API_PID=$!

echo "[dev-mobile-local] Aguardando API em http://localhost:3000/health ..."
for _ in $(seq 1 40); do
  if curl -sf http://localhost:3000/health >/dev/null; then
    echo "[dev-mobile-local] API online"
    break
  fi

  sleep 1
done

if ! curl -sf http://localhost:3000/health >/dev/null; then
  echo "[dev-mobile-local] API nao respondeu em tempo habil"
  exit 1
fi

echo "[dev-mobile-local] EXPO_PUBLIC_API_URL=${API_URL}"
EXPO_PUBLIC_API_URL="${API_URL}" pnpm --filter mobile-app exec expo start "${EXPO_ARGS[@]}"
