# ─────────────────────────────────────────────────────────────
# database.py
#
# Database connection setup for ScriptedLines.
# SQLAlchemy connects Python to PostgreSQL.
#
# Connection string format:
# postgresql://user:password@host:port/database_name
# ─────────────────────────────────────────────────────────────

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# ─── CONNECTION URL ──────────────────────────────────────────
# Local development — points to your local PostgreSQL
# When deploying to cloud, change this to your cloud URL
# This will later come from an environment variable (.env file)
DATABASE_URL = "postgresql://scriptedlines_user:scriptedlines2024@localhost:5432/scriptedlines_db"

# ─── ENGINE ──────────────────────────────────────────────────
# The engine is the connection to the database.
# echo=True prints all SQL queries to the terminal — useful for debugging.
# Set echo=False in production.
engine = create_engine(DATABASE_URL, echo=True)

# ─── SESSION ─────────────────────────────────────────────────
# Each request gets its own session — a temporary workspace
# for reading and writing to the database.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ─── BASE ────────────────────────────────────────────────────
# All database table models inherit from this Base class.
# SQLAlchemy uses it to know which classes are database tables.
Base = declarative_base()


# ─── DEPENDENCY ──────────────────────────────────────────────
# Used by FastAPI endpoints to get a database session.
# Automatically closes the session when the request is done.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()