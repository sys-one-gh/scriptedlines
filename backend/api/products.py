# ─────────────────────────────────────────────────────────────
# api/products.py
#
# API endpoints for the product library.
# React calls these to populate the left panel tabs.
# ─────────────────────────────────────────────────────────────

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.product import Product

router = APIRouter()


# ─── GET ALL PRODUCTS ────────────────────────────────────────
# Returns all active products grouped by category.
# This is what the React left panel fetches on load.
# URL: GET /api/products
@router.get("/products")
def get_products(db: Session = Depends(get_db)):

    # Fetch all active products from database
    products = db.query(Product).filter(Product.is_active == True).all()

    # Group by category — matches the shape React expects
    grouped = {}
    for product in products:
        category = product.category
        if category not in grouped:
            grouped[category] = []
        grouped[category].append({
            "id":              product.id,
            "code":            product.code,
            "name":            product.name,
            "category":        product.category,
            "svg_type":        product.svg_type,
            "default_width":   product.default_width,
            "default_height":  product.default_height,
            "default_depth":   product.default_depth,
            "default_doors":   product.default_doors,
            "default_drawers": product.default_drawers,
            "default_shelves": product.default_shelves,
            "description":     product.description,
        })

    return {
        "status":     "ok",
        "categories": [
            {
                "id":    category.lower().replace(" ", "_"),
                "name":  category,
                "items": items
            }
            for category, items in grouped.items()
        ]
    }


# ─── GET PRODUCT BY CODE ─────────────────────────────────────
# Returns a single product by its drawing code.
# Used by the geometry engine to look up defaults.
# URL: GET /api/products/BC-STD
@router.get("/products/{code}")
def get_product_by_code(code: str, db: Session = Depends(get_db)):

    product = db.query(Product).filter(
        Product.code == code,
        Product.is_active == True
    ).first()

    if not product:
        return {"status": "error", "message": f"Product {code} not found"}

    return {
        "status": "ok",
        "product": {
            "id":              product.id,
            "code":            product.code,
            "name":            product.name,
            "category":        product.category,
            "svg_type":        product.svg_type,
            "default_width":   product.default_width,
            "default_height":  product.default_height,
            "default_depth":   product.default_depth,
            "default_doors":   product.default_doors,
            "default_drawers": product.default_drawers,
            "default_shelves": product.default_shelves,
            "description":     product.description,
        }
    }