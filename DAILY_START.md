# ScriptedLines — Daily Startup Guide

## Project Path
```
WSL Machine  → /home/restricted_space/projects/scriptedlines
Mac Machine  → /home/projects/scriptedlines
```

---

## WSL Machine — Start of Day

Open 3 terminals in this exact order.

### Terminal 1 — Start the Database
```bash
sudo service postgresql start
```
Verify:
```bash
sudo service postgresql status
```
You should see: `online`

### Terminal 2 — Start the Python Backend
```bash
cd /home/restricted_space/projects/scriptedlines/backend
source m_venv/bin/activate
uvicorn main:app --reload --port 8000
```
Verify — open browser:
```
http://localhost:8000/api/health
```
You should see: `{"status":"ok"}`

### Terminal 3 — Start the React Frontend
```bash
cd /home/restricted_space/projects/scriptedlines/frontend
npm run dev
```
Verify — open browser:
```
http://localhost:5173
```
You should see: `ScriptedLines — backend: connected ✔`

### Pull Latest Code
```bash
cd /home/restricted_space/projects/scriptedlines
git checkout working
git pull origin working
```

---

## Mac Machine — Start of Day

Open 3 terminals in this exact order.

### Terminal 1 — Start the Database
```bash
brew services start postgresql@16
```
Verify:
```bash
brew services list | grep postgresql
```
You should see: `started`

### Terminal 2 — Start the Python Backend
```bash
cd /home/projects/scriptedlines/backend
source m_venv/bin/activate
uvicorn main:app --reload --port 8000
```
Verify — open browser:
```
http://localhost:8000/api/health
```
You should see: `{"status":"ok"}`

### Terminal 3 — Start the React Frontend
```bash
cd /home/projects/scriptedlines/frontend
npm run dev
```
Verify — open browser:
```
http://localhost:5173
```
You should see: `ScriptedLines — backend: connected ✔`

### Pull Latest Code
```bash
cd /home/projects/scriptedlines
git checkout mac
git pull origin mac
```

---

## Quick Reference

| | WSL | Mac |
|---|---|---|
| Project path | `/home/restricted_space/projects/scriptedlines` | `/home/projects/scriptedlines` |
| Start database | `sudo service postgresql start` | `brew services start postgresql@16` |
| Stop database | `sudo service postgresql stop` | `brew services stop postgresql@16` |
| Activate venv | `source m_venv/bin/activate` | `source m_venv/bin/activate` |
| Start backend | `uvicorn main:app --reload --port 8000` | same |
| Start frontend | `npm run dev` | same |
| Working branch | `working` | `mac` |

---

## If Something Goes Wrong

### Backend port already in use
```bash
pkill -f uvicorn
uvicorn main:app --reload --port 8000
```

### Database not connecting — WSL
```bash
sudo service postgresql restart
```

### Database not connecting — Mac
```bash
brew services restart postgresql@16
```

### Frontend not loading
```bash
# WSL
cd /home/restricted_space/projects/scriptedlines/frontend
npm install && npm run dev

# Mac
cd /home/projects/scriptedlines/frontend
npm install && npm run dev
```

### Check ports in use
```bash
lsof -i :5173
lsof -i :8000
```

### Connect to database directly
```bash
psql -U scriptedlines_user -h localhost -d scriptedlines_db
```

---

## Useful Database Queries
```sql
SELECT code, name, category FROM library_products ORDER BY category;
SELECT COUNT(*) FROM library_products;
\q
```

---

*See GIT_WORKFLOW.md for end of day and git instructions.*
*See MAC_SETUP.md for first time Mac setup instructions.*