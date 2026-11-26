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

# ── Laminate catalog: self-contained, per-manufacturer children ──
from models.laminate import Laminate, LaminateFormica

# ── Hardware catalog ──────────────────────────────────────────
from models.library_hinges         import LibraryHinge
from models.library_drawer_slides  import LibraryDrawerSlide
from models.library_handles        import LibraryHandle
from models.library_shelf_supports import LibraryShelfSupport

# ── Project-scoped material/hardware selections ───────────────
# DrawingProduct's relationships reference these by name, so they
# must be registered even when no router has imported them (e.g.
# standalone scripts) or mapper configuration fails.
from models.project_core          import ProjectCore
from models.project_melamine      import ProjectMelamine
from models.project_layup         import ProjectLayup
from models.project_edgeband      import ProjectEdgeband
from models.project_hinge         import ProjectHinge
from models.project_drawer_slide  import ProjectDrawerSlide
from models.project_handle        import ProjectHandle
from models.project_shelf_support import ProjectShelfSupport

from models.company         import Company
from models.user            import User
from models.project         import Project
from models.project_laminate import ProjectLaminate
from models.drawing         import Drawing
from models.drawing_product import DrawingProduct
from models.drawing_bom     import (
    DrawingBomProduct,
    DrawingBomHardware,
    DrawingBomSheetGoods,
    DrawingBomEdgeBand,
    DrawingBomPart,
)