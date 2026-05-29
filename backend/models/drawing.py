# ─────────────────────────────────────────────────────────────
# models/drawing.py
# ─────────────────────────────────────────────────────────────

import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Float, Enum, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class PaperSize(enum.Enum):
    Arch_D  = "Arch_D"
    Arch_C  = "Arch_C"
    Arch_E  = "Arch_E"
    ANSI_B  = "ANSI_B"
    ANSI_A  = "ANSI_A"
    A1      = "A1"
    A3      = "A3"


class DrawingStatus(enum.Enum):
    draft             = "draft"
    review            = "review"
    approved          = "approved"
    submittal_pending = "submittal_pending"   # committed, PDF generated, ready to send
    submitted         = "submitted"           # sent to client for review
    issued            = "issued"              # final release after client approval


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
    page_count  = Column(Integer,         default=1)

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
    revisions       = relationship("DrawingRevision",      back_populates="drawing", cascade="all, delete-orphan", order_by="DrawingRevision.revision_number")

    def __repr__(self):
        return f"<Drawing {self.id} — {self.drawing_number} {self.title}>"

class DrawingRevision(Base):
    """
    One row per revision per drawing.
    Rev 00 is auto-created when a drawing is created.
    On commit: is_locked = True, pdf_path set, status bumped.
    New revision row created automatically after commit.
    """
    __tablename__ = "drawing_revisions"

    id              = Column(Integer, primary_key=True, index=True)
    drawing_id      = Column(Integer, ForeignKey("drawings.id", ondelete="CASCADE"), nullable=False, index=True)
    revision_number = Column(String, nullable=False, default="00")
    date            = Column(Date, nullable=True)
    initials        = Column(String, nullable=True)
    description     = Column(String, nullable=True)

    # Commit fields
    is_locked       = Column(Boolean, nullable=False, default=False)
    pdf_path        = Column(String, nullable=True)    # relative path under backend/storage/
    committed_at    = Column(DateTime(timezone=True), nullable=True)
    committed_by    = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship back to drawing
    drawing         = relationship("Drawing", back_populates="revisions")