#!/bin/bash
# ─────────────────────────────────────────────────────────────
# scripts/migrate_docker.sh
# Runs a SQL migration against the Docker container DB.
# Replaces the direct sudo -u postgres psql approach.
#
# Usage:
#   bash scripts/migrate_docker.sh scripts/migrate_revisions.sh
#   bash scripts/migrate_docker.sh scripts/migrate_templates.sh
#
# Or run SQL directly:
#   bash scripts/migrate_docker.sh "ALTER TABLE drawings ADD COLUMN..."
# ─────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

if [ -z "$1" ]; then
  echo "Usage: bash scripts/migrate_docker.sh <script.sh or SQL string>"
  exit 1
fi

# If argument is a file, run it
if [ -f "$1" ]; then
  echo "Running migration: $1"
  # Extract just the SQL from the script and pipe to psql
  docker-compose -f "$PROJECT_DIR/docker-compose.yml" exec -T db \
    psql -U scriptedlines_user -d scriptedlines_db < "$1"
else
  # Treat as raw SQL
  echo "Running SQL: $1"
  docker-compose -f "$PROJECT_DIR/docker-compose.yml" exec -T db \
    psql -U scriptedlines_user -d scriptedlines_db -c "$1"
fi

echo "✔ Migration complete"
