# ScriptedLines — Mac Setup Guide
# First time setup on Mac. Run these steps once only.
# ─────────────────────────────────────────────────────────────


## Project Paths

  WSL:  /home/restricted_space/projects/scriptedlines
  Mac:  ~/projects/scriptedlines


## Step 1 — Install Prerequisites

### Install Homebrew
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Install Docker Desktop for Mac
Download from: https://www.docker.com/products/docker-desktop/

After install:
- Open Docker Desktop
- Wait for the whale icon in the menu bar to be steady (not animating)
- That means Docker is running

### Install Git (if not already installed)
```bash
brew install git
```


## Step 2 — Create Project Directory

```bash
mkdir -p ~/projects
```


## Step 3 — Clone the Repo

```bash
cd ~/projects
git clone https://github.com/sys-one-gh/scriptedlines.git
cd scriptedlines
git checkout mac
```

Verify:
```bash
ls ~/projects/scriptedlines
```


## Step 4 — Create Your .env File

```bash
cp ~/projects/scriptedlines/.env.example ~/projects/scriptedlines/.env
```

The `.env.example` already has the correct dev credentials — no changes needed for local dev.


## Step 5 — Build and Start Docker Containers

```bash
cd ~/projects/scriptedlines
docker-compose up -d --build
```

First time takes 3-5 minutes — downloads PostgreSQL, Python, and Node images.

You should see:
```
✔ Container scriptedlines_db        Healthy
✔ Container scriptedlines_backend   Started
✔ Container scriptedlines_frontend  Started
```


## Step 6 — Restore the Database

```bash
# Pull latest backup from git (already in data/backups/)
bash scripts/restore_docker.sh
```

You should see: `✔ Database restored successfully`

Verify:
```bash
docker-compose exec db psql -U scriptedlines_user -d scriptedlines_db \
  -c "SELECT COUNT(*) FROM library_products;"
```
Should return: `81`


## Step 7 — Open the App

```
http://localhost:5173
```

Automatically redirects to /login.
Page flow: /login → /projects → /workspace


## Step 8 — Verify Backend

```bash
curl http://localhost:8000/api/health
```
Should return: `{"status":"ok"}`


## Daily Use After Setup

See `DAILY_START.md` — Mac section. It's just two commands:

```bash
docker-compose up -d    ← start
docker-compose stop     ← stop
```


## Difference Between WSL and Mac

| | WSL | Mac |
|---|---|---|
| Project path | `/home/restricted_space/projects/scriptedlines` | `~/projects/scriptedlines` |
| Git branch | `working` | `mac` |
| Start app | `docker-compose up -d` | `docker-compose up -d` |
| Stop app | `docker-compose stop` | `docker-compose stop` |
| Everything else | identical | identical |

Docker removes all platform differences — same commands, same behaviour.


## Troubleshooting

### Docker Desktop not running
→ Open Docker Desktop app, wait for whale icon to be steady

### Port already in use
```bash
lsof -i :5173
lsof -i :8000
lsof -i :5432
```
Kill the process using the port, then retry.

### Containers not starting
```bash
docker-compose logs backend
docker-compose logs db
```

### Database empty after restore
```bash
git pull                          # make sure you have latest backup
bash scripts/restore_docker.sh   # restore again
```

### Full rebuild
```bash
docker-compose down
docker-compose up -d --build
```
Data is safe — `down` without `-v` never deletes the database volume.

### ⚠️ NEVER run
```bash
docker-compose down -v    # this deletes the database permanently
```