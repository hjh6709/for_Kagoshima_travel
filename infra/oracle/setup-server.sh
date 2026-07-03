#!/usr/bin/env bash

set -euo pipefail

APP_DIR="${TRAVEL_API_APP_DIR:-/opt/travel-api}"
ENV_DIR="${TRAVEL_API_ENV_DIR:-/etc/travel-api}"
RUN_USER="${TRAVEL_API_RUN_USER:-travel-api}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "error: run this script with sudo" >&2
  echo "usage: sudo bash infra/oracle/setup-server.sh" >&2
  exit 1
fi

if [[ ! -r /etc/os-release ]]; then
  echo "error: /etc/os-release is required to detect the Linux distribution" >&2
  exit 1
fi

. /etc/os-release

setup_ubuntu() {
  export DEBIAN_FRONTEND=noninteractive

  echo "==> Updating Ubuntu packages"
  apt-get update
  apt-get upgrade -y

  echo "==> Installing Ubuntu base packages"
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
    chmod o+r /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    chmod o+r /etc/apt/sources.list.d/caddy-stable.list
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

  systemctl enable --now postgresql
  systemctl enable --now caddy
}

setup_oracle_linux() {
  echo "==> Updating Oracle Linux packages"
  dnf upgrade -y

  echo "==> Installing Oracle Linux base packages"
  dnf install -y \
    ca-certificates \
    curl \
    dnf-plugins-core \
    firewalld \
    git \
    postgresql-contrib \
    postgresql-server

  if ! command -v caddy >/dev/null 2>&1; then
    echo "==> Installing Caddy"
    dnf copr enable -y @caddy/caddy
    dnf install -y caddy
  else
    echo "==> Caddy is already installed"
  fi

  if [[ ! -f /var/lib/pgsql/data/PG_VERSION ]]; then
    echo "==> Initializing PostgreSQL data directory"
    postgresql-setup --initdb
  else
    echo "==> PostgreSQL data directory is already initialized"
  fi

  echo "==> Configuring firewalld"
  systemctl enable --now firewalld
  firewall-cmd --permanent --add-service=ssh
  firewall-cmd --permanent --add-service=http
  firewall-cmd --permanent --add-service=https
  firewall-cmd --reload

  systemctl enable --now postgresql
  systemctl enable --now caddy
}

case "${ID}" in
  ubuntu|debian)
    setup_ubuntu
    ;;
  ol|rhel|rocky|almalinux|centos)
    setup_oracle_linux
    ;;
  *)
    echo "error: unsupported Linux distribution: ${PRETTY_NAME:-${ID}}" >&2
    echo "supported: Ubuntu/Debian, Oracle Linux/RHEL-compatible distributions" >&2
    exit 1
    ;;
esac

echo "==> Creating application directories"
install -d -m 755 "${APP_DIR}"
install -d -m 755 "${ENV_DIR}"

if ! id "${RUN_USER}" >/dev/null 2>&1; then
  echo "==> Creating ${RUN_USER} system user"
  nologin_shell="/usr/sbin/nologin"
  if [[ ! -x "${nologin_shell}" ]]; then
    nologin_shell="/sbin/nologin"
  fi
  useradd --system --home-dir "${APP_DIR}" --shell "${nologin_shell}" "${RUN_USER}"
fi

chown "${RUN_USER}:${RUN_USER}" "${APP_DIR}"
chmod 755 "${APP_DIR}"
chown root:root "${ENV_DIR}"
chmod 755 "${ENV_DIR}"

echo "==> Setup complete"
echo "Distribution: ${PRETTY_NAME:-${ID}}"
echo "Application directory: ${APP_DIR}"
echo "Environment directory: ${ENV_DIR}"
echo "Run user: ${RUN_USER}"
echo
echo "Next steps:"
echo "1. Create PostgreSQL user/database manually."
echo "2. Write ${ENV_DIR}/travel-api.env with production secrets."
echo "3. Add the systemd service in a later deployment step."
