#!/bin/bash
# ─────────────────────────────────────────────────────────────
# backup_db.sh
#
# Backs up the ScriptedLines PostgreSQL database.
# Always overwrites scriptedlines_latest.bak — no dated copies.
# Run this at the end of every day before pushing to GitHub.
#
# Usage:
#   bash scripts/backup_db.sh
# ─────────────────────────────────────────────────────────────

# ── CONFIG ───────────────────────────────────────────────────
DB_NAME="scriptedlines_db"
DB_USER="scriptedlines_user"
DB_HOST="localhost"
BACKUP_DIR="$(dirname "$0")/../data/backups"
BACKUP_FILE="$BACKUP_DIR/scriptedlines_latest.bak"

# ── CREATE BACKUP DIRECTORY IF NEEDED ────────────────────────
mkdir -p "$BACKUP_DIR"

# ── DELETE OLD BACKUP ─────────────────────────────────────────
# Always overwrite — never keep dated copies
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
  echo "  Run: sudo service postgresql start"
  exit 1
fi