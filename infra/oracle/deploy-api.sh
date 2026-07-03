#!/usr/bin/env bash

set -euo pipefail

SOURCE_BINARY="${1:-}"
APP_DIR="${TRAVEL_API_APP_DIR:-/opt/travel-api}"
APP_BINARY="${APP_DIR}/app"
SERVICE_NAME="${TRAVEL_API_SERVICE_NAME:-travel-api}"
RUN_USER="${TRAVEL_API_RUN_USER:-travel-api}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "error: run this script with sudo" >&2
  echo "usage: sudo bash infra/oracle/deploy-api.sh /path/to/travel-api-linux-arm64" >&2
  exit 1
fi

if [[ -z "${SOURCE_BINARY}" ]]; then
  echo "error: source binary path is required" >&2
  echo "usage: sudo bash infra/oracle/deploy-api.sh /path/to/travel-api-linux-arm64" >&2
  exit 1
fi

if [[ ! -f "${SOURCE_BINARY}" ]]; then
  echo "error: source binary does not exist: ${SOURCE_BINARY}" >&2
  exit 1
fi

if [[ ! -s "${SOURCE_BINARY}" ]]; then
  echo "error: source binary is empty: ${SOURCE_BINARY}" >&2
  exit 1
fi

echo "==> Installing API binary"
install -d -m 755 "${APP_DIR}"
install -m 755 "${SOURCE_BINARY}" "${APP_BINARY}"

if id "${RUN_USER}" >/dev/null 2>&1; then
  chown "${RUN_USER}:${RUN_USER}" "${APP_DIR}" "${APP_BINARY}"
else
  echo "warning: run user '${RUN_USER}' does not exist; leaving binary owned by root" >&2
fi

echo "==> Reloading systemd"
systemctl daemon-reload

if systemctl cat "${SERVICE_NAME}.service" >/dev/null 2>&1; then
  echo "==> Enabling ${SERVICE_NAME}"
  systemctl enable "${SERVICE_NAME}"

  echo "==> Restarting ${SERVICE_NAME}"
  systemctl restart "${SERVICE_NAME}"

  echo "==> Checking ${SERVICE_NAME} status"
  systemctl --no-pager --lines=20 status "${SERVICE_NAME}"
else
  echo "warning: ${SERVICE_NAME}.service is not installed yet; binary installed only" >&2
fi

echo "==> Deployment script complete"
