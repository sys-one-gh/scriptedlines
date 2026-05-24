#!/bin/bash
# ─────────────────────────────────────────────────────────────
# backup_db.sh
#
# Backs up the ScriptedLines PostgreSQL database.
# Always overwrites scriptedlines_latest.bak — no dated copies.
# Uses relative paths — works on any machine regardless of
# where the repo is cloned.
#
# Usage:
#   bash scripts/backup_db.sh
# Run from the project root: /path/to/scriptedlines/
# ─────────────────────────────────────────────────────────────

# ── GET PROJECT ROOT ─────────────────────────────────────────
# Always resolves to the scriptedlines/ root folder
# regardless of where the script is called from
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── CONFIG ───────────────────────────────────────────────────
DB_NAME="scriptedlines_db"
DB_USER="scriptedlines_user"
DB_HOST="localhost"
BACKUP_DIR="$PROJECT_ROOT/data/backups"
BACKUP_FILE="$BACKUP_DIR/scriptedlines_latest.bak"

# ── CREATE BACKUP DIRECTORY IF NEEDED ────────────────────────
mkdir -p "$BACKUP_DIR"

# ── DELETE OLD BACKUP ─────────────────────────────────────────
if [ -f "$BACKUP_FILE" ]; then
  rm "$BACKUP_FILE"
fi

# ── RUN BACKUP ───────────────────────────────────────────────
echo "Backing up $DB_NAME..."

PGPASSWORD="scriptedlines2024" pg_dump \
  -U "$DB_USER" \
  -h "$DB_HOST" \
  -F c \
  "$DB_NAME" \
  -f "$BACKUP_FILE"

# ── VERIFY ───────────────────────────────────────────────────
if [ $? -eq 0 ]; then
  SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
  echo "✔ Backup complete"
  echo "  File : $BACKUP_FILE"
  echo "  Size : $SIZE"
  echo ""
  echo "Next: git add . && git commit -m 'daily backup' && git push"
else
  echo "✗ Backup failed — check PostgreSQL is running"
  echo "  WSL:  sudo service postgresql start"
  echo "  Mac:  brew services start postgresql@16"
  exit 1
fi