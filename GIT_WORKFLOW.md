# ScriptedLines — Git Workflow & End of Day Guide
# ─────────────────────────────────────────────────────────────


## Branch Structure

```
main        → production ready (future — do not touch yet)
develop     → stable merged code (source of truth)
working     → active development on WSL machine
mac         → active development on Mac machine
lastpoint   → frozen snapshot before major changes
```


## WSL Machine — End of Day

### Step 1 — Backup the database
```bash
cd ~/projects/scriptedlines
bash scripts/backup_docker.sh
```
You should see: `✔ Backup saved` and `✔ Latest backup updated`

### Step 2 — Commit and push to all branches
```bash
cd ~/projects/scriptedlines

git add .
git commit -m "describe what you did today"
git push origin working

git checkout develop && git merge working && git push origin develop
git checkout mac && git merge develop && git push origin mac
git checkout working
```

### Step 3 — Stop containers
```bash
docker-compose stop
```


## Mac Machine — End of Day

### Step 1 — Backup the database
```bash
cd ~/projects/scriptedlines
bash scripts/backup_docker.sh
```

### Step 2 — Commit and push to all branches
```bash
cd ~/projects/scriptedlines

git add .
git commit -m "describe what you did today"
git push origin mac

git checkout develop && git merge mac && git push origin develop
git checkout working && git merge develop && git push origin working
git checkout mac
```

### Step 3 — Stop containers
```bash
docker-compose stop
```


## Start of Day — Pull Latest Code

### WSL
```bash
cd ~/projects/scriptedlines
git checkout working
git pull origin working
docker-compose up -d
```

### Mac
```bash
cd ~/projects/scriptedlines
git checkout mac
git pull origin mac
docker-compose up -d
```


## Syncing Database Between Machines

### On the source machine (after working):
```bash
bash scripts/sync_db.sh export
```
Dumps DB → commits backup → pushes to git.

### On the target machine (before starting):
```bash
git pull
bash scripts/sync_db.sh import
```
Pulls latest → restores into Docker DB.


## Create a Lastpoint Snapshot

Run before starting any major new feature.

```bash
cd ~/projects/scriptedlines

git add .
git commit -m "lastpoint: before [describe what you are about to build]"
git push origin working

git push origin --delete lastpoint 2>/dev/null
git checkout -b lastpoint 2>/dev/null || git checkout lastpoint
git reset --hard working
git push origin lastpoint --force

git checkout working
```


## Branch Rules

| Branch    | Used by       | Push to   | Pull from |
|-----------|---------------|-----------|-----------|
| working   | WSL machine   | develop   | develop   |
| mac       | Mac machine   | develop   | develop   |
| develop   | both machines | —         | —         |
| lastpoint | snapshot only | never     | never     |
| main      | production    | —         | develop   |


## Quick Git Commands

```bash
git branch              # which branch you are on
git branch -a           # all branches
git status              # what changed
git log --oneline -10   # recent commits
git reset --soft HEAD~1 # undo last commit (keeps changes)
```


## If You Get a Merge Conflict

```bash
git status    # see which files conflict

# Open conflicting file — look for and fix:
# <<<<<<< HEAD        ← your changes
# =======
# >>>>>>> branch      ← incoming changes

git add .
git commit -m "resolve merge conflict"
```


## Docker Commands Reference

```bash
docker-compose up -d          # start all containers
docker-compose stop           # stop all containers (data safe)
docker-compose ps             # check container status
docker-compose logs backend   # view backend logs
docker-compose logs -f        # follow all logs live
docker-compose restart        # restart all containers
docker-compose up -d --build  # rebuild after Dockerfile changes

# ⚠️  NEVER:
docker-compose down -v        # deletes database permanently
```


## Database Commands Reference

```bash
# Connect to DB
docker-compose exec db psql -U scriptedlines_user -d scriptedlines_db

# Useful queries
SELECT id, project_name FROM projects;
SELECT id, drawing_number, status FROM drawings;
SELECT COUNT(*) FROM library_products;

# Backup
bash scripts/backup_docker.sh

# Restore
bash scripts/restore_docker.sh

# Sync between machines
bash scripts/sync_db.sh export   # on source machine
bash scripts/sync_db.sh import   # on target machine
```


*Always test before merging into develop.*
*Never push directly to main.*
*Never run docker-compose down -v.*
*See MAC_SETUP.md for first time Mac setup.*