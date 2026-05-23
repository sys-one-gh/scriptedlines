# ScriptedLines — Mac Setup Guide

First time setup on a Mac machine. Run these steps once only.

## Project Path on Mac
```
/home/projects/scriptedlines
```

---

## Step 1 — Install Prerequisites

### Install Homebrew
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Install PostgreSQL
```bash
brew install postgresql@16
brew services start postgresql@16
```

### Install Python
```bash
brew install python3
```

### Install Node.js
```bash
brew install node
```

---

## Step 2 — Clone the Repo

```bash
mkdir -p /home/projects
cd /home/projects
git clone https://github.com/sys-one-gh/scriptedlines.git
cd scriptedlines
git checkout mac
```

---

## Step 3 — Install Frontend Dependencies

```bash
cd /home/projects/scriptedlines/frontend
npm install
cd ..
```

---

## Step 4 — Set Up Python Backend

```bash
cd /home/projects/scriptedlines/backend
python3 -m venv m_venv
source m_venv/bin/activate
pip install -r requirements.txt
cd ..
```

---

## Step 5 — Create the Database

```bash
psql postgres -c "CREATE USER scriptedlines_user WITH PASSWORD 'scriptedlines2024';"
psql postgres -c "CREATE DATABASE scriptedlines_db OWNER scriptedlines_user;"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE scriptedlines_db TO scriptedlines_user;"
psql postgres -c "ALTER DATABASE scriptedlines_db OWNER TO scriptedlines_user;"
```

---

## Step 6 — Set Up Password File

This prevents password prompts when running backup and restore scripts.

```bash
echo "localhost:5432:scriptedlines_db:scriptedlines_user:scriptedlines2024" > ~/.pgpass
chmod 600 ~/.pgpass
```

---

## Step 7 — Restore the Database from Backup

```bash
pg_restore \
  -U scriptedlines_user \
  -h localhost \
  -d scriptedlines_db \
  --no-owner \
  /home/projects/scriptedlines/data/backups/scriptedlines_latest.bak
```

---

## Step 8 — Verify the Restore

```bash
psql -U scriptedlines_user -h localhost -d scriptedlines_db \
  -c "SELECT code, name, category FROM library_products ORDER BY category;"
```

You should see all 12 products listed.

---

## Step 9 — Start Everything

Follow DAILY_START.md — Mac Machine section.

```bash
# Terminal 1
brew services start postgresql@16

# Terminal 2
cd /home/projects/scriptedlines/backend
source m_venv/bin/activate
uvicorn main:app --reload --port 8000

# Terminal 3
cd /home/projects/scriptedlines/frontend
npm run dev
```

Open browser at `http://localhost:5173`
You should see: `ScriptedLines — backend: connected ✔`

---

## Done — Mac is Ready

From now on just follow:
- `DAILY_START.md` — every morning
- `GIT_WORKFLOW.md` — every evening

---

## Difference Between WSL and Mac

| | WSL | Mac |
|---|---|---|
| Project path | `/home/restricted_space/projects/scriptedlines` | `/home/projects/scriptedlines` |
| Start database | `sudo service postgresql start` | `brew services start postgresql@16` |
| Stop database | `sudo service postgresql stop` | `brew services stop postgresql@16` |
| Git branch | `working` | `mac` |
| Everything else | same | same |