# ─────────────────────────────────────────────────────────────
# main.py
#
# FastAPI application entry point.
# All models imported so Base.metadata registers every table.
# Tables created on startup if they do not exist.
# ─────────────────────────────────────────────────────────────

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base

# ── Import all models so Base.metadata sees every table ──────
import models

# ── API routers ───────────────────────────────────────────────
from api.products         import router as products_router
from api.companies        import router as companies_router
from api.users            import router as users_router
from api.projects         import router as projects_router
from api.drawings         import router as drawings_router
from api.drawing_products import router as drawing_products_router
from api.bom              import router as bom_router
from api.templates        import router as templates_router


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
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5176",
        "http://localhost:5177",
        "http://127.0.0.1:5177",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── STARTUP ─────────────────────────────────────────────────
@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    print("✔ Database tables verified.")


# ─── ROUTES ──────────────────────────────────────────────────
app.include_router(products_router,         prefix="/api")
app.include_router(companies_router,        prefix="/api")
app.include_router(users_router,            prefix="/api")
app.include_router(projects_router,         prefix="/api")
app.include_router(drawings_router,         prefix="/api")
app.include_router(drawing_products_router, prefix="/api")
app.include_router(bom_router,             prefix="/api")
app.include_router(templates_router,        prefix="/api")


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "ScriptedLines API",
        "version": "1.0.0"
    }