# ─────────────────────────────────────────────────────────────
# models/drawing_bom.py
#
# BOM sub-tables — all five in one file since they are always
# used together. All tables are keyed directly to drawings.id.
#
# These tables are OUTPUTS of the geometry engine.
# They are calculated automatically when a product is saved
# to a drawing. Never entered manually by the user.
#
# Tables:
#   DrawingBomProduct    — cabinet/product instances
#   DrawingBomHardware   — hardware takeoff
#   DrawingBomSheetGoods — sheet goods usage
#   DrawingBomEdgeBand   — edgeband usage
#   DrawingBomPart       — individual cut parts list
# ─────────────────────────────────────────────────────────────

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


# ─────────────────────────────────────────────────────────────
# DrawingBomProduct
# Every cabinet/product instance in the drawing takeoff.
# One row per instance_code (e.g. FL-B1D-01, FL-B1D-02).
# ─────────────────────────────────────────────────────────────
class DrawingBomProduct(Base):

    __tablename__ = "drawing_bom_products"

    id         = Column(Integer, primary_key=True, index=True)
    drawing_id = Column(Integer, ForeignKey("drawings.id"), nullable=False, index=True)

    instance_code  = Column(String, nullable=False)  # e.g. FL-B1D-01
    product_code   = Column(String, nullable=False)  # e.g. FL-B1D
    product_name   = Column(String, nullable=False)  # e.g. Base 1 Door Frameless
    quantity       = Column(Integer, default=1)
    width          = Column(Float,   nullable=False)
    height         = Column(Float,   nullable=False)
    depth          = Column(Float,   nullable=False)
    doors          = Column(Integer, default=0)
    drawers        = Column(Integer, default=0)
    shelves        = Column(Integer, default=0)
    exterior_finish = Column(String, default="")
    interior_finish = Column(String, default="")
    notes          = Column(String,  default="")
    sort_order     = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    drawing = relationship("Drawing", back_populates="bom_products")

    def __repr__(self):
        return f"<BomProduct {self.instance_code} — Drawing {self.drawing_id}>"


# ─────────────────────────────────────────────────────────────
# DrawingBomHardware
# All hardware items required for the drawing.
# Aggregated across all products on the drawing.
# e.g. H3: 42 Blum hinges total
# ─────────────────────────────────────────────────────────────
class DrawingBomHardware(Base):

    __tablename__ = "drawing_bom_hardware"

    id         = Column(Integer, primary_key=True, index=True)
    drawing_id = Column(Integer, ForeignKey("drawings.id"), nullable=False, index=True)

    code        = Column(String,  nullable=False)  # e.g. H3
    description = Column(String,  nullable=False)  # e.g. Blum 71B3580 Hinge
    quantity    = Column(Integer, default=0)
    unit        = Column(String,  default="each")  # each, pair, set, metres
    notes       = Column(String,  default="")
    sort_order  = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    drawing = relationship("Drawing", back_populates="bom_hardware")

    def __repr__(self):
        return f"<BomHardware {self.code} x{self.quantity} — Drawing {self.drawing_id}>"


# ─────────────────────────────────────────────────────────────
# DrawingBomSheetGoods
# All sheet goods consumed by the drawing.
# Geometry engine calculates how many sheets of each material.
# e.g. 12 sheets of 4x8 19mm Phenolic PLAM-01
# ─────────────────────────────────────────────────────────────
class DrawingBomSheetGoods(Base):

    __tablename__ = "drawing_bom_sheetgoods"

    id         = Column(Integer, primary_key=True, index=True)
    drawing_id = Column(Integer, ForeignKey("drawings.id"), nullable=False, index=True)

    material_code    = Column(String, nullable=False)  # e.g. PLAM-01
    description      = Column(String, nullable=False)  # e.g. Formica #8844-58 FSC Aged Ash
    thickness_mm     = Column(Float,  nullable=False)  # e.g. 19
    sheet_size       = Column(String, default="4x8")   # 4x8, 4x9, 4x10
    quantity_sheets  = Column(Float,  default=0)       # can be decimal e.g. 2.5
    core_type        = Column(String, default="")      # Particle Board, MDF, Plywood
    notes            = Column(String, default="")
    sort_order       = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    drawing = relationship("Drawing", back_populates="bom_sheetgoods")

    def __repr__(self):
        return f"<BomSheetGoods {self.material_code} x{self.quantity_sheets} sheets — Drawing {self.drawing_id}>"


# ─────────────────────────────────────────────────────────────
# DrawingBomEdgeBand
# All edgeband consumed by the drawing.
# Geometry engine calculates total linear length per type.
# e.g. EB-01: 14,500mm of 3mm PVC Aged Ash
# ─────────────────────────────────────────────────────────────
class DrawingBomEdgeBand(Base):

    __tablename__ = "drawing_bom_edgeband"

    id         = Column(Integer, primary_key=True, index=True)
    drawing_id = Column(Integer, ForeignKey("drawings.id"), nullable=False, index=True)

    code             = Column(String, nullable=False)  # e.g. EB-01
    description      = Column(String, nullable=False)  # e.g. 3mm PVC to match PLAM-01
    thickness_mm     = Column(Float,  nullable=False)  # e.g. 3
    total_length_mm  = Column(Float,  default=0)       # total linear mm required
    colour           = Column(String, default="")      # e.g. Aged Ash
    notes            = Column(String, default="")
    sort_order       = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    drawing = relationship("Drawing", back_populates="bom_edgeband")

    def __repr__(self):
        return f"<BomEdgeBand {self.code} {self.total_length_mm}mm — Drawing {self.drawing_id}>"


# ─────────────────────────────────────────────────────────────
# DrawingBomPart
# Individual cut parts for every product on the drawing.
# One row per unique part per product instance.
# Geometry engine generates this from each DrawingProduct.
# e.g. FL-B1D-01: Left Gable, 19mm PLAM-01, 580 x 720, qty 1
# ─────────────────────────────────────────────────────────────
class DrawingBomPart(Base):

    __tablename__ = "drawing_bom_parts"

    id                = Column(Integer, primary_key=True, index=True)
    drawing_id        = Column(Integer, ForeignKey("drawings.id"),         nullable=False, index=True)
    drawing_product_id = Column(Integer, ForeignKey("drawing_products.id"), nullable=False, index=True)

    part_number     = Column(String,  nullable=False)  # e.g. 001, 002
    description     = Column(String,  nullable=False)  # e.g. Left Gable
    material_code   = Column(String,  nullable=False)  # e.g. PLAM-01
    thickness_mm    = Column(Float,   nullable=False)  # e.g. 19
    width_mm        = Column(Float,   nullable=False)  # finished width
    length_mm       = Column(Float,   nullable=False)  # finished length
    quantity        = Column(Integer, default=1)
    grain_direction = Column(String,  default="none")  # lengthwise, crosswise, none
    notes           = Column(String,  default="")
    sort_order      = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    drawing         = relationship("Drawing",        back_populates="bom_parts")
    drawing_product = relationship("DrawingProduct", back_populates="bom_parts")

    def __repr__(self):
        return f"<BomPart {self.part_number} {self.description} — Product {self.drawing_product_id}>"
