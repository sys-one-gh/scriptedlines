# ─────────────────────────────────────────────────────────────
# parts/registry.py
#
# Single public entry point for the part-template engine:
#   generate_parts(product, drawing_product) -> list[PartSpec]
#
# Dispatches on product.category. Confirmed against the live catalog
# (81 products) that these 4 categories are exhaustive today:
#   Framed Cabinetry / Frameless Cabinetry -> carcass + fronts
#   Countertop / Fixtures and Extruded Products -> single part
# construction_type comes straight off category ("Framed Cabinetry"
# / "Frameless Cabinetry") and doors/drawers straight off the
# product's own default_doors/default_drawers — no svg_type string
# parsing anywhere. See cabinets.py/simple.py for the actual formulas.
# ─────────────────────────────────────────────────────────────

from models.product import Product
from models.drawing_product import DrawingProduct
from parts.types import PartSpec
from parts.cabinets import generate_cabinet_parts
from parts.simple import generate_simple_part

_CABINETRY_CONSTRUCTION = {
    "Framed Cabinetry":    "framed",
    "Frameless Cabinetry": "frameless",
}


def generate_parts(product: Product, dp: DrawingProduct) -> list[PartSpec]:
    construction_type = _CABINETRY_CONSTRUCTION.get(product.category)

    if construction_type:
        return generate_cabinet_parts(
            dp.width, dp.height, dp.depth,
            product.default_doors, product.default_drawers,
            construction_type,
        )

    if product.category in ("Countertop", "Fixtures and Extruded Products"):
        return generate_simple_part(dp.width, dp.height, dp.depth, product.name)

    raise ValueError(
        f"No part-template generator registered for category '{product.category}' "
        f"(product {product.code}) — add a branch in parts/registry.py."
    )
