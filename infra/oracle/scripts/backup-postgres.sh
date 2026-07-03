#!/usr/bin/env bash

set -euo pipefail

BACKUP_DIR="${TRAVEL_API_BACKUP_DIR:-${HOME}/backups/travel-api}"
RETENTION_DAYS="${TRAVEL_API_BACKUP_RETENTION_DAYS:-14}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/travel_app_${TIMESTAMP}.sql"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "error: DATABASE_URL environment variable is required" >&2
  echo "example: DATABASE_URL='postgres://travel_app:<STRONG_DB_PASSWORD>@localhost:5432/travel_app?sslmode=disable' bash infra/oracle/scripts/backup-postgres.sh" >&2
  exit 1
fi

if ! [[ "${RETENTION_DAYS}" =~ ^[0-9]+$ ]]; then
  echo "error: TRAVEL_API_BACKUP_RETENTION_DAYS must be a non-negative integer" >&2
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "error: pg_dump is not installed or not in PATH" >&2
  exit 1
fi

mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"

echo "==> Writing PostgreSQL backup: ${BACKUP_FILE}"
pg_dump "${DATABASE_URL}" > "${BACKUP_FILE}"
chmod 600 "${BACKUP_FILE}"

if [[ "${RETENTION_DAYS}" -gt 0 ]]; then
  echo "==> Removing backups older than ${RETENTION_DAYS} days from ${BACKUP_DIR}"
  find "${BACKUP_DIR}" -type f -name "travel_app_*.sql" -mtime "+${RETENTION_DAYS}" -delete
else
  echo "==> Backup retention cleanup disabled"
fi

echo "==> Backup complete: ${BACKUP_FILE}"
