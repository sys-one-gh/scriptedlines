# ─────────────────────────────────────────────────────────────
# database.py
#
# Database connection setup for ScriptedLines.
# Reads DATABASE_URL from environment variable so it works
# both locally (direct postgres) and in Docker.
#
# Local dev without Docker:
#   DATABASE_URL = postgresql://scriptedlines_user:scriptedlines2024@localhost:5432/scriptedlines_db
#
# Docker dev:
#   DATABASE_URL = postgresql://scriptedlines_user:scriptedlines2024@db:5432/scriptedlines_db
#   (host = "db" = docker-compose service name)
# ─────────────────────────────────────────────────────────────

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# ─── CONNECTION URL ──────────────────────────────────────────
# Reads from environment variable set by Docker or .env file.
# Falls back to local dev URL if not set — so existing
# non-Docker workflow still works without any changes.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://scriptedlines_user:scriptedlines2024@localhost:5432/scriptedlines_db"
)

# ─── ENGINE ──────────────────────────────────────────────────
# echo=True in development, False in production
echo_sql = os.getenv("ENV", "development") == "development"
engine = create_engine(DATABASE_URL, echo=echo_sql)

# ─── SESSION ─────────────────────────────────────────────────
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ─── BASE ────────────────────────────────────────────────────
Base = declarative_base()

# ─── DEPENDENCY ──────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
