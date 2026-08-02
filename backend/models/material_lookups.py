# ─────────────────────────────────────────────────────────────
# models/material_lookups.py
#
# Shared lookup tables referenced by the material category tables
# (cores, melamine, laminate, and future categories).
#
#   manufacturers → who makes the material
#   sheet_sizes   → nominal label + actual mm dimensions (shared)
#   finishes      → the DECORATIVE IDENTITY only (name + number).
#                   Texture, grade, thickness, size are NOT here —
#                   they belong to the specific orderable variant
#                   row in library_laminate / library_melamine,
#                   because one finish (e.g. Formica "Aged Ash 8844")
#                   comes in many grade/texture/thickness/size combos.
#
# Factual, manufacturer-sourced reference data — grown over time
# via scraping / curated entry, not user-editable ad hoc.
# ─────────────────────────────────────────────────────────────

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Manufacturer(Base):

    __tablename__ = "manufacturers"

    id      = Column(Integer, primary_key=True, index=True)
    name    = Column(String, unique=True, nullable=False, index=True)
    website = Column(String, default="")
    notes   = Column(String, default="")

    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ── RELATIONSHIPS ────────────────────────────────────────
    finishes = relationship("Finish", back_populates="manufacturer")

    def __repr__(self):
        return f"<Manufacturer {self.name}>"


class SheetSize(Base):

    __tablename__ = "sheet_sizes"

    id            = Column(Integer, primary_key=True, index=True)
    # nominal_label → human label as ordered, e.g. "48x96"
    nominal_label = Column(String, nullable=False, index=True)
    # actual dimensions in millimeters (the real, cut-list size)
    actual_length_mm = Column(Float, nullable=False)
    actual_width_mm  = Column(Float, nullable=False)
    notes = Column(String, default="")

    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<SheetSize {self.nominal_label} ({self.actual_length_mm}x{self.actual_width_mm}mm)>"


class Finish(Base):
    """
    The decorative identity of a material — what it LOOKS like.
    e.g. Formica "Aged Ash" #8844, Wilsonart "Cloudspun" TS512.

    Deliberately holds NO physical form (no texture / grade /
    thickness / size). Those vary per orderable variant and live
    on the library_laminate / library_melamine rows that
    reference this finish.
    """

    __tablename__ = "finishes"

    id              = Column(Integer, primary_key=True, index=True)
    manufacturer_id = Column(Integer, ForeignKey("manufacturers.id"), nullable=False, index=True)

    finish_name   = Column(String, nullable=False, index=True)   # "Aged Ash"
    finish_number = Column(String, nullable=False, index=True)   # manufacturer decor #, "8844" / "TS512"

    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ── RELATIONSHIPS ────────────────────────────────────────
    manufacturer = relationship("Manufacturer", back_populates="finishes")

    def __repr__(self):
        return f"<Finish {self.finish_name} #{self.finish_number}>"