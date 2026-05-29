#!/bin/bash
# ─────────────────────────────────────────────────────────────
# migrate_page_count.sh
#
# Adds page_count column to the drawings table.
# page_count = number of canvas pages within a single drawing
# (different from page_number which is the drawing's position
# in the project sequence)
#
# Usage: bash scripts/migrate_page_count.sh
# Run from project root.
# ─────────────────────────────────────────────────────────────

OS="$(uname -s)"
if [ "$OS" = "Darwin" ]; then
  PG_CMD="psql postgres -d scriptedlines_db"
else
  PG_CMD="sudo -u postgres psql -d scriptedlines_db"
fi

echo "Adding page_count column to drawings table..."

$PG_CMD -c "
  ALTER TABLE drawings
  ADD COLUMN IF NOT EXISTS page_count INTEGER DEFAULT 1 NOT NULL;
"

if [ $? -eq 0 ]; then
  echo "✔ page_count column added successfully"
else
  echo "✗ Migration failed"
  exit 1
fi
