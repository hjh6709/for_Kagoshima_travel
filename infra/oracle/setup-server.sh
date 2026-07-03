#!/usr/bin/env bash

set -euo pipefail

APP_DIR="${TRAVEL_API_APP_DIR:-/opt/travel-api}"
ENV_DIR="${TRAVEL_API_ENV_DIR:-/etc/travel-api}"
RUN_USER="${TRAVEL_API_RUN_USER:-${SUDO_USER:-ubuntu}}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "error: run this script with sudo" >&2
  echo "usage: sudo bash infra/oracle/setup-server.sh" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "==> Updating Ubuntu packages"
apt-get update
apt-get upgrade -y

echo "==> Installing base packages"
apt-get install -y \
  apt-transport-https \
  ca-certificates \
  curl \
  debian-archive-keyring \
  debian-keyring \
  git \
  gnupg \
  postgresql \
  postgresql-contrib \
  ufw

if ! command -v caddy >/dev/null 2>&1; then
  echo "==> Installing Caddy"
  curl -1sLf "https://dl.cloudsmith.io/public/caddy/stable/gpg.key" \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf "https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt" \
    | tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  apt-get update
  apt-get install -y caddy
else
  echo "==> Caddy is already installed"
fi

echo "==> Configuring UFW"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> Creating application directories"
install -d -m 755 "${APP_DIR}"
install -d -m 755 "${ENV_DIR}"

if id "${RUN_USER}" >/dev/null 2>&1; then
  chown "${RUN_USER}:${RUN_USER}" "${APP_DIR}"
else
  echo "warning: run user '${RUN_USER}' does not exist; leaving ${APP_DIR} owned by root" >&2
fi

chmod 755 "${APP_DIR}"
chown root:root "${ENV_DIR}"
chmod 755 "${ENV_DIR}"

echo "==> Setup complete"
echo "Application directory: ${APP_DIR}"
echo "Environment directory: ${ENV_DIR}"
echo "Run user: ${RUN_USER}"
echo
echo "Next steps:"
echo "1. Create PostgreSQL user/database manually."
echo "2. Write ${ENV_DIR}/travel-api.env with production secrets."
echo "3. Add the systemd service in a later deployment step."
