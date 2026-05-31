# ScriptedLines

Millwork drawing SaaS — React + FastAPI + PostgreSQL, running in Docker.

## Quick Start (WSL)

```bash
cd ~/projects/scriptedlines
docker-compose up -d
```

Open: http://localhost:5173

## Quick Start (Mac — first time)

See `MAC_SETUP.md`

## Docs

| File | Purpose |
|---|---|
| `DAILY_START.md` | Start and stop the app every day |
| `MAC_SETUP.md` | First time Mac setup |
| `GIT_WORKFLOW.md` | Branches, commits, end of day |

## Stack

| Layer | Technology | Port |
|---|---|---|
| Frontend | React + Vite | 5173 |
| Backend | FastAPI + uvicorn | 8000 |
| Database | PostgreSQL 16 | 5432 |

## Project Structure

```
scriptedlines/
├── frontend/              React app
│   └── src/
│       ├── components/    CADToolbar, PaperSpace, LeftPanel
│       ├── pages/         Workspace, ProjectsPage, LoginPage
│       └── data/          paperSizes.js
├── backend/               FastAPI
│   ├── api/               Route handlers
│   ├── models/            SQLAlchemy table definitions
│   ├── geometry/          SVG generators
│   ├── database.py        PostgreSQL connection
│   └── main.py            App entry point
├── docker/
│   └── db/init.sql        DB init (runs once on first startup)
├── scripts/               Backup, restore, sync, migrate
├── data/backups/          Database backups (committed to git)
├── docker-compose.yml     Orchestrates all 3 containers
├── .env                   Secrets — NEVER commit (gitignored)
└── .env.example           Template — commit this instead
```

## Page Flow

```
/login → /projects → /workspace
```

## API

- Health: http://localhost:8000/api/health
- Docs:   http://localhost:8000/docs