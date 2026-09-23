#!/usr/bin/env bash
# =========================================================================
# Database backup — dumps Postgres, gzips, uploads to S3, prunes old.
#
# Required env vars:
#   SUPABASE_DB_URL       postgres://postgres:<pass>@db.<ref>.supabase.co:5432/postgres
#   BACKUP_S3_BUCKET      your-bucket-name
#   AWS_ACCESS_KEY_ID     ...
#   AWS_SECRET_ACCESS_KEY ...
#   AWS_REGION            e.g. eu-west-1
#
# Usage:  ./scripts/backup.sh
# =========================================================================

set -euo pipefail

if [ -f .env ]; then
  set -a; source .env; set +a
fi

: "${SUPABASE_DB_URL:?SUPABASE_DB_URL is required}"
: "${BACKUP_S3_BUCKET:?BACKUP_S3_BUCKET is required}"
: "${AWS_REGION:?AWS_REGION is required}"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H-%M-%SZ")
FILENAME="sla-backup-${TIMESTAMP}.sql.gz"
TMP_PATH="/tmp/${FILENAME}"

echo "==> Dumping database to ${TMP_PATH}"
pg_dump "${SUPABASE_DB_URL}" --no-owner --no-acl --clean --if-exists | gzip > "${TMP_PATH}"

SIZE=$(du -h "${TMP_PATH}" | cut -f1)
echo "    size: ${SIZE}"

echo "==> Uploading to s3://${BACKUP_S3_BUCKET}/backups/${FILENAME}"
aws s3 cp "${TMP_PATH}" "s3://${BACKUP_S3_BUCKET}/backups/${FILENAME}" --region "${AWS_REGION}"

echo "==> Cleaning up local file"
rm -f "${TMP_PATH}"

echo "==> Pruning backups older than 30 days"
CUTOFF=$(date -u -d "30 days ago" +"%Y-%m-%dT%H-%M-%SZ")
aws s3 ls "s3://${BACKUP_S3_BUCKET}/backups/" --region "${AWS_REGION}" \
  | awk '{print $4}' \
  | while read -r key; do
    if [ -z "$key" ]; then continue; fi
    KEY_DATE=$(echo "$key" | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}-[0-9]{2}-[0-9]{2}Z' || true)
    if [ -n "$KEY_DATE" ] && [[ "$KEY_DATE" < "$CUTOFF" ]]; then
      echo "    deleting old backup: $key"
      aws s3 rm "s3://${BACKUP_S3_BUCKET}/backups/${key}" --region "${AWS_REGION}" > /dev/null
    fi
  done

echo "==> Backup complete: ${FILENAME}"