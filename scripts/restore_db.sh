#!/bin/bash
# ─────────────────────────────────────────────────────────────
# restore_db.sh
# Works on both WSL and Mac.
# Usage: bash scripts/restore_db.sh
# Run from project root. Stop uvicorn before running.
# ─────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

DB_NAME="scriptedlines_db"
DB_USER="scriptedlines_user"
DB_PASSWORD="scriptedlines2024"
DB_HOST="localhost"
BACKUP_FILE="$PROJECT_ROOT/data/backups/scriptedlines_latest.bak"

# ── CHECK BACKUP ─────────────────────────────────────────────
if [ ! -f "$BACKUP_FILE" ]; then
  echo "✗ Backup file not found at: $BACKUP_FILE"
  exit 1
fi

# ── DETECT OS ────────────────────────────────────────────────
OS="$(uname -s)"
if [ "$OS" = "Darwin" ]; then
  echo "Detected: Mac"
  PG_SUPER="psql postgres"
else
  echo "Detected: Linux/WSL"
  PG_SUPER="sudo -u postgres psql"
fi

echo "Restoring $DB_NAME from backup..."
echo "Source: $BACKUP_FILE"
echo ""

# ── CREATE USER IF NOT EXISTS ────────────────────────────────
echo "Setting up database user..."
$PG_SUPER -c "
  DO \$\$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN
      CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
    END IF;
  END
  \$\$;
"

# ── TERMINATE CONNECTIONS + DROP + RECREATE ──────────────────
echo "Terminating connections and recreating database..."
$PG_SUPER -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();
"
$PG_SUPER -c "DROP DATABASE IF EXISTS $DB_NAME;"
$PG_SUPER -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
$PG_SUPER -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# ── SET UP .pgpass (Mac only) ─────────────────────────────────
if [ "$OS" = "Darwin" ]; then
  PGPASS_LINE="$DB_HOST:5432:$DB_NAME:$DB_USER:$DB_PASSWORD"
  if ! grep -q "$PGPASS_LINE" ~/.pgpass 2>/dev/null; then
    echo "$PGPASS_LINE" >> ~/.pgpass
    chmod 600 ~/.pgpass
  fi
fi

# ── RESTORE ──────────────────────────────────────────────────
echo "Restoring data..."
if [ "$OS" = "Darwin" ]; then
  PGPASSWORD="$DB_PASSWORD" pg_restore \
    -U "$DB_USER" \
    -h "$DB_HOST" \
    -d "$DB_NAME" \
    --no-owner \
    --clean \
    --if-exists \
    "$BACKUP_FILE"
else
  # WSL: restore as postgres superuser via peer auth — no password needed
  sudo -u postgres pg_restore \
    -d "$DB_NAME" \
    --no-owner \
    --clean \
    --if-exists \
    "$BACKUP_FILE"
  # Grant permissions to scriptedlines_user after restore
  sudo -u postgres psql -d "$DB_NAME" -c "
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
    GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO $DB_USER;
  "
fi

# ── VERIFY ───────────────────────────────────────────────────
if [ "$OS" = "Darwin" ]; then
  COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -h "$DB_HOST" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM library_products;" 2>/dev/null | tr -d ' ')
else
  COUNT=$(sudo -u postgres psql -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM library_products;" 2>/dev/null | tr -d ' ')
fi

if [ -n "$COUNT" ] && [ "$COUNT" -gt 0 ]; then
  echo ""
  echo "✔ Database restored successfully"
  echo "  Products in library: $COUNT"
  echo ""
  echo "Next: start servers — see DAILY_START.md"
else
  echo ""
  echo "✗ Restore failed — could not verify library_products"
  echo "  Make sure PostgreSQL is running:"
  echo "  WSL:  sudo service postgresql start"
  echo "  Mac:  brew services start postgresql@16"
  exit 1
fi