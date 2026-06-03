#!/bin/bash
# ============================================================
# ScriptedLines — Pre-Phase 6 Cleanup Script
# Run from project root: bash cleanup.sh
# ============================================================

set -e
echo "═══════════════════════════════════════════════════"
echo "  ScriptedLines — Project Cleanup"
echo "═══════════════════════════════════════════════════"
echo ""

# ── 1. Update .gitignore ──────────────────────────────────
echo "► Step 1: Updating .gitignore..."

# Append entries if they don't already exist
add_gitignore() {
  if ! grep -qxF "$1" .gitignore 2>/dev/null; then
    echo "$1" >> .gitignore
    echo "  Added: $1"
  else
    echo "  Already present: $1"
  fi
}

add_gitignore "backend/m_venv/"
add_gitignore "data/backups/"
add_gitignore "*.bak"

echo ""

# ── 2. Remove m_venv and backups from git tracking ───────
echo "► Step 2: Removing tracked files from git (keeping local copies)..."

if git ls-files --error-unmatch backend/m_venv/ &>/dev/null; then
  git rm -r --cached backend/m_venv/
  echo "  Removed backend/m_venv/ from git tracking"
else
  echo "  backend/m_venv/ not tracked — skipping"
fi

if git ls-files --error-unmatch data/backups/ &>/dev/null; then
  git rm -r --cached data/backups/
  echo "  Removed data/backups/ from git tracking"
else
  echo "  data/backups/ not tracked — skipping"
fi

echo ""

# ── 3. Delete Vite boilerplate leftovers ─────────────────
echo "► Step 3: Removing Vite boilerplate files..."

for f in frontend/src/assets/react.svg frontend/src/assets/vite.svg; do
  if [ -f "$f" ]; then
    rm "$f"
    git rm --cached "$f" 2>/dev/null || true
    echo "  Deleted: $f"
  else
    echo "  Not found: $f — skipping"
  fi
done

echo ""

# ── 4. Archive completed migration scripts ───────────────
echo "► Step 4: Archiving completed migration scripts..."

mkdir -p scripts/archive

ARCHIVE_SCRIPTS=(
  "migrate_page_count.sh"
  "migrate_paper_sizes.sh"
  "migrate_revisions.sh"
  "migrate_storage.sh"
  "migrate_templates.sh"
)

for s in "${ARCHIVE_SCRIPTS[@]}"; do
  if [ -f "scripts/$s" ]; then
    mv "scripts/$s" "scripts/archive/$s"
    echo "  Archived: $s"
  else
    echo "  Not found: $s — skipping"
  fi
done

echo ""

# ── 5. Remove empty placeholder dirs ─────────────────────
echo "► Step 5: Cleaning empty directories..."

for d in shared docs; do
  if [ -d "$d" ] && [ -z "$(ls -A "$d")" ]; then
    rmdir "$d"
    echo "  Removed empty dir: $d/"
  else
    echo "  $d/ has content or doesn't exist — skipping"
  fi
done

echo ""

# ── 6. Organize components into subfolders ────────────────
echo "► Step 6: Organizing components into subfolders..."

mkdir -p frontend/src/components/workspace
mkdir -p frontend/src/components/projects

WORKSPACE_COMPONENTS=(
  "CADToolbar.jsx"
  "HardwarePanel.jsx"
  "LeftPanel.jsx"
  "MaterialsPanel.jsx"
  "PaperSpace.jsx"
  "PartsPanel.jsx"
  "ProductsPanel.jsx"
  "SubassembliesPanel.jsx"
  "ToolButton.jsx"
  "WallsPanel.jsx"
)

for c in "${WORKSPACE_COMPONENTS[@]}"; do
  if [ -f "frontend/src/components/$c" ]; then
    mv "frontend/src/components/$c" "frontend/src/components/workspace/$c"
    echo "  Moved to workspace/: $c"
  fi
done

echo ""

# ── 7. Summary ────────────────────────────────────────────
echo "═══════════════════════════════════════════════════"
echo "  Cleanup complete!"
echo ""
echo "  MANUAL STEPS REMAINING:"
echo "  1. Copy the cleaned ProjectsPage.jsx over your current one"
echo "  2. Copy the cleaned ProjectsPage.css over your current one"
echo "  3. Update Workspace.jsx imports:"
echo "     Change: import X from '../components/X'"
echo "     To:     import X from '../components/workspace/X'"
echo "  4. Run: docker-compose up -d"
echo "  5. Test that everything loads correctly"
echo "  6. Commit: git add -A && git commit -m 'cleanup: pre-phase-6 project restructure'"
echo "═══════════════════════════════════════════════════"
