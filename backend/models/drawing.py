# ─────────────────────────────────────────────────────────────
# models/drawing.py
#
# Drawings table — one row per drawing sheet.
# Belongs to a project. Stores canvas state as JSON.
# BOM is linked directly via drawing_id on all bom sub-tables.
# When created: geometry engine auto-calculates BOM.
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

    # ── PRIMARY KEY ──────────────────────────────────────────
    id = Column(Integer, primary_key=True, index=True)

    # ── FOREIGN KEYS ─────────────────────────────────────────
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey("users.id"),    nullable=False)

    # ── DRAWING IDENTITY (user assigned) ─────────────────────
    drawing_number   = Column(String, nullable=False)   # e.g. D95.01
    title            = Column(String, nullable=False)   # e.g. Staff Lunch Counter
    revision         = Column(String, default="00")
    level            = Column(String, default="")       # e.g. 1G
    location         = Column(String, default="")       # e.g. 4.4.01
    arch_ref         = Column(String, default="")       # e.g. 7 A2.46B / REV#11
    item_description = Column(String, default="")       # ITEM field in title block

    # ── PAPER SETTINGS ───────────────────────────────────────
    scale       = Column(String,            default="1:20")
    paper_size  = Column(Enum(PaperSize),   default=PaperSize.Arch_D)
    page_number = Column(Integer,           default=1)
    total_pages = Column(Integer,           default=1)

    # ── CANVAS DATA ──────────────────────────────────────────
    # Full canvas state stored as JSON.
    # Includes all placed objects, walls, dimensions, annotations.
    svg_data = Column(JSON, nullable=True)

    # ── STATUS ───────────────────────────────────────────────
    status             = Column(Enum(DrawingStatus), default=DrawingStatus.draft)
    for_client_review  = Column(Boolean, default=False)
    for_production     = Column(Boolean, default=False)
    qty                = Column(Integer, default=1)

    # ── BOM TRACKING ─────────────────────────────────────────
    # Timestamp of last BOM calculation by geometry engine.
    # Null means BOM has never been generated.
    bom_generated_at = Column(DateTime(timezone=True), nullable=True)

    # ── TIMESTAMPS ───────────────────────────────────────────
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ── RELATIONSHIPS ────────────────────────────────────────
    project         = relationship("Project", back_populates="drawings")
    created_by_user = relationship("User",    back_populates="drawings")

    products        = relationship("DrawingProduct",       back_populates="drawing",
                                   cascade="all, delete-orphan")
    bom_products    = relationship("DrawingBomProduct",    back_populates="drawing",
                                   cascade="all, delete-orphan")
    bom_hardware    = relationship("DrawingBomHardware",   back_populates="drawing",
                                   cascade="all, delete-orphan")
    bom_sheetgoods  = relationship("DrawingBomSheetGoods", back_populates="drawing",
                                   cascade="all, delete-orphan")
    bom_edgeband    = relationship("DrawingBomEdgeBand",   back_populates="drawing",
                                   cascade="all, delete-orphan")
    bom_parts       = relationship("DrawingBomPart",       back_populates="drawing",
                                   cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Drawing {self.id} — {self.drawing_number} {self.title}>"
