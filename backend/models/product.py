# ─────────────────────────────────────────────────────────────
# models/library_product.py
#
# Product table — stores the global product catalog.
# This replaces toolLibrary.js permanently.
# All users see these products in their left panel.
#
# When you add a new product it appears in every
# user's left panel immediately — no code changes needed.
# ─────────────────────────────────────────────────────────────

import sys
import os

# Add backend/ folder to Python path so database.py can be found
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.sql import func
from database import Base


class Product(Base):

    # ── TABLE NAME ───────────────────────────────────────────
    __tablename__ = "library_products"

    # ── PRIMARY KEY ──────────────────────────────────────────
    id = Column(Integer, primary_key=True, index=True)

    # ── IDENTIFICATION ───────────────────────────────────────
    # code     → drawing code shown on drawings and schedules
    # name     → display name in the left panel
    # category → which category group it belongs to
    # svg_type → tells Python geometry engine which class to use
    code     = Column(String, unique=True, nullable=False, index=True)
    name     = Column(String, nullable=False)
    category = Column(String, nullable=False)
    svg_type = Column(String, nullable=False)

    # ── DEFAULT DIMENSIONS (mm) ──────────────────────────────
    # Pre-fills the drop form when user drags product to paper
    default_width  = Column(Float, nullable=False)
    default_height = Column(Float, nullable=False)
    default_depth  = Column(Float, nullable=False)

    # ── DEFAULT CONFIGURATION ────────────────────────────────
    default_doors   = Column(Integer, default=0)
    default_drawers = Column(Integer, default=0)
    default_shelves = Column(Integer, default=0)

    # ── DESCRIPTION ──────────────────────────────────────────
    # Shown in drop form and right panel
    description = Column(String, default="")

    # ── STATUS ───────────────────────────────────────────────
    # is_active = False hides product from left panel
    # We never delete products — we deactivate them
    # so drawing history is always preserved
    is_active = Column(Boolean, default=True)

    # ── TIMESTAMPS ───────────────────────────────────────────
    # Automatically set by the database
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Product {self.code} — {self.name}>"