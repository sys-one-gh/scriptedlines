#!/bin/bash
# ─────────────────────────────────────────────────────────────
# scripts/sync_db.sh
# Syncs database between machines (WSL ↔ Mac).
#
# On the SOURCE machine (e.g. WSL):
#   bash scripts/sync_db.sh export
#   → dumps DB to data/backups/scriptedlines_latest.bak
#   → commit and push to git
#
# On the TARGET machine (e.g. Mac):
#   git pull
#   bash scripts/sync_db.sh import
#   → restores from data/backups/scriptedlines_latest.bak
# ─────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ACTION="${1:-help}"

case "$ACTION" in
  export)
    echo "Exporting database..."
    bash "$SCRIPT_DIR/backup_docker.sh"
    cd "$PROJECT_DIR"
    git add data/backups/scriptedlines_latest.bak
    git commit -m "chore: sync DB backup $(date +%Y-%m-%d)"
    git push
    echo "✔ Database exported and pushed to git"
    ;;

  import)
    echo "Importing database from latest backup..."
    bash "$SCRIPT_DIR/restore_docker.sh"
    echo "✔ Database imported"
    ;;

  *)
    echo "Usage:"
    echo "  bash scripts/sync_db.sh export   # dump DB, commit, push"
    echo "  bash scripts/sync_db.sh import   # pull latest, restore DB"
    ;;
esac
