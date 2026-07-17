# ─────────────────────────────────────────────────────────────
# models/material_core.py
#
# library_cores — raw / unfinished sheet substrate.
# (MDF, particleboard, plywood, MR grades, etc.)
#
# Cores are the base panel with NO decorative face, so they carry
# no finish reference. Compliance is broken out per standard.
# Referenced by BOMs via the string `code` (forward-compat rule);
# related to manufacturer + sheet_size via FK internally.
# ─────────────────────────────────────────────────────────────

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class MaterialCore(Base):

    __tablename__ = "library_cores"

    id   = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False, index=True)

    description    = Column(String, nullable=False)
    substrate_type = Column(String, nullable=False, index=True)  # MDF / PB / Ply / MR-MDF

    manufacturer_id = Column(Integer, ForeignKey("manufacturers.id"), nullable=False, index=True)
    sheet_size_id   = Column(Integer, ForeignKey("sheet_sizes.id"),   nullable=False, index=True)

    thickness_mm = Column(Float, nullable=False)
    core_color   = Column(String, default="")   # some FR cores are dyed

    # ── COMPLIANCE (per standard) ────────────────────────────
    fr_rated       = Column(Boolean, default=False)
    leed           = Column(Boolean, default=False)
    fsc            = Column(Boolean, default=False)
    exterior_grade = Column(Boolean, default=False)
    carb_p2        = Column(Boolean, default=False)

    # ── COMMERCIAL ───────────────────────────────────────────
    cost_per_sheet = Column(Float, nullable=True)
    cost_per_sqft  = Column(Float, nullable=True)
    lead_time      = Column(String, default="")   # e.g. "In stock", "2-3 weeks"

    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ── RELATIONSHIPS ────────────────────────────────────────
    manufacturer = relationship("Manufacturer")
    sheet_size   = relationship("SheetSize")

    def __repr__(self):
        return f"<MaterialCore {self.code} — {self.description}>"