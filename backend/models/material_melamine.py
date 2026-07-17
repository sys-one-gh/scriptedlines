# ─────────────────────────────────────────────────────────────
# models/material_melamine.py
#
# library_melamine — ONE ROW PER ORDERABLE VARIANT (same model
# as laminate): a decorative finish fanned out across
# texture × thickness × core substrate × sheet size.
#
#   finish_id     → decorative identity (name + number); the
#                   manufacturer is reached via finish.manufacturer.
#   sheet_size_id → the ONE size for this row.
#
# Texture lives on the row (varies per variant), NOT on finish.
# grain = Long / Short. g_sides = G1S / G2S.
# ─────────────────────────────────────────────────────────────

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class MaterialMelamine(Base):

    __tablename__ = "library_melamine"

    id   = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False, index=True)

    finish_id     = Column(Integer, ForeignKey("finishes.id"),    nullable=False, index=True)
    sheet_size_id = Column(Integer, ForeignKey("sheet_sizes.id"), nullable=False, index=True)

    core_substrate = Column(String, nullable=False)   # MDF / PB only
    thickness_mm   = Column(Float, nullable=False)

    # ── TEXTURE (per variant — NOT on the finish) ────────────
    texture            = Column(String, nullable=False, index=True)  # e.g. Matte / Suede / Gloss
    is_premium_texture = Column(Boolean, default=False)
    sheen              = Column(String, default="")

    grain   = Column(String, default="Long")   # Long / Short
    g_sides = Column(String, default="G2S")    # G1S / G2S

    # ── COMPLIANCE (per standard) ────────────────────────────
    fr_rated = Column(Boolean, default=False)
    leed     = Column(Boolean, default=False)
    fsc      = Column(Boolean, default=False)
    carb_p2  = Column(Boolean, default=False)

    # ── FLAGS ────────────────────────────────────────────────
    is_mto = Column(Boolean, default=False)

    # ── COMMERCIAL ───────────────────────────────────────────
    cost_per_sheet = Column(Float, nullable=True)
    cost_per_sqft  = Column(Float, nullable=True)
    lead_time      = Column(String, default="")

    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ── RELATIONSHIPS ────────────────────────────────────────
    # manufacturer reached via: melamine.finish.manufacturer
    finish     = relationship("Finish")
    sheet_size = relationship("SheetSize")

    def __repr__(self):
        return f"<MaterialMelamine {self.code} ({self.texture})>"