# ─────────────────────────────────────────────────────────────
# models/drawing_product.py
#
# Drawing products table — every product instance placed and
# saved on a drawing canvas. This is the user's drawing data,
# NOT the global library. One row per product drop saved.
#
# When saved, the geometry engine reads this row and calculates
# all BOM sub-table entries automatically.
#
# Material/hardware fields reference project-scoped rows (what the
# project already has via Project Setup), never the global catalog
# directly or a free-text string — see api/drawing_products.py's
# resolution helpers. The four *_material_type/_id pairs are
# polymorphic (same pattern as ProjectLayup's own faces): "layup" ->
# project_layups.id, "melamine" -> project_melamine.id. No DB-level
# FK on those two, since a single column can't reference two tables —
# validated in application code instead. Hardware and edge_banding
# are single-type, so those keep a real FK.
# ─────────────────────────────────────────────────────────────

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class DrawingProduct(Base):

    __tablename__ = "drawing_products"

    # ── PRIMARY KEY ──────────────────────────────────────────
    id = Column(Integer, primary_key=True, index=True)

    # ── FOREIGN KEYS ─────────────────────────────────────────
    drawing_id = Column(Integer, ForeignKey("drawings.id"),         nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("library_products.id"), nullable=False)

    # ── INSTANCE IDENTITY ────────────────────────────────────
    # Auto-generated per drawing. e.g. FL-B1D-01, FL-B1D-02
    instance_code = Column(String, nullable=False)

    # ── CANVAS POSITION (mm) ─────────────────────────────────
    x        = Column(Float, default=0)
    y        = Column(Float, default=0)
    rotation = Column(Integer, default=0)  # 0, 90, 180, 270

    # ── CONFIRMED DIMENSIONS (from drop form Tab 1) ───────────
    width   = Column(Float, nullable=False)
    height  = Column(Float, nullable=False)
    depth   = Column(Float, nullable=False)

    # ── CONFIGURATION (from drop form Tab 2) ─────────────────
    doors       = Column(Integer, default=0)
    drawers     = Column(Integer, default=0)
    shelves     = Column(Integer, default=0)
    hinge_side  = Column(String, default="")   # Left, Right, N/A
    door_type   = Column(String, default="")   # Full Overlay, Inset, N/A

    # ── MATERIAL (from drop form Tab 3) ──────────────────────
    # Polymorphic: material_type is "layup" or "melamine", material_id
    # points at project_layups.id or project_melamine.id accordingly.
    exterior_material_type = Column(String, nullable=True)
    exterior_material_id   = Column(Integer, nullable=True)
    interior_material_type = Column(String, nullable=True)
    interior_material_id   = Column(Integer, nullable=True)
    back_material_type     = Column(String, nullable=True)
    back_material_id       = Column(Integer, nullable=True)
    subtop_material_type   = Column(String, nullable=True)
    subtop_material_id     = Column(Integer, nullable=True)
    edge_banding_id        = Column(Integer, ForeignKey("project_edgebands.id"), nullable=True)

    # ── HARDWARE (from drop form Tab 4) ──────────────────────
    hinge_id        = Column(Integer, ForeignKey("project_hinges.id"),        nullable=True)
    drawer_slide_id = Column(Integer, ForeignKey("project_drawer_slides.id"), nullable=True)
    pull_id         = Column(Integer, ForeignKey("project_handles.id"),       nullable=True)
    shelf_pin_id    = Column(Integer, ForeignKey("project_shelf_supports.id"), nullable=True)

    # ── FINISH (from drop form Tab 5) ────────────────────────
    exterior_finish = Column(String, default="")
    interior_finish = Column(String, default="")

    # ── LABEL AND DRAWING (from drop form Tab 6) ─────────────
    label             = Column(String,  default="")
    show_label        = Column(Boolean, default=True)
    show_dimensions   = Column(Boolean, default=True)
    show_product_code = Column(Boolean, default=True)
    notes_on_drawing  = Column(String,  default="")

    # ── NOTES (from drop form Tab 8) ─────────────────────────
    internal_notes   = Column(String, default="")
    production_notes = Column(String, default="")
    client_notes     = Column(String, default="")

    # ── BOM (from drop form Tab 9) ───────────────────────────
    bom_description = Column(String,  default="")
    bom_category    = Column(String,  default="")
    include_in_bom  = Column(Boolean, default=True)
    bom_notes       = Column(String,  default="")

    # ── STATUS ───────────────────────────────────────────────
    is_active  = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)

    # ── TIMESTAMPS ───────────────────────────────────────────
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ── RELATIONSHIPS ────────────────────────────────────────
    drawing         = relationship("Drawing",        back_populates="products")
    library_product = relationship("Product")
    bom_parts       = relationship("DrawingBomPart", back_populates="drawing_product",
                                   cascade="all, delete-orphan")

    # Single-type references only — the polymorphic material_type/_id
    # pairs above have no relationship() since a plain FK can't span
    # two possible tables (see api/drawing_products.py's resolvers).
    edge_banding = relationship("ProjectEdgeband")
    hinge        = relationship("ProjectHinge")
    drawer_slide = relationship("ProjectDrawerSlide")
    pull         = relationship("ProjectHandle")
    shelf_pin    = relationship("ProjectShelfSupport")

    def __repr__(self):
        return f"<DrawingProduct {self.instance_code} on Drawing {self.drawing_id}>"
