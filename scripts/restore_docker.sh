#!/bin/bash
# ─────────────────────────────────────────────────────────────
# scripts/restore_docker.sh
# Restores the database into the Docker container.
# Defaults to scriptedlines_latest.bak if no file specified.
#
# Usage:
#   bash scripts/restore_docker.sh                           # restores latest
#   bash scripts/restore_docker.sh data/backups/myfile.bak  # restores specific
# ─────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_FILE="${1:-$PROJECT_DIR/data/backups/scriptedlines_latest.bak}"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "Restoring from: $BACKUP_FILE"
echo "⚠️  This will overwrite the current database. Press Ctrl+C to cancel..."
sleep 3

# Drop and recreate database
docker-compose -f "$PROJECT_DIR/docker-compose.yml" exec -T db \
  psql -U postgres -c "DROP DATABASE IF EXISTS scriptedlines_db;"
docker-compose -f "$PROJECT_DIR/docker-compose.yml" exec -T db \
  psql -U postgres -c "CREATE DATABASE scriptedlines_db OWNER scriptedlines_user;"

# Restore
docker-compose -f "$PROJECT_DIR/docker-compose.yml" exec -T db \
  pg_restore -U scriptedlines_user -d scriptedlines_db < "$BACKUP_FILE"

echo "✔ Database restored successfully"
