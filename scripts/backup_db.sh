#!/bin/bash
# ─────────────────────────────────────────────────────────────
# backup_db.sh
# Works on both WSL and Mac.
# Usage: bash scripts/backup_db.sh
# Run from project root.
# ─────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

DB_NAME="scriptedlines_db"
DB_USER="scriptedlines_user"
DB_HOST="localhost"
BACKUP_DIR="$PROJECT_ROOT/data/backups"
BACKUP_FILE="$BACKUP_DIR/scriptedlines_latest.bak"

mkdir -p "$BACKUP_DIR"
rm -f "$BACKUP_FILE"

# ── DETECT OS ────────────────────────────────────────────────
OS="$(uname -s)"
if [ "$OS" = "Darwin" ]; then
  echo "Detected: Mac"
  # Mac: use scriptedlines_user with password over TCP
  PGPASSWORD="scriptedlines2024" pg_dump \
    -U "$DB_USER" \
    -h "$DB_HOST" \
    -F c \
    "$DB_NAME" \
    -f "$BACKUP_FILE"
else
  echo "Detected: Linux/WSL"
  # WSL: use postgres superuser via peer auth (no password needed)
  sudo -u postgres pg_dump \
    -F c \
    "$DB_NAME" \
    -f "$BACKUP_FILE"
  # Make readable by current user
  sudo chmod 644 "$BACKUP_FILE"
fi

if [ $? -eq 0 ] && [ -f "$BACKUP_FILE" ]; then
  SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
  echo "✔ Backup complete"
  echo "  File : $BACKUP_FILE"
  echo "  Size : $SIZE"
  echo ""
  echo "Next: git add . && git commit -m 'daily backup' && git push origin working"
else
  echo "✗ Backup failed — check PostgreSQL is running"
  echo "  WSL: sudo service postgresql start"
  echo "  Mac: brew services start postgresql@16"
  exit 1
fi