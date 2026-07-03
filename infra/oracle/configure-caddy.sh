#!/usr/bin/env bash

set -euo pipefail

API_DOMAIN="${TRAVEL_API_DOMAIN:-api.hjh-dev.site}"
UPSTREAM="${TRAVEL_API_UPSTREAM:-127.0.0.1:8080}"
CADDYFILE="${TRAVEL_API_CADDYFILE:-/etc/caddy/Caddyfile}"
SNIPPET_FILE="${TRAVEL_API_CADDY_SNIPPET:-/etc/caddy/conf.d/travel-api.caddy}"
SNIPPET_IMPORT="$(dirname "${SNIPPET_FILE}")/*.caddy"

if [[ "${EUID}" -ne 0 ]]; then
  echo "error: run this script with sudo" >&2
  echo "usage: sudo TRAVEL_API_DOMAIN=api.hjh-dev.site bash infra/oracle/configure-caddy.sh" >&2
  exit 1
fi

if [[ -z "${API_DOMAIN}" ]]; then
  echo "error: TRAVEL_API_DOMAIN must not be empty" >&2
  exit 1
fi

if [[ -z "${UPSTREAM}" ]]; then
  echo "error: TRAVEL_API_UPSTREAM must not be empty" >&2
  exit 1
fi

if ! command -v caddy >/dev/null 2>&1; then
  echo "error: caddy is not installed" >&2
  echo "run setup-server.sh first" >&2
  exit 1
fi

echo "==> Preparing Caddy config paths"
install -d -m 755 "$(dirname "${CADDYFILE}")"
install -d -m 755 "$(dirname "${SNIPPET_FILE}")"

if [[ ! -f "${CADDYFILE}" ]]; then
  echo "==> Creating main Caddyfile: ${CADDYFILE}"
  cat > "${CADDYFILE}" <<EOF
import ${SNIPPET_IMPORT}
EOF
elif ! grep -Fxq "import ${SNIPPET_IMPORT}" "${CADDYFILE}"; then
  backup_file="${CADDYFILE}.bak.$(date +%Y%m%d_%H%M%S)"
  echo "==> Backing up existing main Caddyfile: ${backup_file}"
  cp -p "${CADDYFILE}" "${backup_file}"

  echo "==> Adding conf.d import to main Caddyfile"
  {
    echo
    echo "import ${SNIPPET_IMPORT}"
  } >> "${CADDYFILE}"
fi

echo "==> Writing API Caddy snippet: ${SNIPPET_FILE}"
if [[ -f "${SNIPPET_FILE}" ]]; then
  backup_file="${SNIPPET_FILE}.bak.$(date +%Y%m%d_%H%M%S)"
  echo "==> Backing up existing API snippet: ${backup_file}"
  cp -p "${SNIPPET_FILE}" "${backup_file}"
fi

cat > "${SNIPPET_FILE}" <<EOF
${API_DOMAIN} {
	encode zstd gzip
	reverse_proxy ${UPSTREAM}

	header {
		-Server
	}
}
EOF

chmod 644 "${CADDYFILE}"
chmod 644 "${SNIPPET_FILE}"

echo "==> Validating Caddyfile"
caddy validate --config "${CADDYFILE}"

if systemctl is-active caddy >/dev/null 2>&1; then
  echo "==> Reloading Caddy"
  systemctl reload caddy
else
  echo "==> Enabling and starting Caddy"
  systemctl enable --now caddy
fi

echo "==> Caddy status"
systemctl --no-pager --lines=20 status caddy

echo "==> Caddy configuration complete"
echo "Domain: ${API_DOMAIN}"
echo "Upstream: ${UPSTREAM}"
echo "Snippet: ${SNIPPET_FILE}"
