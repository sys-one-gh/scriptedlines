# ScriptedLines — Daily Startup Guide
# Updated: Docker setup complete
# ─────────────────────────────────────────────────────────────


═══════════════════════════════════════════════════════════════
WSL DAILY STARTUP
═══════════════════════════════════════════════════════════════

Project path: /home/restricted_space/projects/scriptedlines
Git branch:   working

─── Step 1 — Pull latest code ────────────────────────────────

  cd ~/projects/scriptedlines
  git checkout working
  git pull origin working


─── Step 2 — Start all containers (one command) ──────────────

  docker-compose up -d

  You should see:
  ✔ Container scriptedlines_db        Healthy
  ✔ Container scriptedlines_backend   Started
  ✔ Container scriptedlines_frontend  Started

  First time after reboot may take 5-10 seconds for DB to be ready.


─── Step 3 — Open Browser ────────────────────────────────────

  http://localhost:5173

  Automatically redirects to /login
  Page flow: /login → /projects → /workspace


─── Step 4 — Verify backend (optional) ──────────────────────

  curl http://localhost:8000/api/health
  → {"status":"ok"}


─── Check container status anytime ──────────────────────────

  docker-compose ps
  docker-compose logs backend     ← backend errors
  docker-compose logs frontend    ← frontend errors
  docker-compose logs db          ← database errors


─── End of Day — WSL ─────────────────────────────────────────

  cd ~/projects/scriptedlines

  # Backup database
  bash scripts/backup_docker.sh

  # Commit and push
  git add .
  git commit -m "your message here"
  git push origin working
  git checkout develop && git merge working && git push origin develop
  git checkout mac && git merge develop && git push origin mac
  git checkout working

  # Stop containers
  docker-compose stop


═══════════════════════════════════════════════════════════════
MAC DAILY STARTUP
═══════════════════════════════════════════════════════════════

Project path: ~/projects/scriptedlines
Git branch:   mac

─── Step 1 — Pull latest code ────────────────────────────────

  cd ~/projects/scriptedlines
  git checkout mac
  git pull origin mac


─── Step 2 — Start all containers ───────────────────────────

  docker-compose up -d


─── Step 3 — Open Browser ────────────────────────────────────

  http://localhost:5173


─── End of Day — Mac ─────────────────────────────────────────

  cd ~/projects/scriptedlines

  # Backup database
  bash scripts/backup_docker.sh

  # Commit and push
  git add .
  git commit -m "your message here"
  git push origin mac
  git checkout develop && git merge mac && git push origin develop
  git checkout working && git merge develop && git push origin working
  git checkout mac

  # Stop containers
  docker-compose stop


═══════════════════════════════════════════════════════════════
SYNCING DATABASE BETWEEN WSL AND MAC
═══════════════════════════════════════════════════════════════

  On the source machine (e.g. WSL — after working):
    bash scripts/sync_db.sh export
    → dumps DB, commits to git, pushes

  On the target machine (e.g. Mac — before starting):
    git pull
    bash scripts/sync_db.sh import
    → restores from latest backup


═══════════════════════════════════════════════════════════════
DIFFERENCE BETWEEN WSL AND MAC
═══════════════════════════════════════════════════════════════

  Feature              WSL                          Mac
  ─────────────────────────────────────────────────────────────
  Project path         /home/restricted_space/      ~/projects/
                       projects/scriptedlines        scriptedlines
  Git branch           working                      mac
  Start app            docker-compose up -d         docker-compose up -d
  Stop app             docker-compose stop          docker-compose stop
  Everything else      identical                    identical

  No more separate PostgreSQL, venv, or npm management.
  Docker handles all of it on both machines identically.


═══════════════════════════════════════════════════════════════
CONTAINER MANAGEMENT
═══════════════════════════════════════════════════════════════

  Start all:          docker-compose up -d
  Stop all:           docker-compose stop
  Restart all:        docker-compose restart
  Rebuild after code  docker-compose up -d --build
    changes to
    Dockerfile or
    requirements.txt:

  View logs:          docker-compose logs -f backend
  Shell into backend: docker-compose exec backend bash
  Shell into DB:      docker-compose exec db psql -U scriptedlines_user -d scriptedlines_db

  ⚠️  NEVER run: docker-compose down -v
      This deletes the database volume permanently.
      Use: docker-compose down  (data is safe)
      Or:  docker-compose stop  (containers paused, data safe)


═══════════════════════════════════════════════════════════════
DATABASE REFERENCE
═══════════════════════════════════════════════════════════════

  Host (inside Docker):  db:5432
  Host (from your PC):   localhost:5432
  Database:              scriptedlines_db
  User:                  scriptedlines_user
  Password:              scriptedlines2024

  Connect via terminal:
  docker-compose exec db psql -U scriptedlines_user -d scriptedlines_db

  Useful queries:
  SELECT COUNT(*) FROM library_products;
  SELECT id, project_name FROM projects;
  SELECT id, drawing_number, status FROM drawings;


═══════════════════════════════════════════════════════════════
API ENDPOINTS REFERENCE
═══════════════════════════════════════════════════════════════

  Health check:    http://localhost:8000/api/health
  All endpoints:   http://localhost:8000/docs
  Products:        http://localhost:8000/api/products


═══════════════════════════════════════════════════════════════
TROUBLESHOOTING
═══════════════════════════════════════════════════════════════

  Backend not starting:
    docker-compose logs backend
    → usually a Python import error or DB not ready yet
    docker-compose restart backend

  Frontend not loading:
    docker-compose logs frontend
    docker-compose restart frontend

  Database connection refused:
    docker-compose ps
    → check db container is Healthy
    docker-compose restart db

  Port already in use:
    sudo lsof -i :8000
    sudo lsof -i :5173
    sudo lsof -i :5432
    → kill the process or stop old containers

  Hot reload not working (WSL):
    → vite.config.js has usePolling: true — this is required for WSL
    → if still not working: docker-compose restart frontend

  Rebuild after requirements.txt change:
    docker-compose up -d --build backend

  Nuclear option — full rebuild (data preserved):
    docker-compose down
    docker-compose up -d --build