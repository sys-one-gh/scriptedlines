#!/bin/bash
# ─────────────────────────────────────────────────────────────
# restore_db.sh
#
# Restores the ScriptedLines database from the latest backup.
# Run this once on any new machine after cloning the repo.
# Works on both WSL and Mac — same path on both machines.
# Automatically detects OS for correct PostgreSQL commands.
#
# Usage:
#   bash scripts/restore_db.sh
# Run from project root: /home/restricted_space/projects/scriptedlines/
# ─────────────────────────────────────────────────────────────

# ── GET PROJECT ROOT ─────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── CONFIG ───────────────────────────────────────────────────
DB_NAME="scriptedlines_db"
DB_USER="scriptedlines_user"
DB_PASSWORD="scriptedlines2024"
DB_HOST="localhost"
BACKUP_FILE="$PROJECT_ROOT/data/backups/scriptedlines_latest.bak"

# ── DETECT OS ────────────────────────────────────────────────
OS="$(uname -s)"
if [ "$OS" = "Darwin" ]; then
  echo "Detected: Mac"
  PG_CMD="psql postgres"
else
  echo "Detected: Linux/WSL"
  PG_CMD="sudo -u postgres psql"
fi

# ── CHECK BACKUP FILE EXISTS ─────────────────────────────────
if [ ! -f "$BACKUP_FILE" ]; then
  echo "✗ Backup file not found at: $BACKUP_FILE"
  echo "  Make sure the repo includes data/backups/scriptedlines_latest.bak"
  exit 1
fi

echo "Restoring $DB_NAME from backup..."
echo "Source: $BACKUP_FILE"
echo ""

# ── CREATE USER IF NOT EXISTS ────────────────────────────────
echo "Setting up database user..."
$PG_CMD -c "
  DO \$\$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN
      CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
    END IF;
  END
  \$\$;
"

# ── DROP AND RECREATE DATABASE ───────────────────────────────
echo "Recreating database..."
$PG_CMD -c "DROP DATABASE IF EXISTS $DB_NAME;"
$PG_CMD -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
$PG_CMD -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
$PG_CMD -c "ALTER DATABASE $DB_NAME OWNER TO $DB_USER;"

# ── SET UP .pgpass IF NOT EXISTS ─────────────────────────────
PGPASS_LINE="$DB_HOST:5432:$DB_NAME:$DB_USER:$DB_PASSWORD"
if ! grep -q "$PGPASS_LINE" ~/.pgpass 2>/dev/null; then
  echo "$PGPASS_LINE" >> ~/.pgpass
  chmod 600 ~/.pgpass
  echo "✔ .pgpass configured"
fi

# ── RESTORE FROM BACKUP ──────────────────────────────────────
echo "Restoring data..."
PGPASSWORD="$DB_PASSWORD" pg_restore \
  -U "$DB_USER" \
  -h "$DB_HOST" \
  -d "$DB_NAME" \
  --no-owner \
  "$BACKUP_FILE"

# ── VERIFY ───────────────────────────────────────────────────
if [ $? -eq 0 ]; then
  COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -h "$DB_HOST" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM library_products;" | tr -d ' ')
  echo ""
  echo "✔ Database restored successfully"
  echo "  Products in library: $COUNT"
  echo ""
  echo "Next: start servers — see DAILY_START.md"
else
  echo ""
  echo "✗ Restore failed"
  echo "  Make sure PostgreSQL is running:"
  echo "  WSL: sudo service postgresql start"
  echo "  Mac: brew services start postgresql@16"
  exit 1
fi