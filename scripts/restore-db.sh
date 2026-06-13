#!/usr/bin/env bash
# Restore PostgreSQL backup for Kinetiq (run once before beta to verify backups)
# Usage: ./restore-db.sh /backups/kinetiq-2026-06-13.sql.gz

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <backup.sql.gz>" >&2
  exit 1
fi

BACKUP_FILE="$1"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-kinetiq-postgres-1}"

if [[ ! -f "${BACKUP_FILE}" ]]; then
  echo "Backup file not found: ${BACKUP_FILE}" >&2
  exit 1
fi

echo "Restoring ${BACKUP_FILE} into ${POSTGRES_CONTAINER}..."
gunzip -c "${BACKUP_FILE}" | docker exec -i "${POSTGRES_CONTAINER}" psql -U kinetiq -d kinetiq
echo "Restore complete."
