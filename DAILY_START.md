# ScriptedLines — Daily Startup Guide
# Updated: Phase 4 Complete
# ─────────────────────────────────────────────────────────────


═══════════════════════════════════════════════════════════════
WSL DAILY STARTUP
═══════════════════════════════════════════════════════════════

Project path: /home/restricted_space/projects/scriptedlines
Git branch:   working

─── Step 1 — Pull latest code ────────────────────────────────

  cd /home/restricted_space/projects/scriptedlines
  git checkout working
  git pull origin working


─── Step 2 — Start PostgreSQL ────────────────────────────────

  sudo service postgresql start


─── Step 3 — Start Backend (Terminal 2) ──────────────────────

  cd /home/restricted_space/projects/scriptedlines/backend
  source m_venv/bin/activate
  uvicorn main:app --reload --port 8000

  You should see:
  ✔ Database tables verified.
  INFO: Application startup complete.


─── Step 4 — Start Frontend (Terminal 3) ─────────────────────

  cd /home/restricted_space/projects/scriptedlines/frontend
  npm run dev

  You should see:
  VITE v5.x  ready in Xms
  ➜  Local: http://localhost:5173/


─── Step 5 — Open Browser ────────────────────────────────────

  http://localhost:5173

  Automatically redirects to /login
  Sign in with your account to access the app.

  Page flow:
  /login → /projects → /workspace


─── End of Day — WSL ─────────────────────────────────────────

  cd /home/restricted_space/projects/scriptedlines
  bash scripts/backup_db.sh
  git add .
  git commit -m "your message here"
  git push origin working
  git checkout develop && git merge working && git push origin develop
  git checkout mac && git merge develop && git push origin mac
  git checkout working
  sudo service postgresql stop


═══════════════════════════════════════════════════════════════
MAC DAILY STARTUP
═══════════════════════════════════════════════════════════════

Project path: ~/projects/scriptedlines  (/Users/sys_one/projects/scriptedlines)
Git branch:   mac

─── Step 1 — Pull latest code ────────────────────────────────

  cd ~/projects/scriptedlines
  git checkout mac
  git pull origin mac


─── Step 2 — Start PostgreSQL ────────────────────────────────

  brew services start postgresql@16


─── Step 3 — Start Backend (Terminal 2) ──────────────────────

  cd ~/projects/scriptedlines/backend
  source m_venv/bin/activate
  uvicorn main:app --reload --port 8000

  You should see:
  ✔ Database tables verified.
  INFO: Application startup complete.


─── Step 4 — Start Frontend (Terminal 3) ─────────────────────

  cd ~/projects/scriptedlines/frontend
  npm run dev

  You should see:
  VITE v5.x  ready in Xms
  ➜  Local: http://localhost:5173/


─── Step 5 — Open Browser ────────────────────────────────────

  http://localhost:5173

  Automatically redirects to /login
  Sign in with your account to access the app.

  Page flow:
  /login → /projects → /workspace


─── End of Day — Mac ─────────────────────────────────────────

  cd ~/projects/scriptedlines
  bash scripts/backup_db.sh
  git add .
  git commit -m "your message here"
  git push origin mac
  git checkout develop && git merge mac && git push origin develop
  git checkout working && git merge develop && git push origin working
  git checkout mac
  brew services stop postgresql@16


═══════════════════════════════════════════════════════════════
DIFFERENCE BETWEEN WSL AND MAC
═══════════════════════════════════════════════════════════════

  Feature              WSL                          Mac
  ─────────────────────────────────────────────────────────────
  Project path         /home/restricted_space/      ~/projects/
                       projects/scriptedlines        scriptedlines
  Git branch           working                      mac
  Start PostgreSQL     sudo service postgresql start brew services start postgresql@16
  Stop PostgreSQL      sudo service postgresql stop  brew services stop postgresql@16
  Everything else      identical                    identical


═══════════════════════════════════════════════════════════════
CURRENT PAGE FLOW
═══════════════════════════════════════════════════════════════

  /               → redirects to /login
  /login          → sign in page (3 attempts then restore password)
  /register       → create new account
  /projects       → projects list + drawings (Phase 5 — coming soon)
  /workspace      → drawing canvas


═══════════════════════════════════════════════════════════════
API ENDPOINTS REFERENCE
═══════════════════════════════════════════════════════════════

  Health check:    http://localhost:8000/api/health
  All endpoints:   http://localhost:8000/docs
  Products:        http://localhost:8000/api/products


═══════════════════════════════════════════════════════════════
DATABASE REFERENCE
═══════════════════════════════════════════════════════════════

  Host:     localhost:5432
  Database: scriptedlines_db
  User:     scriptedlines_user
  Password: scriptedlines2024

  Check product count:
  PGPASSWORD=scriptedlines2024 psql -U scriptedlines_user \
    -h localhost -d scriptedlines_db \
    -c "SELECT COUNT(*) FROM library_products;"

  Check users:
  PGPASSWORD=scriptedlines2024 psql -U scriptedlines_user \
    -h localhost -d scriptedlines_db \
    -c "SELECT id, first_name, email, role FROM users;"


═══════════════════════════════════════════════════════════════
RESTORE DATABASE ON NEW MACHINE
═══════════════════════════════════════════════════════════════

  1. Clone repo and checkout correct branch
  2. Start PostgreSQL
  3. bash scripts/restore_db.sh
  4. Start backend and frontend
  5. Open http://localhost:5173