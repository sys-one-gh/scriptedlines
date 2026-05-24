# ─────────────────────────────────────────────────────────────
# api/products.py
#
# API endpoints for the product library.
# React calls these to populate the left panel Products tab.
#
# Response structure:
#   categories
#     └── subcategories
#           └── items
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
# Returns all active products grouped by category → subcategory → items.
# React ProductsPanel fetches this on mount to populate the left panel.
# URL: GET /api/products
@router.get("/products")
def get_products(db: Session = Depends(get_db)):

    # Fetch all active products ordered by sort_order
    products = db.query(Product).filter(
        Product.is_active == True
    ).order_by(
        Product.category,
        Product.subcategory,
        Product.sort_order
    ).all()

    # ── GROUP BY CATEGORY → SUBCATEGORY → ITEMS ──────────────
    grouped = {}

    for product in products:
        category    = product.category
        subcategory = product.subcategory

        # Create category bucket if it does not exist
        if category not in grouped:
            grouped[category] = {}

        # Create subcategory bucket if it does not exist
        if subcategory not in grouped[category]:
            grouped[category][subcategory] = []

        # Append product to its subcategory
        grouped[category][subcategory].append({
            "id":              product.id,
            "code":            product.code,
            "name":            product.name,
            "category":        product.category,
            "subcategory":     product.subcategory,
            "description":     product.description,
            "svg_type":        product.svg_type,
            "default_width":   product.default_width,
            "default_height":  product.default_height,
            "default_depth":   product.default_depth,
            "default_doors":   product.default_doors,
            "default_drawers": product.default_drawers,
            "default_shelves": product.default_shelves,
        })

    # ── BUILD RESPONSE ────────────────────────────────────────
    # Shape matches exactly what ProductsPanel.jsx expects
    return {
        "status": "ok",
        "categories": [
            {
                "id":   category.lower().replace(" ", "_").replace("&", "and"),
                "name": category,
                "subcategories": [
                    {
                        "id":    subcategory.lower().replace(" ", "_").replace("&", "and"),
                        "name":  subcategory,
                        "items": items,
                    }
                    for subcategory, items in subcategories.items()
                ],
            }
            for category, subcategories in grouped.items()
        ],
    }


# ─── GET PRODUCT BY CODE ─────────────────────────────────────
# Returns a single product by its drawing code.
# Used by the geometry engine to look up defaults before generating SVG.
# URL: GET /api/products/FL-B1D
@router.get("/products/{code}")
def get_product_by_code(code: str, db: Session = Depends(get_db)):

    product = db.query(Product).filter(
        Product.code == code,
        Product.is_active == True
    ).first()

    if not product:
        return {
            "status":  "error",
            "message": f"Product '{code}' not found."
        }

    return {
        "status": "ok",
        "product": {
            "id":              product.id,
            "code":            product.code,
            "name":            product.name,
            "category":        product.category,
            "subcategory":     product.subcategory,
            "description":     product.description,
            "svg_type":        product.svg_type,
            "default_width":   product.default_width,
            "default_height":  product.default_height,
            "default_depth":   product.default_depth,
            "default_doors":   product.default_doors,
            "default_drawers": product.default_drawers,
            "default_shelves": product.default_shelves,
        },
    }