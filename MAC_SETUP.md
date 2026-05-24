# ScriptedLines — Mac Setup Guide

First time setup on a Mac machine. Run these steps once only.

## Important — Project Path on Mac

The repo clones to wherever you run `git clone` from.
Your current path is: `~/scriptedlines` (`/Users/sys_one/scriptedlines`)

All scripts use **relative paths** so they work regardless of where the repo lives.
Always run scripts from the **project root** (`~/scriptedlines/`).

---

## Step 1 — Install Prerequisites (if not already installed)

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

## Step 2 — Clone the Repo (if not already done)

```bash
cd ~
git clone https://github.com/sys-one-gh/scriptedlines.git
cd scriptedlines
git checkout mac
```

---

## Step 3 — Install Frontend Dependencies

```bash
cd ~/scriptedlines/frontend
npm install
cd ..
```

---

## Step 4 — Set Up Python Backend

```bash
cd ~/scriptedlines/backend
python3 -m venv m_venv
source m_venv/bin/activate
pip install -r requirements.txt
cd ..
```

---

## Step 5 — Set Up Password File

Prevents password prompts when running backup and restore scripts.

```bash
echo "localhost:5432:scriptedlines_db:scriptedlines_user:scriptedlines2024" > ~/.pgpass
chmod 600 ~/.pgpass
```

---

## Step 6 — Restore the Database from Backup

```bash
cd ~/scriptedlines
bash scripts/restore_db.sh
```

---

## Step 7 — Verify the Restore

```bash
PGPASSWORD=scriptedlines2024 psql -U scriptedlines_user -h localhost -d scriptedlines_db \
  -c "SELECT COUNT(*) FROM library_products;"
```

You should see: `81`

---

## Step 8 — Start Everything

Open 3 terminals:

### Terminal 1 — Database
```bash
brew services start postgresql@16
```

### Terminal 2 — Backend
```bash
cd ~/scriptedlines/backend
source m_venv/bin/activate
uvicorn main:app --reload --port 8000
```

### Terminal 3 — Frontend
```bash
cd ~/scriptedlines/frontend
npm run dev
```

Open browser at `http://localhost:5173`
You should see: `ScriptedLines — backend: connected ✔`

---

## Daily Startup on Mac

### Terminal 1
```bash
brew services start postgresql@16
```

### Terminal 2
```bash
cd ~/scriptedlines/backend
source m_venv/bin/activate
uvicorn main:app --reload --port 8000
```

### Terminal 3
```bash
cd ~/scriptedlines/frontend
npm run dev
```

### Pull latest code
```bash
cd ~/scriptedlines
git checkout mac
git pull origin mac
```

---

## End of Day on Mac

```bash
cd ~/scriptedlines
bash scripts/backup_db.sh
git add .
git commit -m "your message"
git push origin mac
git checkout develop && git merge mac && git push origin develop
git checkout working && git merge develop && git push origin working
git checkout mac
brew services stop postgresql@16
```

---

## Difference Between WSL and Mac

| | WSL | Mac |
|---|---|---|
| Project path | `/home/restricted_space/projects/scriptedlines` | `~/scriptedlines` |
| Start PostgreSQL | `sudo service postgresql start` | `brew services start postgresql@16` |
| Stop PostgreSQL | `sudo service postgresql stop` | `brew services stop postgresql@16` |
| Git branch | `working` | `mac` |
| Scripts | `bash scripts/backup_db.sh` | `bash scripts/backup_db.sh` |
| Everything else | same | same |

---

## Troubleshooting

### PostgreSQL not found
```bash
brew install postgresql@16
echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### pip not found
```bash
brew install python3
```

### node not found
```bash
brew install node
```

### Port 8000 already in use
```bash
pkill -f uvicorn
uvicorn main:app --reload --port 8000
```