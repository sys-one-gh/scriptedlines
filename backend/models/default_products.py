# ─────────────────────────────────────────────────────────────
# models/default_products.py
#
# Default product catalog for ScriptedLines.
# These are the standard products available to all users.
# When the database is ready, this file gets replaced with
# a database query — the structure stays identical.
#
# Each product is a dict matching the MillworkObject interface.
# Fields:
#   code          → drawing code (appears on drawings/schedules)
#   name          → display name in the left panel
#   category      → which category group it belongs to
#   svg_type      → tells geometry engine which class to use
#   default_width → pre-fills the drop form (mm)
#   default_height
#   default_depth
#   default_doors
#   default_drawers
#   default_shelves
#   description   → shown in the drop form and right panel
# ─────────────────────────────────────────────────────────────


# ─────────────────────────────────────────────────────────────
# BASE CABINETS
# Floor-mounted cabinets with toe kick.
# Standard height 870mm includes 150mm toe kick.
# ─────────────────────────────────────────────────────────────

BASE_CABINETS = [
    {
        "code":            "BC-STD",
        "name":            "Standard Base Cabinet",
        "category":        "Base Cabinets",
        "svg_type":        "base_cabinet",
        "default_width":   600,
        "default_height":  870,
        "default_depth":   580,
        "default_doors":   1,
        "default_drawers": 0,
        "default_shelves": 1,
        "description":     "Single door base cabinet with one adjustable shelf.",
    },
    {
        "code":            "BC-DRW",
        "name":            "Base Cabinet with Drawer",
        "category":        "Base Cabinets",
        "svg_type":        "base_cabinet_drawer",
        "default_width":   600,
        "default_height":  870,
        "default_depth":   580,
        "default_doors":   1,
        "default_drawers": 1,
        "default_shelves": 0,
        "description":     "Single door base cabinet with one drawer above the door.",
    },
    {
        "code":            "BC-3DRW",
        "name":            "Base Cabinet 3 Drawers",
        "category":        "Base Cabinets",
        "svg_type":        "base_cabinet_3drawer",
        "default_width":   450,
        "default_height":  870,
        "default_depth":   580,
        "default_doors":   0,
        "default_drawers": 3,
        "default_shelves": 0,
        "description":     "Three drawer base cabinet. No doors.",
    },
    {
        "code":            "BC-SNK",
        "name":            "Sink Base Cabinet",
        "category":        "Base Cabinets",
        "svg_type":        "base_cabinet_sink",
        "default_width":   762,
        "default_height":  870,
        "default_depth":   580,
        "default_doors":   2,
        "default_drawers": 0,
        "default_shelves": 0,
        "description":     "Double door sink base. No fixed shelf — open for plumbing.",
    },
    {
        "code":            "BC-DBL",
        "name":            "Double Door Base Cabinet",
        "category":        "Base Cabinets",
        "svg_type":        "base_cabinet_double",
        "default_width":   900,
        "default_height":  870,
        "default_depth":   580,
        "default_doors":   2,
        "default_drawers": 0,
        "default_shelves": 1,
        "description":     "Double door base cabinet with one adjustable shelf.",
    },
    {
        "code":            "BC-CRN",
        "name":            "Corner Base Cabinet",
        "category":        "Base Cabinets",
        "svg_type":        "base_cabinet_corner",
        "default_width":   900,
        "default_height":  870,
        "default_depth":   900,
        "default_doors":   1,
        "default_drawers": 0,
        "default_shelves": 1,
        "description":     "Corner base cabinet. Equal width and depth.",
    },
]


# ─────────────────────────────────────────────────────────────
# WALL CABINETS
# Wall-mounted cabinets. No toe kick.
# Standard depth 305mm. Mounting height set at placement.
# ─────────────────────────────────────────────────────────────

