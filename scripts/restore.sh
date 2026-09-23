#!/usr/bin/env bash
# =========================================================================
# Restore a backup into a TARGET database (never production).
#
# Usage:  ./scripts/restore.sh <path-to-.sql.gz>
#
# Required env vars:
#   TARGET_DB_URL   postgres://postgres:<pass>@<host>:5432/postgres
# =========================================================================

set -euo pipefail

if [ -f .env ]; then
  set -a; source .env; set +a
fi

DUMP="${1:?Usage: restore.sh <path-to-.sql.gz>}"
: "${TARGET_DB_URL:?TARGET_DB_URL is required}"

if [ ! -f "$DUMP" ]; then
  echo "Error: dump file not found: $DUMP"
  exit 1
fi

echo "==> Restoring ${DUMP} into ${TARGET_DB_URL}"
read -r -p "This will OVERWRITE the target database. Continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

gunzip -c "$DUMP" | psql "${TARGET_DB_URL}"

echo "==> Restore complete."