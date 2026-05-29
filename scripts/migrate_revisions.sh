#!/bin/bash
# ─────────────────────────────────────────────────────────────
# migrate_revisions.sh
#
# Creates drawing_revisions table and extends drawingstatus enum
# with submittal_pending and submitted values.
#
# Usage: bash scripts/migrate_revisions.sh
# ─────────────────────────────────────────────────────────────

OS="$(uname -s)"
if [ "$OS" = "Darwin" ]; then
  PG_CMD="psql postgres -d scriptedlines_db"
else
  PG_CMD="sudo -u postgres psql -d scriptedlines_db"
fi

echo "Adding new status enum values..."
$PG_CMD -c "ALTER TYPE drawingstatus ADD VALUE IF NOT EXISTS 'submittal_pending';"
$PG_CMD -c "ALTER TYPE drawingstatus ADD VALUE IF NOT EXISTS 'submitted';"

echo "Creating drawing_revisions table..."
$PG_CMD -c "
CREATE TABLE IF NOT EXISTS drawing_revisions (
  id              SERIAL PRIMARY KEY,
  drawing_id      INTEGER NOT NULL REFERENCES drawings(id) ON DELETE CASCADE,
  revision_number VARCHAR NOT NULL DEFAULT '00',
  date            DATE,
  initials        VARCHAR,
  description     VARCHAR,
  is_locked       BOOLEAN NOT NULL DEFAULT FALSE,
  pdf_path        VARCHAR,
  committed_at    TIMESTAMP WITH TIME ZONE,
  committed_by    INTEGER REFERENCES users(id),
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_drawing_revisions_drawing_id ON drawing_revisions(drawing_id);
"

if [ $? -eq 0 ]; then
  echo "✔ Migration complete"
else
  echo "✗ Migration failed"
  exit 1
fi
