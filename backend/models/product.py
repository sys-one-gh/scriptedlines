# ─────────────────────────────────────────────────────────────
# models/product.py
#
# Defines the library_products table in PostgreSQL.
# This is the global product catalog — available to all users.
# Products are never deleted — only deactivated via is_active.
# ─────────────────────────────────────────────────────────────

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.sql import func
from database import Base


class Product(Base):

    __tablename__ = "library_products"

    # ── PRIMARY KEY ──────────────────────────────────────────
    id = Column(Integer, primary_key=True, index=True)

    # ── CLASSIFICATION ───────────────────────────────────────
    # category    → top level group shown in left panel
    # subcategory → second level group inside category
    # name        → full product name shown in left panel
    # code        → drawing code — appears on drawings and BOMs
    # description → shown in left panel tab under product name
    # svg_type    → tells Python geometry engine which class to use
    category    = Column(String, nullable=False, index=True)
    subcategory = Column(String, nullable=False, index=True)
    name        = Column(String, nullable=False)
    code        = Column(String, unique=True, nullable=False, index=True)
    description = Column(String, default="")
    svg_type    = Column(String, nullable=False)

    # ── DEFAULT DIMENSIONS (mm) ──────────────────────────────
    # Pre-fills the drop form when user drags product to paper.
    # All dimensions in millimeters.
    default_width  = Column(Float, nullable=False)
    default_height = Column(Float, nullable=False)
    default_depth  = Column(Float, nullable=False)

    # ── DEFAULT CONFIGURATION ────────────────────────────────
    default_doors   = Column(Integer, default=0)
    default_drawers = Column(Integer, default=0)
    default_shelves = Column(Integer, default=0)

    # ── DISPLAY ──────────────────────────────────────────────
    # sort_order controls the order products appear in left panel
    # Lower number = appears first
    sort_order = Column(Integer, default=0)

    # ── STATUS ───────────────────────────────────────────────
    # Never delete products — deactivate them instead
    # so drawing history referencing them is always preserved
    is_active = Column(Boolean, default=True)

    # ── TIMESTAMPS ───────────────────────────────────────────
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Product {self.code} — {self.name}>"