# ─────────────────────────────────────────────────────────────
# models/material_laminate.py
#
# library_laminate — ONE ROW PER ORDERABLE VARIANT.
#
# A single decorative finish (e.g. Formica "Aged Ash 8844") fans
# out into a matrix of orderable products:
#     finish × grade × texture × thickness × sheet size
# Each cell of that matrix is one row here — a single thing you
# can literally order, with its own code, cost, lead time, and
# make-to-order flag. So one finish may produce dozens of rows.
#
# Relationships:
#   finish_id     → the decorative identity (name + number).
#                   Manufacturer is reached THROUGH the finish
#                   (finish.manufacturer), not stored again here,
#                   so the two can never drift apart.
#   sheet_size_id → the ONE size for this specific row (a
#                   different size = a different row).
#
# NOTE: `additional_features` is a free comma-separated string.
# The schema does not validate factual correctness of features —
# that is an ingestion-pipeline concern added later.
# ─────────────────────────────────────────────────────────────

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class MaterialLaminate(Base):

    __tablename__ = "library_laminate"

    id   = Column(Integer, primary_key=True, index=True)
    # code → unique per variant, e.g. "FOR-8844-G12-MAT-4896"
    code = Column(String, unique=True, nullable=False, index=True)

    # type → laminate family: HPL / TFL / Compact / TRACELESS / ...
    type = Column(String, nullable=False, index=True)

    finish_id     = Column(Integer, ForeignKey("finishes.id"),    nullable=False, index=True)
    sheet_size_id = Column(Integer, ForeignKey("sheet_sizes.id"), nullable=False, index=True)

    # ── GRADE (manufacturer grade code + its description) ─────
    grade             = Column(String, nullable=False, index=True)  # "12", "H1", "50", "FK"
    grade_description = Column(String, default="")                  # "Horizontal Postforming Grade (HGP)…"
    application       = Column(String, default="")                  # Horizontal / Vertical / Postforming

    thickness_mm = Column(Float, nullable=False)

    # ── TEXTURE (per variant — NOT a property of the finish) ──
    texture            = Column(String, nullable=False, index=True)  # Matte / Gloss / Woodbrush / "42"
    is_premium_texture = Column(Boolean, default=False)              # the "*" premium flag
    sheen              = Column(String, default="")                  # optional extra descriptor
    grain              = Column(String, default="Long")              # Long / Short

    # ── PHYSICAL / CONSTRUCTION ──────────────────────────────
    core_type  = Column(String, default="")     # e.g. "black core", "fiberglass core" (HardStop)
    core_color = Column(String, default="")

    # ── FUNCTIONAL FLAGS (queryable) ─────────────────────────
    fire_rated = Column(Boolean, default=False)
    is_mto     = Column(Boolean, default=False)  # make-to-order vs in-stock

    # ── DESIGN TAXONOMY (manufacturer marketing, as strings) ──
    design_group        = Column(String, default="")   # "Woodgrains", "Stones", ...
    pricing_tier        = Column(String, default="")   # "$", "$$", "$$$"
    additional_features = Column(String, default="")   # comma-separated

    # ── COMMERCIAL ───────────────────────────────────────────
    cost_per_sheet = Column(Float, nullable=True)
    cost_per_sqft  = Column(Float, nullable=True)
    lead_time      = Column(String, default="")

    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ── RELATIONSHIPS ────────────────────────────────────────
    # manufacturer reached via: laminate.finish.manufacturer
    finish     = relationship("Finish")
    sheet_size = relationship("SheetSize")

    def __repr__(self):
        return f"<MaterialLaminate {self.code} ({self.type} G{self.grade} {self.texture})>"