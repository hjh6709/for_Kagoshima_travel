#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR=${1:-/home/opc/travel-api}
SERVICE_NAME=${2:-travel-api}
ENV_FILE="$TARGET_DIR/.env"
CURRENT_BINARY="$TARGET_DIR/travel-api"
NEXT_BINARY="$TARGET_DIR/travel-api.next"
SERVICE_FILE="$TARGET_DIR/travel-api.service"
DEPLOY_ID=$(date -u +%Y%m%dT%H%M%SZ)
ROLLBACK_BINARY="$TARGET_DIR/travel-api.rollback-$DEPLOY_ID"
FAILED_BINARY="$TARGET_DIR/travel-api.failed-$DEPLOY_ID"

fail() {
    echo "deployment rejected: $1" >&2
    exit 1
}

env_value() {
    sed -n "s/^$1=//p" "$ENV_FILE" | tail -n 1
}

validate_production_config() {
    [ -f "$ENV_FILE" ] || fail "missing $ENV_FILE"
    grep -Eq '^APP_ENV=(production|prod)$' "$ENV_FILE" || fail "APP_ENV must be production"
    grep -Eq '^DATABASE_URL=.+$' "$ENV_FILE" || fail "DATABASE_URL is required"
    grep -Eq '^ALLOWED_ORIGINS=.+$' "$ENV_FILE" || fail "ALLOWED_ORIGINS is required"
    if grep -Eq '^AUTH_TEST_BYPASS=.+$' "$ENV_FILE"; then
        fail "AUTH_TEST_BYPASS must not be set"
    fi

    local jwt_value
    jwt_value=$(env_value JWT_SECRET)
    [ "${#jwt_value}" -ge 32 ] || fail "JWT_SECRET must be at least 32 characters"
    case "${jwt_value,,}" in
        *replace*|*change-me*|*super-secret*) fail "JWT_SECRET must not be a placeholder" ;;
    esac

    local port_value
    port_value=$(env_value PORT)
    if [ -n "$port_value" ] && [[ ! "$port_value" =~ ^[0-9]+$ ]]; then
        fail "PORT must be numeric"
    fi
}

wait_until_healthy() {
    local port_value attempts
    port_value=$(env_value PORT)
    port_value=${port_value:-8080}
    attempts=${HEALTH_CHECK_ATTEMPTS:-30}

    for ((attempt = 1; attempt <= attempts; attempt++)); do
        if sudo systemctl is-active --quiet "$SERVICE_NAME" \
            && curl --fail --silent --max-time 2 "http://127.0.0.1:$port_value/healthz" >/dev/null; then
            return 0
        fi
        sleep 1
    done
    return 1
}

rollback() {
    if [ ! -f "$ROLLBACK_BINARY" ]; then
        echo "rollback unavailable: this was the first deployment" >&2
        return 1
    fi

    echo "health check failed; restoring previous binary" >&2
    sudo systemctl stop "$SERVICE_NAME" || true
    if [ -f "$CURRENT_BINARY" ]; then
        mv "$CURRENT_BINARY" "$FAILED_BINARY"
    fi
    mv "$ROLLBACK_BINARY" "$CURRENT_BINARY"
    chmod 750 "$CURRENT_BINARY"
    sudo systemctl start "$SERVICE_NAME"
    wait_until_healthy
}

validate_production_config
[ -f "$NEXT_BINARY" ] || fail "missing staged binary $NEXT_BINARY"
[ -f "$SERVICE_FILE" ] || fail "missing $SERVICE_FILE"

chmod 600 "$ENV_FILE"
chmod 750 "$NEXT_BINARY"
sudo cp "$SERVICE_FILE" "/etc/systemd/system/$SERVICE_NAME.service"
sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE_NAME"

if [ -f "$CURRENT_BINARY" ]; then
    mv "$CURRENT_BINARY" "$ROLLBACK_BINARY"
fi
mv "$NEXT_BINARY" "$CURRENT_BINARY"

if ! sudo systemctl restart "$SERVICE_NAME" || ! wait_until_healthy; then
    rollback || echo "rollback health check also failed; inspect systemd logs" >&2
    exit 1
fi

# 새 프로세스와 DB migration까지 확인된 뒤에만 이전 바이너리를 제거한다.
if [ -f "$ROLLBACK_BINARY" ]; then
    rm -f "$ROLLBACK_BINARY"
fi
echo "deployment healthy: $SERVICE_NAME"
