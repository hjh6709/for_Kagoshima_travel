#!/usr/bin/env bash

set -euo pipefail

umask 077
BACKUP_DIR="${TRAVEL_API_BACKUP_DIR:-${HOME}/backups/travel-api}"
RETENTION_DAYS="${TRAVEL_API_BACKUP_RETENTION_DAYS:-14}"
DB_TARGET="${TRAVEL_API_BACKUP_DB:-${DATABASE_URL:-}}"
BUCKET="${TRAVEL_API_BACKUP_BUCKET:-}"
NAMESPACE="${TRAVEL_API_BACKUP_NAMESPACE:-}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%S)"

if [[ -z "$DB_TARGET" ]]; then
  echo "error: TRAVEL_API_BACKUP_DB or DATABASE_URL is required" >&2
  exit 1
fi

if ! [[ "${RETENTION_DAYS}" =~ ^[0-9]+$ ]]; then
  echo "error: TRAVEL_API_BACKUP_RETENTION_DAYS must be a non-negative integer" >&2
  exit 1
fi

for tool in pg_dump pg_restore; do
  command -v "$tool" >/dev/null 2>&1 || { echo "error: $tool is required" >&2; exit 1; }
done
if [[ -n "$BUCKET" ]]; then
  command -v oci >/dev/null 2>&1 || { echo "error: oci is required for off-VM backup" >&2; exit 1; }
fi

mkdir -p "${BACKUP_DIR}"
resolved_backup_dir=$(cd "$BACKUP_DIR" && pwd -P)
resolved_work_dir=$(pwd -P)
resolved_home_dir=$(cd "${HOME:-/}" && pwd -P)
if [[ "$resolved_backup_dir" == / || "$resolved_backup_dir" == "$resolved_home_dir" || "$resolved_backup_dir" == "$resolved_work_dir" ]]; then
  echo "error: backup directory must not be root, home, or the working directory" >&2
  exit 1
fi
chmod 700 "${BACKUP_DIR}"
TEMP_FILE=$(mktemp "${BACKUP_DIR}/.travel_db.XXXXXXXX")
trap 'rm -f -- "$TEMP_FILE"' EXIT
BACKUP_FILE="${BACKUP_DIR}/travel_db_${TIMESTAMP}_${TEMP_FILE##*.}.dump"

echo "==> Writing PostgreSQL backup: ${BACKUP_FILE}"
pg_dump --format=custom --file="${TEMP_FILE}" "$DB_TARGET"
pg_restore --list "$TEMP_FILE" >/dev/null
if [[ -e "$BACKUP_FILE" ]]; then
  echo "error: backup file already exists: $BACKUP_FILE" >&2
  exit 1
fi
mv -- "$TEMP_FILE" "$BACKUP_FILE"
chmod 600 "${BACKUP_FILE}"

if [[ -n "$BUCKET" ]]; then
  object_name="db/$(basename "$BACKUP_FILE")"
  oci_args=(os object put --auth instance_principal --bucket-name "$BUCKET" --name "$object_name" --file "$BACKUP_FILE")
  if [[ -n "$NAMESPACE" ]]; then
    oci_args+=(--namespace-name "$NAMESPACE")
  fi
  oci "${oci_args[@]}" --no-multipart --no-overwrite --verify-checksum
  echo "==> Off-VM backup verified: $BUCKET/$object_name"
fi

if [[ "${RETENTION_DAYS}" -gt 0 ]]; then
  echo "==> Removing backups older than ${RETENTION_DAYS} days from ${BACKUP_DIR}"
  find "${BACKUP_DIR}" -maxdepth 1 -type f -name "travel_db_*.dump" -mtime "+${RETENTION_DAYS}" -delete
else
  echo "==> Backup retention cleanup disabled"
fi

echo "==> Backup complete: ${BACKUP_FILE}"
