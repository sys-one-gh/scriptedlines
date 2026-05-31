# ScriptedLines — Mac Setup Guide
# First time setup on Mac. Run these steps once only.

## Step 1 — Install Prerequisites
Install Docker Desktop for Mac from: https://www.docker.com/products/docker-desktop/
Install Git: brew install git

## Step 2 — Clone the Repo
mkdir -p ~/projects
cd ~/projects
git clone https://github.com/sys-one-gh/scriptedlines.git
cd scriptedlines
git checkout mac

## Step 3 — Create .env File
cp .env.example .env

## Step 4 — Build and Start
docker-compose up -d --build

## Step 5 — Restore Database
bash scripts/restore_docker.sh

## Step 6 — Open App
http://localhost:5173

## Daily Use
docker-compose up -d    ← start
docker-compose stop     ← stop

## ⚠️ NEVER run
docker-compose down -v  ← deletes database permanently
