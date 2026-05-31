# ScriptedLines — Git Workflow

## Branches
main → production (do not touch)
develop → source of truth
working → WSL development
mac → Mac development
lastpoint → snapshot before major changes

## WSL End of Day
cd ~/projects/scriptedlines
bash scripts/backup_docker.sh
git add .
git commit -m "your message"
git push origin working
git checkout develop && git merge working && git push origin develop
git checkout mac && git merge develop && git push origin mac
git checkout working
docker-compose stop

## Mac End of Day
cd ~/projects/scriptedlines
bash scripts/backup_docker.sh
git add .
git commit -m "your message"
git push origin mac
git checkout develop && git merge mac && git push origin develop
git checkout working && git merge develop && git push origin working
git checkout mac
docker-compose stop

## Sync DB Between Machines
bash scripts/sync_db.sh export   ← on source machine
bash scripts/sync_db.sh import   ← on target machine

## Docker Reference
docker-compose up -d          ← start
docker-compose stop           ← stop (data safe)
docker-compose ps             ← status
docker-compose logs backend   ← backend logs
docker-compose up -d --build  ← rebuild after Dockerfile changes

## ⚠️ NEVER run
docker-compose down -v        ← deletes database permanently
