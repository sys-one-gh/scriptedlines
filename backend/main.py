# ─────────────────────────────────────────────────────────────
# main.py
#
# FastAPI application entry point.
# Database is populated via restore_db.sh — not seeded here.
# Tables are created on startup if they do not exist.
# ─────────────────────────────────────────────────────────────

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.products import router as products_router
from database import engine, Base


app = FastAPI(
    title="ScriptedLines API",
    description="Millwork drawing geometry engine",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── STARTUP ─────────────────────────────────────────────────
# Creates tables if they do not exist.
# Data comes from restore_db.sh — never seeded here.
@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    print("✔ Database tables verified.")


# ─── ROUTES ──────────────────────────────────────────────────
app.include_router(products_router, prefix="/api")


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "ScriptedLines API",
        "version": "1.0.0"
    }