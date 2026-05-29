#!/bin/bash
# ─────────────────────────────────────────────────────────────
# migrate_paper_sizes.sh
#
# Adds new paper size values to the papersize enum in PostgreSQL.
# Run once after deploying the updated drawing.py model.
#
# Usage: bash scripts/migrate_paper_sizes.sh
# ─────────────────────────────────────────────────────────────

OS="$(uname -s)"
if [ "$OS" = "Darwin" ]; then
  PG_CMD="psql postgres"
else
  PG_CMD="sudo -u postgres psql"
fi

echo "Adding new paper sizes to papersize enum..."

$PG_CMD -d scriptedlines_db -c "
  ALTER TYPE papersize ADD VALUE IF NOT EXISTS 'Arch_C';
  ALTER TYPE papersize ADD VALUE IF NOT EXISTS 'ANSI_B';
  ALTER TYPE papersize ADD VALUE IF NOT EXISTS 'ANSI_A';
  ALTER TYPE papersize ADD VALUE IF NOT EXISTS 'A1';
  ALTER TYPE papersize ADD VALUE IF NOT EXISTS 'A3';
"

if [ $? -eq 0 ]; then
  echo "✔ Paper sizes updated successfully"
else
  echo "✗ Migration failed"
  exit 1
fi
