#!/usr/bin/env bash
# Daily PostgreSQL backup for Kinetiq (DEPLOYMENT_PLAN Phase 8.1)
# Install on OCI host cron:
#   0 3 * * * /opt/kinetiq/scripts/backup-db.sh >> /var/log/kinetiq-backup.log 2>&1

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-kinetiq-postgres-1}"
RETAIN_DAYS="${RETAIN_DAYS:-7}"
STAMP="$(date +%F)"
OUT_FILE="${BACKUP_DIR}/kinetiq-${STAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

docker exec "${POSTGRES_CONTAINER}" pg_dump -U kinetiq kinetiq | gzip > "${OUT_FILE}"

find "${BACKUP_DIR}" -name 'kinetiq-*.sql.gz' -mtime +"${RETAIN_DAYS}" -delete

echo "[$(date -Is)] Backup written to ${OUT_FILE}"
