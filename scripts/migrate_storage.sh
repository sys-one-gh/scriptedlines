#!/bin/bash
# ─────────────────────────────────────────────────────────────
# migrate_storage.sh
#
# Creates the backend/storage directory structure.
# All committed PDFs are stored here under:
#   backend/storage/{project_number}/{level}/{drawing_number}/
#
# The storage folder is gitignored.
# backup_db.sh should be extended to also backup this folder.
#
# Usage: bash scripts/migrate_storage.sh
# ─────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
STORAGE_DIR="$PROJECT_ROOT/backend/storage"

mkdir -p "$STORAGE_DIR"

# Add .gitkeep so the folder is tracked but contents are ignored
touch "$STORAGE_DIR/.gitkeep"

# Add storage to .gitignore if not already there
GITIGNORE="$PROJECT_ROOT/.gitignore"
if ! grep -q "backend/storage/" "$GITIGNORE" 2>/dev/null; then
  echo "backend/storage/" >> "$GITIGNORE"
  echo "!backend/storage/.gitkeep" >> "$GITIGNORE"
  echo "✔ Added backend/storage/ to .gitignore"
fi

echo "✔ Storage directory ready at: $STORAGE_DIR"
