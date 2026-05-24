from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.products import router as products_router
from database import engine, SessionLocal, Base
from models.product import Product
from models.default_products import ALL_PRODUCTS

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

# ─── AUTO SETUP ON STARTUP ───────────────────────────────────
# Runs every time the server starts.
# Creates tables if they do not exist.
# Seeds products if the table is empty.
# Never drops or overwrites existing data.
@app.on_event("startup")
def startup():
    # Create tables if they do not exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Only seed if table is empty
        count = db.query(Product).count()
        if count == 0:
            print("No products found — seeding default catalog...")
            for product_data in ALL_PRODUCTS:
                product = Product(
                    category        = product_data["category"],
                    subcategory     = product_data["subcategory"],
                    name            = product_data["name"],
                    code            = product_data["code"],
                    description     = product_data["description"],
                    svg_type        = product_data["svg_type"],
                    default_width   = product_data["default_width"],
                    default_height  = product_data["default_height"],
                    default_depth   = product_data["default_depth"],
                    default_doors   = product_data["default_doors"],
                    default_drawers = product_data["default_drawers"],
                    default_shelves = product_data["default_shelves"],
                    sort_order      = product_data["sort_order"],
                    is_active       = True,
                )
                db.add(product)
            db.commit()
            print(f"✔ {len(ALL_PRODUCTS)} products seeded.")
        else:
            print(f"✔ Database ready — {count} products loaded.")
    finally:
        db.close()


# ─── ROUTES ──────────────────────────────────────────────────
app.include_router(products_router, prefix="/api")


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "ScriptedLines API",
        "version": "1.0.0"
    }