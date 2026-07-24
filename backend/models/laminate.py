# ─────────────────────────────────────────────────────────────
# models/laminate.py
#
# laminates — master catalog of laminate finishes across every
# manufacturer. One row per decor (finish code + name + brand).
# No shared sheet_size/finish lookup tables — this table and its
# per-manufacturer children are self-contained.
#
# laminate_formica — Formica's full catalog detail, one row per
# (finish x texture x grade) orderable combination, FK'd back to
# laminates.id. Future manufacturers get their own sibling table
# (laminate_wilsonart, laminate_nevamar, ...) following the same
# pattern rather than sharing columns with laminate_formica.
# ─────────────────────────────────────────────────────────────

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Laminate(Base):

    __tablename__ = "laminates"

    id = Column(Integer, primary_key=True, index=True)

    finish_code = Column(String, nullable=False, index=True)   # manufacturer decor #, e.g. "8844"
    finish_name = Column(String, nullable=False, index=True)   # "Aged Ash"
    manufacturer = Column(String, nullable=False, index=True)  # "Formica"

    collection    = Column(String, default="")   # "180fx", "Woodgrains", "Solid Colors"...
    variant       = Column(String, default="")   # "Cross Grain", "Marble", "Wood"...
    sku_code      = Column(String, default="")
    grain         = Column(Boolean, default=False)
    product_type  = Column(String, default="Laminate")
    region        = Column(String, default="NA")
    availability_notes = Column(String, default="")

    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ── RELATIONSHIPS ────────────────────────────────────────
    formica_options = relationship("LaminateFormica", back_populates="laminate", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Laminate {self.finish_code} {self.finish_name} ({self.manufacturer})>"


class LaminateFormica(Base):
    """
    Formica's catalog detail — one row per orderable variant:
    finish x texture x grade, with the thickness/size/description
    data that varies per variant rather than per finish.
    """

    __tablename__ = "laminate_formica"

    id          = Column(Integer, primary_key=True, index=True)
    laminate_id = Column(Integer, ForeignKey("laminates.id"), nullable=False, index=True)

    texture_code    = Column(String, default="")
    texture_name    = Column(String, default="")
    texture_premium = Column(Boolean, default=False)

    grade_code = Column(String, default="")

    thickness_in = Column(Float, nullable=True)
    thickness_mm = Column(Float, nullable=True)

    # ── SHEET SIZE AVAILABILITY ──────────────────────────────
    size_4x8  = Column(Boolean, default=False)
    size_5x8  = Column(Boolean, default=False)
    size_4x10 = Column(Boolean, default=False)
    size_4x12 = Column(Boolean, default=False)
    size_5x12 = Column(Boolean, default=False)
    size_5x10 = Column(Boolean, default=False)

    texture_description = Column(String, default="")
    grade_description    = Column(String, default="")
    notes                 = Column(String, default="")

    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ── RELATIONSHIPS ────────────────────────────────────────
    laminate = relationship("Laminate", back_populates="formica_options")

    def __repr__(self):
        return f"<LaminateFormica laminate={self.laminate_id} {self.texture_name} G{self.grade_code}>"
