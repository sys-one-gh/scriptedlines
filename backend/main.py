from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.products import router as products_router

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

# ─── ROUTES ──────────────────────────────────────────────────
app.include_router(products_router, prefix="/api")

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "ScriptedLines API",
        "version": "1.0.0"
    }