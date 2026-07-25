# ─────────────────────────────────────────────────────────────
# models/material_melamine.py
#
# library_melamine — decorative melamine-faced panel, one row per
# orderable variant (manufacturer x substrate x thickness x decor).
#
# Self-contained, same pattern as models/laminate.py and the rebuilt
# models/material_core.py — no shared manufacturer/finish/sheet_size
# lookup tables. Unlike cores, `manufacturer` DOES matter here (a
# decor is manufacturer-specific, same reasoning as laminates), so
# it's kept as a plain column rather than dropped.
#
# Texture lives on the row (varies per variant), NOT tied to a shared
# finish record. grain = Long / Short. g_sides = G1S / G2S.
# ─────────────────────────────────────────────────────────────

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.sql import func
from database import Base


class MaterialMelamine(Base):

    __tablename__ = "library_melamine"

    id   = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False, index=True)

    manufacturer = Column(String, nullable=False, index=True)
    finish_code  = Column(String, nullable=False)   # manufacturer decor #
    finish_name  = Column(String, nullable=False)   # e.g. "Grey Oak Woodgrain"

    core_substrate = Column(String, nullable=False)   # MDF / PB only
    thickness_mm   = Column(Float, nullable=False)

    # ── TEXTURE (per variant) ─────────────────────────────────
    texture            = Column(String, nullable=False, index=True)  # e.g. Matte / Textured Woodgrain
    is_premium_texture = Column(Boolean, default=False)
    sheen               = Column(String, default="")

    grain   = Column(String, default="Long")   # Long / Short
    g_sides = Column(String, default="G2S")    # G1S / G2S

    # ── SHEET SIZE AVAILABILITY ──────────────────────────────
    # Same boolean-flag pattern as LaminateFormica/MaterialCore — a
    # melamine SKU is commonly stocked in several sheet sizes at once.
    size_4x8  = Column(Boolean, default=False)
    size_5x8  = Column(Boolean, default=False)
    size_4x10 = Column(Boolean, default=False)
    size_4x12 = Column(Boolean, default=False)
    size_5x12 = Column(Boolean, default=False)
    size_5x10 = Column(Boolean, default=False)

    # ── COMPLIANCE (per standard) ────────────────────────────
    fr_rated = Column(Boolean, default=False)
    leed     = Column(Boolean, default=False)
    fsc      = Column(Boolean, default=False)
    carb_p2  = Column(Boolean, default=False)

    # ── FLAGS ────────────────────────────────────────────────
    is_mto = Column(Boolean, default=False)   # Made To Order

    # ── COMMERCIAL ───────────────────────────────────────────
    cost_per_sheet = Column(Float, nullable=True)
    cost_per_sqft  = Column(Float, nullable=True)
    lead_time      = Column(String, default="")

    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<MaterialMelamine {self.code} ({self.finish_name})>"
