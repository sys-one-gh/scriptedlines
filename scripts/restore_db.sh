#!/bin/bash
# ─────────────────────────────────────────────────────────────
# restore_db.sh
#
# Restores the ScriptedLines database from the latest backup.
# Run this once on any new machine after cloning the repo.
# Uses relative paths — works on any machine regardless of
# where the repo is cloned.
#
# Usage:
#   bash scripts/restore_db.sh
# Run from the project root: /path/to/scriptedlines/
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

# ── CHECK BACKUP FILE EXISTS ─────────────────────────────────
if [ ! -f "$BACKUP_FILE" ]; then
  echo "✗ Backup file not found at: $BACKUP_FILE"
  echo "  Make sure you have cloned the full repo including data/backups/"
  exit 1
fi

echo "Restoring $DB_NAME from backup..."
echo "Source: $BACKUP_FILE"
echo ""

# ── DETECT OS ────────────────────────────────────────────────
# Mac and WSL/Linux use different commands to run as postgres user
OS="$(uname -s)"

# ── CREATE USER IF NOT EXISTS ────────────────────────────────
echo "Setting up database user..."
if [ "$OS" = "Darwin" ]; then
  # Mac — PostgreSQL installed via Homebrew
  psql postgres -c "
    DO \$\$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN
        CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
      END IF;
    END
    \$\$;
  " 2>/dev/null
else
  # WSL/Linux — PostgreSQL installed via apt
  sudo -u postgres psql -c "
    DO \$\$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN
        CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
      END IF;
    END
    \$\$;
  "
fi

# ── DROP AND RECREATE DATABASE ───────────────────────────────
echo "Recreating database..."
if [ "$OS" = "Darwin" ]; then
  psql postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
  psql postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
  psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
else
  sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;"
  sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
  sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
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
  echo ""
  echo "✔ Database restored successfully"
  echo ""
  echo "Verify with:"
  echo "  PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -h $DB_HOST -d $DB_NAME -c 'SELECT COUNT(*) FROM library_products;'"
else
  echo ""
  echo "✗ Restore failed"
  echo "  Make sure PostgreSQL is running:"
  echo "  WSL: sudo service postgresql start"
  echo "  Mac: brew services start postgresql@16"
  exit 1
fi