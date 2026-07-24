#!/bin/bash
# ─────────────────────────────────────────────────────────────
# scripts/sync_db.sh
#
# Historically this synced the database between machines (WSL ↔ Mac)
# by dumping it and committing the dump to git. That's no longer
# needed: DATABASE_URL now points both machines at the same shared
# Supabase instance (see .env), so there is nothing to sync — you're
# already looking at the same database.
#
# This script is kept only as a thin wrapper around local backup /
# restore for disaster-recovery purposes. It deliberately does NOT
# commit or push the dump — data/backups/*.bak is gitignored because
# the dump contains the full schema, including users.password_hash,
# and any real data in the tables.
# ─────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ACTION="${1:-help}"

case "$ACTION" in
  export)
    echo "Both machines already point at the shared Supabase DB — there is nothing to sync."
    echo "Taking a local backup only (not committed to git):"
    bash "$SCRIPT_DIR/backup_docker.sh"
    ;;

  import)
    echo "Both machines already point at the shared Supabase DB — there is nothing to import."
    echo "If you specifically want to restore from a local backup file, use:"
    echo "  bash scripts/restore_docker.sh <path-to-.bak>"
    ;;

  *)
    echo "Usage:"
    echo "  bash scripts/sync_db.sh export   # take a local-only backup (not committed to git)"
    echo "  bash scripts/sync_db.sh import   # explains why this is no longer needed"
    ;;
esac
