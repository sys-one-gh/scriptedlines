# ─────────────────────────────────────────────────────────────
# seed.py
#
# Creates all database tables and seeds them with
# default product data.
# Run once: python seed.py
# Safe to run again — skips existing products.
# ─────────────────────────────────────────────────────────────

from database import engine, SessionLocal, Base
from models.product import Product
from models.default_products import PRODUCT_CATALOG


def create_tables():
    # Creates all tables defined in models
    # If tables already exist — skips them safely
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")


def seed_products():
    db = SessionLocal()

    try:
        # Count existing products
        existing = db.query(Product).count()

        if existing > 0:
            print(f"Products already seeded ({existing} products found). Skipping.")
            return

        print("Seeding products...")

        # Loop through all categories in the catalog
        for category_key, products in PRODUCT_CATALOG.items():
            for product_data in products:
                product = Product(
                    code            = product_data["code"],
                    name            = product_data["name"],
                    category        = product_data["category"],
                    svg_type        = product_data["svg_type"],
                    default_width   = product_data["default_width"],
                    default_height  = product_data["default_height"],
                    default_depth   = product_data["default_depth"],
                    default_doors   = product_data["default_doors"],
                    default_drawers = product_data["default_drawers"],
                    default_shelves = product_data["default_shelves"],
                    description     = product_data["description"],
                    is_active       = True,
                )
                db.add(product)

        db.commit()
        print(f"Products seeded successfully.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding products: {e}")
        raise

    finally:
        db.close()


if __name__ == "__main__":
    create_tables()
    seed_products()
    print("Database setup complete.")