# ─────────────────────────────────────────────────────────────
# models/material_core.py
#
# library_cores — raw / unfinished sheet substrate.
# (MDF, particleboard, plywood, MR grades, etc.)
#
# Cores are the base panel with NO decorative face, so they carry
# no finish reference. Compliance is broken out per standard.
# Referenced by BOMs via the string `code` (forward-compat rule).
#
# Deliberately has NO manufacturer field — unlike laminates (a specific
# decor is proprietary to one manufacturer), a core is a commodity spec.
# Any vendor supplying a matching spec is interchangeable, so the row
# represents a procurement requirement, not one manufacturer's product.
#
# Self-contained — no shared sheet_size lookup table, same pattern as
# models/laminate.py (see that file's header comment for why the
# shared-lookup design was abandoned).
# ─────────────────────────────────────────────────────────────

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.sql import func
from database import Base


class MaterialCore(Base):

    __tablename__ = "library_cores"

    id   = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False, index=True)

    description    = Column(String, nullable=False)
    substrate_type = Column(String, nullable=False, index=True)  # MDF / PB / Ply / MR-MDF

    # ── SHEET SIZE AVAILABILITY ──────────────────────────────
    # Same pattern as LaminateFormica — a core SKU is commonly stocked
    # in several sheet sizes at once, not just one. size_5x5 is the one
    # addition beyond the laminate set (5x5 is a ply-core-only size).
    size_4x8  = Column(Boolean, default=False)
    size_5x8  = Column(Boolean, default=False)
    size_4x10 = Column(Boolean, default=False)
    size_4x12 = Column(Boolean, default=False)
    size_5x12 = Column(Boolean, default=False)
    size_5x10 = Column(Boolean, default=False)
    size_5x5  = Column(Boolean, default=False)

    thickness_mm = Column(Float, nullable=False)
    core_color   = Column(String, default="")   # some FR cores are dyed
    # Only meaningful for plywood-family substrates (e.g. flex ply, where
    # it determines which axis the panel bends along). Blank for MDF/PB —
    # same convention as MaterialMelamine.grain.
    grain        = Column(String, default="")   # "Short" / "Long" / ""

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

    def __repr__(self):
        return f"<MaterialCore {self.code} — {self.description}>"