# ScriptedLines — Mac Setup Guide

First time setup on a Mac machine. Run these steps once only.

## Project Path — Same on Both Machines

```
WSL:  /home/restricted_space/projects/scriptedlines
Mac:  /home/restricted_space/projects/scriptedlines
```

Keeping the same path on both machines means:
- All scripts work identically on both
- No path differences in any documentation
- No confusion when switching between machines

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

## Step 2 — Create the Project Directory

```bash
sudo mkdir -p /home/restricted_space/projects
sudo chown $(whoami) /home/restricted_space
sudo chown $(whoami) /home/restricted_space/projects
```

---

## Step 3 — Move Existing Repo (if already cloned elsewhere)

If you already cloned to `~/scriptedlines`:
```bash
mv ~/scriptedlines /home/restricted_space/projects/scriptedlines
```

If you have not cloned yet:
```bash
cd /home/restricted_space/projects
git clone https://github.com/sys-one-gh/scriptedlines.git
cd scriptedlines
git checkout mac
```

Verify:
```bash
ls /home/restricted_space/projects/scriptedlines
```

---

## Step 4 — Install Frontend Dependencies

```bash
cd /home/restricted_space/projects/scriptedlines/frontend
npm install
cd ..
```

---

## Step 5 — Set Up Python Backend

```bash
cd /home/restricted_space/projects/scriptedlines/backend
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
cd /home/restricted_space/projects/scriptedlines
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
cd /home/restricted_space/projects/scriptedlines/backend
source m_venv/bin/activate
uvicorn main:app --reload --port 8000
```

### Terminal 3 — Frontend
```bash
cd /home/restricted_space/projects/scriptedlines/frontend
npm run dev
```

Open browser: `http://localhost:5173`
You should see: `ScriptedLines — backend: connected ✔`
Products tab should show all categories and products.

---

## Daily Startup on Mac

Follow `DAILY_START.md` — Mac section.

The only difference from WSL:

| | WSL | Mac |
|---|---|---|
| Start PostgreSQL | `sudo service postgresql start` | `brew services start postgresql@16` |
| Stop PostgreSQL | `sudo service postgresql stop` | `brew services stop postgresql@16` |
| Git branch | `working` | `mac` |
| Everything else | identical | identical |

---

## End of Day on Mac

```bash
cd /home/restricted_space/projects/scriptedlines
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

## Troubleshooting

### PostgreSQL not found after install
```bash
echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Permission denied creating /home/restricted_space
```bash
sudo mkdir -p /home/restricted_space/projects
sudo chown $(whoami) /home/restricted_space
sudo chown $(whoami) /home/restricted_space/projects
```

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