# ScriptedLines — Git Workflow & End of Day Guide

## Branch Structure

```
main        → production ready (future — do not touch yet)
develop     → stable merged code (source of truth)
working     → active development on WSL machine
mac         → active development on Mac machine
lastpoint   → frozen snapshot before major changes
```

---

## WSL Machine — End of Day

### Step 1 — Backup the database
```bash
bash /home/restricted_space/projects/scriptedlines/scripts/backup_db.sh
```
You should see: `✔ Backup complete`

### Step 2 — Commit and push to all branches
```bash
cd /home/restricted_space/projects/scriptedlines

git add .
git commit -m "describe what you did today"

git push origin working

git checkout develop
git merge working
git push origin develop

git checkout mac
git merge develop
git push origin mac

git checkout working
```

### Step 3 — Stop the servers
```bash
# Stop frontend → Ctrl+C in terminal 3
# Stop backend  → Ctrl+C in terminal 2
sudo service postgresql stop
```

---

## Mac Machine — End of Day

### Step 1 — Backup the database
```bash
bash /home/projects/scriptedlines/scripts/backup_db.sh
```

### Step 2 — Commit and push to all branches
```bash
cd /home/projects/scriptedlines

git add .
git commit -m "describe what you did today"

git push origin mac

git checkout develop
git merge mac
git push origin develop

git checkout working
git merge develop
git push origin working

git checkout mac
```

### Step 3 — Stop the servers
```bash
# Stop frontend → Ctrl+C in terminal 3
# Stop backend  → Ctrl+C in terminal 2
brew services stop postgresql@16
```

---

## Start of Day — Pull Latest Code

### WSL
```bash
cd /home/restricted_space/projects/scriptedlines
git checkout working
git pull origin working
git merge develop
```

### Mac
```bash
cd /home/projects/scriptedlines
git checkout mac
git pull origin mac
git merge develop
```

---

## Create a Lastpoint Snapshot

Run before starting any major new feature.

```bash
# WSL
cd /home/restricted_space/projects/scriptedlines

git add .
git commit -m "lastpoint: before [describe what you are about to build]"
git push origin working

git push origin --delete lastpoint 2>/dev/null
git checkout -b lastpoint 2>/dev/null || git checkout lastpoint
git reset --hard working
git push origin lastpoint --force

git checkout working
```

---

## Branch Rules

| Branch    | Used by       | Push to   | Pull from |
|-----------|---------------|-----------|-----------|
| working   | WSL machine   | develop   | develop   |
| mac       | Mac machine   | develop   | develop   |
| develop   | both machines | —         | —         |
| lastpoint | snapshot only | never     | never     |
| main      | production    | —         | develop   |

---

## Quick Git Commands

```bash
# Check which branch you are on
git branch

# See all branches
git branch -a

# Check what changed
git status

# See recent commits
git log --oneline -10

# Undo last commit (keeps your changes)
git reset --soft HEAD~1
```

---

## If You Get a Merge Conflict

```bash
# See which files conflict
git status

# Open conflicting file — look for and fix:
# <<<<<<< HEAD        ← your changes
# =======
# >>>>>>> branch      ← incoming changes

# After fixing
git add .
git commit -m "resolve merge conflict"
```

---

*Always test before merging into develop.*
*Never push directly to main.*
*See MAC_SETUP.md for first time Mac setup.*