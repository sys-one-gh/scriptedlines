# ─────────────────────────────────────────────────────────────
# models/__init__.py
#
# Imports all models so SQLAlchemy's Base.metadata knows about
# every table. main.py calls Base.metadata.create_all() on
# startup which creates any missing tables automatically.
# ─────────────────────────────────────────────────────────────

from models.product         import Product

# ── Material catalog: shared lookups + per-category tables ───
from models.material_lookups  import Manufacturer, SheetSize, Finish
from models.material_core     import MaterialCore
from models.material_melamine import MaterialMelamine
from models.material_laminate import MaterialLaminate

from models.company         import Company
from models.user            import User
from models.project         import Project
from models.drawing         import Drawing
from models.drawing_product import DrawingProduct
from models.drawing_bom     import (
    DrawingBomProduct,
    DrawingBomHardware,
    DrawingBomSheetGoods,
    DrawingBomEdgeBand,
    DrawingBomPart,
)