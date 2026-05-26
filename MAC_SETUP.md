# ScriptedLines — Mac Setup Guide

First time setup on a Mac machine. Run these steps once only.

## Project Paths

```
WSL:  /home/restricted_space/projects/scriptedlines
Mac:  ~/projects/scriptedlines  (/Users/sys_one/projects/scriptedlines)
```

Mac does not allow creating directories under /home — this is an OS restriction.
The Mac path uses the home directory (~) instead.
All scripts use relative paths so they work correctly on both machines.

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

Add PostgreSQL to PATH if not found after install:
```bash
echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
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

## Step 2 — Create Project Directory

```bash
mkdir -p ~/projects
```

---

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

---

## Step 4 — Install Frontend Dependencies

```bash
cd ~/projects/scriptedlines/frontend
npm install
cd ..
```

---

## Step 5 — Set Up Python Backend

```bash
cd ~/projects/scriptedlines/backend
python3 -m venv m_venv
source m_venv/bin/activate
pip install -r requirements.txt
cd ..
```

---

## Step 6 — Restore the Database

Make sure PostgreSQL is running first:
```bash
brew services start postgresql@16
```

Then restore:
```bash
cd ~/projects/scriptedlines
bash scripts/restore_db.sh
```

You should see:
```
✔ Database restored successfully
  Products in library: 81
```

---

## Step 7 — Verify Everything Works

```bash
PGPASSWORD=scriptedlines2024 psql -U scriptedlines_user -h localhost -d scriptedlines_db \
  -c "SELECT COUNT(*) FROM library_products;"
```

Should return: `81`

---

## Step 8 — Start All Three Servers

### Terminal 1 — Database
```bash
brew services start postgresql@16
```

### Terminal 2 — Backend
```bash
cd ~/projects/scriptedlines/backend
source m_venv/bin/activate
uvicorn main:app --reload --port 8000
```

You should see:
```
✔ Database tables verified.
INFO: Application startup complete.
```

### Terminal 3 — Frontend
```bash
cd ~/projects/scriptedlines/frontend
npm run dev
```

Open browser: `http://localhost:5173`
Automatically redirects to /login — sign in with your account.

Page flow:
```
/login → /projects → /workspace
```

---

## Daily Startup on Mac

Follow `DAILY_START.md` — Mac section.

---

## End of Day on Mac

```bash
cd ~/projects/scriptedlines
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
| Project path | `/home/restricted_space/projects/scriptedlines` | `~/projects/scriptedlines` |
| Start PostgreSQL | `sudo service postgresql start` | `brew services start postgresql@16` |
| Stop PostgreSQL | `sudo service postgresql stop` | `brew services stop postgresql@16` |
| Git branch | `working` | `mac` |
| Everything else | identical | identical |

---

## Troubleshooting

### PostgreSQL not found after install
```bash
echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Cannot create /home directory on Mac
This is expected — Mac restricts /home. Use ~/projects instead.
The scripts use relative paths so this does not matter.

### Port 8000 already in use
```bash
pkill -f uvicorn
uvicorn main:app --reload --port 8000
```

### pip install fails
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### node not found
```bash
brew install node
```