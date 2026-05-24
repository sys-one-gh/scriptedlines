# ─────────────────────────────────────────────────────────────
# seed.py
#
# Drops the old library_products table and recreates it
# with the new structure, then seeds all products.
# Safe to run again — always drops and recreates.
#
# Usage:
#   python seed.py
# ─────────────────────────────────────────────────────────────

from database import engine, SessionLocal, Base
from models.product import Product
from models.default_products import ALL_PRODUCTS


def reset_and_seed():
    print("Dropping existing tables...")
    Base.metadata.drop_all(bind=engine)
    print("Tables dropped.")

    print("Creating new tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created.")

    db = SessionLocal()

    try:
        print(f"Seeding {len(ALL_PRODUCTS)} products...")

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
        print(f"✔ {len(ALL_PRODUCTS)} products seeded successfully.")

    except Exception as e:
        db.rollback()
        print(f"✗ Error seeding products: {e}")
        raise

    finally:
        db.close()


if __name__ == "__main__":
    reset_and_seed()
    print("Database setup complete.")