#!/bin/bash
# migrate_templates.sh
# Creates drawing_templates table and adds title_block_overrides
# to drawings table.

OS="$(uname -s)"
if [ "$OS" = "Darwin" ]; then
  PG_CMD="psql postgres -d scriptedlines_db"
else
  PG_CMD="sudo -u postgres psql -d scriptedlines_db"
fi

echo "Creating drawing_templates table..."
$PG_CMD -c "
CREATE TABLE IF NOT EXISTS drawing_templates (
  id                  SERIAL PRIMARY KEY,
  project_id          INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  company_name        VARCHAR DEFAULT '',
  company_address     VARCHAR DEFAULT '',
  company_phone       VARCHAR DEFAULT '',
  company_fax         VARCHAR DEFAULT '',
  company_email       VARCHAR DEFAULT '',
  company_website     VARCHAR DEFAULT '',
  client_name         VARCHAR DEFAULT '',
  client_address      VARCHAR DEFAULT '',
  jobsite_name        VARCHAR DEFAULT '',
  jobsite_address     VARCHAR DEFAULT '',
  contractor_name     VARCHAR DEFAULT '',
  architect_name      VARCHAR DEFAULT '',
  drawn_by            VARCHAR DEFAULT '',
  checked_by          VARCHAR DEFAULT '',
  project_manager     VARCHAR DEFAULT '',
  important_notes     TEXT DEFAULT '',
  material_notes      TEXT DEFAULT '',
  finish_schedule     JSON DEFAULT '[]',
  awmac_member        BOOLEAN DEFAULT FALSE,
  awi_member          BOOLEAN DEFAULT FALSE,
  compliance_note     VARCHAR DEFAULT '',
  approval_stamp_text VARCHAR DEFAULT '',
  approval_name       VARCHAR DEFAULT '',
  approval_date       DATE,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at          TIMESTAMP WITH TIME ZONE
);
CREATE UNIQUE INDEX IF NOT EXISTS ix_drawing_templates_project_id
  ON drawing_templates(project_id);
"

echo "Adding title_block_overrides to drawings table..."
$PG_CMD -c "
ALTER TABLE drawings
  ADD COLUMN IF NOT EXISTS title_block_enabled    BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS title_block_overrides  JSON DEFAULT '{}';
"

$PG_CMD -c "
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO scriptedlines_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO scriptedlines_user;
"

echo "✔ Migration complete"
