#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
TEST_ROOT=$(mktemp -d)
trap 'rm -rf "$TEST_ROOT"' EXIT

TARGET_DIR="$TEST_ROOT/travel-api"
FAKE_BIN="$TEST_ROOT/bin"
CURL_LOG="$TEST_ROOT/curl.log"
mkdir -p "$TARGET_DIR" "$FAKE_BIN"

printf '%s\n' \
    'APP_ENV=production' \
    'DATABASE_URL=postgres://example' \
    'ALLOWED_ORIGINS=https://example.com' \
    'JWT_SECRET=01234567890123456789012345678901' \
    > "$TARGET_DIR/.env"
printf '%s\n' '[Service]' > "$TARGET_DIR/travel-api.service"
printf '%s\n' 'old' > "$TARGET_DIR/travel-api.old"
printf '%s\n' 'new' > "$TARGET_DIR/travel-api.next"

cat > "$FAKE_BIN/sudo" <<'EOF'
#!/usr/bin/env bash
if [ "${1:-}" = "cp" ]; then
    exit 0
fi
exec "$@"
EOF

cat > "$FAKE_BIN/systemctl" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF

cat > "$FAKE_BIN/curl" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$CURL_LOG_FOR_TEST"
grep -qx 'old' "$TARGET_DIR_FOR_TEST/travel-api"
EOF

cat > "$FAKE_BIN/sleep" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF
chmod 750 "$FAKE_BIN/sudo" "$FAKE_BIN/systemctl" "$FAKE_BIN/curl" "$FAKE_BIN/sleep"

if PATH="$FAKE_BIN:$PATH" \
    TARGET_DIR_FOR_TEST="$TARGET_DIR" \
    CURL_LOG_FOR_TEST="$CURL_LOG" \
    HEALTH_CHECK_ATTEMPTS=1 \
    bash "$REPO_ROOT/scripts/deploy-api-on-vm.sh" "$TARGET_DIR"; then
    echo "expected the unhealthy new deployment to fail" >&2
    exit 1
fi

grep -qx 'old' "$TARGET_DIR/travel-api" || {
    echo "legacy travel-api.old was not restored after deployment failure" >&2
    exit 1
}

grep -q '/readyz' "$CURL_LOG" || {
    echo "deployment did not verify the readiness endpoint" >&2
    exit 1
}

echo "legacy rollback recovery passed"
