# ScriptedLines — Daily Startup Guide

## Every time you start working, open 3 terminals in this exact order.

---

## Terminal 1 — Start the Database

> Run from any directory

```bash
sudo service postgresql start
```

Verify it is running:
```bash
sudo service postgresql status
```

You should see: `online`

---

## Terminal 2 — Start the Python Backend

```bash
cd /home/restricted_space/projects/scriptedlines/backend
source m_venv/bin/activate
uvicorn main:app --reload --port 8000
```

Verify it is running — open browser and go to:
```
http://localhost:8000/api/health
```

You should see: `{"status":"ok"}`

---

## Terminal 3 — Start the React Frontend

```bash
cd /home/restricted_space/projects/scriptedlines/frontend
npm run dev
```

Verify it is running — open browser and go to:
```
http://localhost:5173
```

You should see the ScriptedLines workspace with `backend: connected ✔` in the top bar.

---

## End of Day — Shut Everything Down

```bash
# Terminal 3 — stop frontend
Ctrl + C

# Terminal 2 — stop backend
Ctrl + C

# Terminal 1 — stop database
sudo service postgresql stop
```

---

## Quick Reference

| Service    | Start Command                                      | Directory          | URL                              |
|------------|----------------------------------------------------|--------------------|----------------------------------|
| Database   | `sudo service postgresql start`                    | anywhere           | —                                |
| Backend    | `source m_venv/bin/activate` then `uvicorn main:app --reload --port 8000` | `/backend`  | http://localhost:8000/api/health |
| Frontend   | `npm run dev`                                      | `/frontend`        | http://localhost:5173            |

---

## If Something Goes Wrong

### Backend port already in use
```bash
pkill -f uvicorn
uvicorn main:app --reload --port 8000
```

### Database not connecting
```bash
sudo service postgresql restart
```

### Frontend not loading
```bash
cd /home/restricted_space/projects/scriptedlines/frontend
npm install
npm run dev
```

### Check all running ports
```bash
lsof -i :5173
lsof -i :8000
```

---

## Project Structure

```
scriptedlines/
├── frontend/          React app — port 5173
│   └── src/
│       ├── components/
│       ├── pages/
│       └── data/
├── backend/           Python FastAPI — port 8000
│   ├── m_venv/        virtual environment
│   ├── models/        database table definitions
│   ├── api/           API route handlers
│   ├── geometry/      SVG generators
│   ├── database.py    PostgreSQL connection
│   ├── main.py        FastAPI server entry point
│   └── seed.py        creates and populates tables
└── DAILY_START.md     this file
```

---

## Database Access

### View data in VS Code
- Open PostgreSQL extension in left sidebar
- Expand ScriptedLines Local → Databases → scriptedlines_db → Schemas → public → Tables

### Connect via terminal
```bash
sudo -u postgres psql -d scriptedlines_db
```

### Useful SQL commands
```sql
-- See all products
SELECT code, name, category FROM library_products ORDER BY category;

-- Count products
SELECT COUNT(*) FROM library_products;

-- Exit
\q
```

---

## Git Workflow

### Save your work
```bash
cd /home/restricted_space/projects/scriptedlines
git add .
git commit -m "your message here"
git push origin mac
```

### Check current status
```bash
git status
```

### See commit history
```bash
git log --oneline
```

---

*Last updated: Phase 1 complete — workspace UI + FastAPI backend + PostgreSQL products table*