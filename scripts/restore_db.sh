#!/bin/bash
# ─────────────────────────────────────────────────────────────
# restore_db.sh
# Restores the database from the latest backup.
# Run this on a new machine after cloning the repo.
# ─────────────────────────────────────────────────────────────

DB_NAME="scriptedlines_db"
DB_USER="scriptedlines_user"
BACKUP_FILE="/home/restricted_space/projects/scriptedlines/data/backups/scriptedlines_latest.bak"

echo "Restoring $DB_NAME from $BACKUP_FILE..."

# Drop and recreate database
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

# Restore from backup
pg_restore -U $DB_USER -h localhost -d $DB_NAME $BACKUP_FILE

echo "Database restored successfully."