WALL_CABINETS = [
    {
        "code":            "WC-STD",
        "name":            "Standard Wall Cabinet",
        "category":        "Wall Cabinets",
        "svg_type":        "wall_cabinet",
        "default_width":   600,
        "default_height":  762,
        "default_depth":   305,
        "default_doors":   1,
        "default_drawers": 0,
        "default_shelves": 1,
        "description":     "Single door wall cabinet with one adjustable shelf.",
    },
    {
        "code":            "WC-DBL",
        "name":            "Double Door Wall Cabinet",
        "category":        "Wall Cabinets",
        "svg_type":        "wall_cabinet_double",
        "default_width":   900,
        "default_height":  762,
        "default_depth":   305,
        "default_doors":   2,
        "default_drawers": 0,
        "default_shelves": 1,
        "description":     "Double door wall cabinet with one adjustable shelf.",
    },
    {
        "code":            "WC-GLS",
        "name":            "Glass Door Wall Cabinet",
        "category":        "Wall Cabinets",
        "svg_type":        "wall_cabinet_glass",
        "default_width":   600,
        "default_height":  762,
        "default_depth":   305,
        "default_doors":   1,
        "default_drawers": 0,
        "default_shelves": 1,
        "description":     "Single glass door wall cabinet with one adjustable shelf.",
    },
]


# ─────────────────────────────────────────────────────────────
# TALL CABINETS
# Floor-to-near-ceiling cabinets.
# Standard height 2134mm. Can have oven/appliance openings.
# ─────────────────────────────────────────────────────────────

TALL_CABINETS = [
    {
        "code":            "TC-STD",
        "name":            "Standard Tall Cabinet",
        "category":        "Tall Cabinets",
        "svg_type":        "tall_cabinet",
        "default_width":   600,
        "default_height":  2134,
        "default_depth":   580,
        "default_doors":   2,
        "default_drawers": 0,
        "default_shelves": 3,
        "description":     "Two door tall cabinet with three adjustable shelves.",
    },
    {
        "code":            "TC-OVN",
        "name":            "Tall Cabinet Oven Opening",
        "category":        "Tall Cabinets",
        "svg_type":        "tall_cabinet_oven",
        "default_width":   762,
        "default_height":  2134,
        "default_depth":   580,
        "default_doors":   2,
        "default_drawers": 0,
        "default_shelves": 1,
        "description":     "Tall cabinet with oven cutout opening. "
                           "Oven dimensions confirmed on site.",
    },
    {
        "code":            "TC-PNT",
        "name":            "Tall Pantry Cabinet",
        "category":        "Tall Cabinets",
        "svg_type":        "tall_cabinet_pantry",
        "default_width":   600,
        "default_height":  2134,
        "default_depth":   580,
        "default_doors":   2,
        "default_drawers": 0,
        "default_shelves": 4,
        "description":     "Two door pantry cabinet with four adjustable shelves.",
    },
]


# ─────────────────────────────────────────────────────────────
# FULL CATALOG
# Single dict grouping all products by category.
# This is what the API endpoint returns to the React frontend.
# When database is ready — replace this with a DB query.
# The shape stays identical so React never needs to change.
# ─────────────────────────────────────────────────────────────

PRODUCT_CATALOG = {
    "base_cabinets": BASE_CABINETS,
    "wall_cabinets": WALL_CABINETS,
    "tall_cabinets": TALL_CABINETS,
}


# ─────────────────────────────────────────────────────────────
# HELPER — get product by code
# Used by the geometry engine to look up a product's defaults
# before generating SVG.
# ─────────────────────────────────────────────────────────────

def get_product_by_code(code: str) -> dict | None:
    """
    Returns the product dict for a given product code.
    Returns None if the code is not found.

    Example:
        product = get_product_by_code("BC-STD")
        # returns the Standard Base Cabinet dict
    """
    all_products = (
        BASE_CABINETS +
        WALL_CABINETS +
        TALL_CABINETS
    )

    for product in all_products:
        if product["code"] == code:
            return product

    return None


# ─────────────────────────────────────────────────────────────
# HELPER — get all products flat
# Returns every product as a flat list regardless of category.
# Used for search and validation.
# ─────────────────────────────────────────────────────────────

def get_all_products() -> list[dict]:
    """
    Returns all products as a flat list.
    Used for search across all categories.
    """
    return (
        BASE_CABINETS +
        WALL_CABINETS +
        TALL_CABINETS
    )