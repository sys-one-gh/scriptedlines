# ─────────────────────────────────────────────────────────────
# models/drawing_product.py
#
# Drawing products table — every product instance placed and
# saved on a drawing canvas. This is the user's drawing data,
# NOT the global library. One row per product drop saved.
#
# When saved, the geometry engine reads this row and calculates
# all BOM sub-table entries automatically.
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
    exterior_material = Column(String, default="")
    interior_material = Column(String, default="")
    back_material     = Column(String, default="")
    subtop_material   = Column(String, default="")
    edge_banding      = Column(String, default="")

    # ── HARDWARE (from drop form Tab 4) ──────────────────────
    hinge_code        = Column(String, default="")
    drawer_slide_code = Column(String, default="")
    pull_code         = Column(String, default="")
    shelf_pin_code    = Column(String, default="")

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

    def __repr__(self):
        return f"<DrawingProduct {self.instance_code} on Drawing {self.drawing_id}>"
