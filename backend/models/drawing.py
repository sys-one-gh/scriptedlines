# ─────────────────────────────────────────────────────────────
# models/drawing.py
# ─────────────────────────────────────────────────────────────

import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Enum, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class PaperSize(enum.Enum):
    Arch_D  = "Arch_D"
    Arch_E  = "Arch_E"
    Letter  = "Letter"
    Tabloid = "Tabloid"


class DrawingStatus(enum.Enum):
    draft    = "draft"
    review   = "review"
    approved = "approved"
    issued   = "issued"


class Drawing(Base):

    __tablename__ = "drawings"

    id         = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey("users.id"),    nullable=False)

    # ── Drawing identity ─────────────────────────────────────
    # drawing_number format: D + 4 digits e.g. D9501
    # Page numbers represented as D9501.01, D9501.02 etc.
    drawing_number   = Column(String, nullable=False)
    mw_number        = Column(String, default="")   # Millwork scope number
    title            = Column(String, nullable=False)
    revision         = Column(String, default="00")
    level            = Column(String, default="")
    location         = Column(String, default="")
    arch_ref         = Column(String, default="")
    item_description = Column(String, default="")

    # ── Paper settings ───────────────────────────────────────
    scale       = Column(String,          default="1:20")
    paper_size  = Column(Enum(PaperSize), default=PaperSize.Arch_D)
    page_number = Column(Integer,         default=1)
    total_pages = Column(Integer,         default=1)

    # ── Canvas ───────────────────────────────────────────────
    svg_data = Column(JSON, nullable=True)

    # ── Status ───────────────────────────────────────────────
    status            = Column(Enum(DrawingStatus), default=DrawingStatus.draft)
    for_client_review = Column(Boolean, default=False)
    for_production    = Column(Boolean, default=False)
    qty               = Column(Integer, default=1)
    bom_generated_at  = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ── Relationships ────────────────────────────────────────
    project         = relationship("Project", back_populates="drawings")
    created_by_user = relationship("User",    back_populates="drawings")
    products        = relationship("DrawingProduct",       back_populates="drawing", cascade="all, delete-orphan")
    bom_products    = relationship("DrawingBomProduct",    back_populates="drawing", cascade="all, delete-orphan")
    bom_hardware    = relationship("DrawingBomHardware",   back_populates="drawing", cascade="all, delete-orphan")
    bom_sheetgoods  = relationship("DrawingBomSheetGoods", back_populates="drawing", cascade="all, delete-orphan")
    bom_edgeband    = relationship("DrawingBomEdgeBand",   back_populates="drawing", cascade="all, delete-orphan")
    bom_parts       = relationship("DrawingBomPart",       back_populates="drawing", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Drawing {self.id} — {self.drawing_number} {self.title}>"