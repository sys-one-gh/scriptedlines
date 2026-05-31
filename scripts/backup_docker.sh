#!/bin/bash
# ─────────────────────────────────────────────────────────────
# scripts/backup_docker.sh
# Backs up the database from the Docker container.
# Works on both WSL and Mac.
#
# Usage:
#   bash scripts/backup_docker.sh
# ─────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/data/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/scriptedlines_${TIMESTAMP}.bak"
LATEST_FILE="$BACKUP_DIR/scriptedlines_latest.bak"

mkdir -p "$BACKUP_DIR"

echo "Backing up database..."
docker-compose -f "$PROJECT_DIR/docker-compose.yml" exec -T db \
  pg_dump -U scriptedlines_user -F c scriptedlines_db > "$BACKUP_FILE"

# Also update the latest backup
cp "$BACKUP_FILE" "$LATEST_FILE"

echo "✔ Backup saved to: $BACKUP_FILE"
echo "✔ Latest backup updated: $LATEST_FILE"

# Keep only last 10 timestamped backups
cd "$BACKUP_DIR"
ls -t scriptedlines_2*.bak 2>/dev/null | tail -n +11 | xargs -r rm --
echo "✔ Old backups cleaned up (keeping last 10)"
