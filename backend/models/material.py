# ─────────────────────────────────────────────────────────────
# models/material.py
#
# Defines the library_materials table in PostgreSQL.
# This is the global materials catalog — available to all users.
# Materials are never deleted — only deactivated via is_active.
#
# Covers the three clean material families learned from the
# Microvellum taxonomy:
#   Panel       (sheet stock — MDF, Melamine, Plywood, Laminate…)
#   Solid Wood  (solid stock — Hardwood, Walnut, Poplar…)
#   Edgeband    (edgebanding — PVC, Veneer, Finished…)
#
# BOM tables reference materials by string CODE (not FK), so the
# catalog source can later move global → project-scoped with a
# one-line change.
# ─────────────────────────────────────────────────────────────

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.sql import func
from database import Base


class Material(Base):

    __tablename__ = "library_materials"

    # ── PRIMARY KEY ──────────────────────────────────────────
    id = Column(Integer, primary_key=True, index=True)

    # ── CLASSIFICATION ───────────────────────────────────────
    # category    → top level group shown in left panel
    #               (Panel | Solid Wood | Edgeband)
    # subcategory → second level group inside category
    #               (MDF, Melamine, Plywood, Hardwood, PVC Edging…)
    # name        → full material name shown in left panel
    # code        → drawing code — appears on drawings and BOMs
    #               (PNL-0001 / SLD-0001 / EB-0001)
    category    = Column(String, nullable=False, index=True)
    subcategory = Column(String, nullable=False, index=True)
    name        = Column(String, nullable=False)
    code        = Column(String, unique=True, nullable=False, index=True)
    comments    = Column(String, default="")

    # ── PHYSICAL PROPERTIES ──────────────────────────────────
    # thickness_mm → material thickness in millimeters
    # has_grain    → true if material has a grain direction that
    #                constrains part rotation during nesting
    # unit         → how the material is measured / purchased
    #                sheet  (panels)
    #                lf     (edgeband — linear feet/metre)
    #                ea     (solid stock pieces, misc)
    thickness_mm = Column(Float, nullable=True)
    has_grain    = Column(Boolean, default=False)
    unit         = Column(String, default="sheet")

    # ── DEFAULT SHEET SIZE (mm, panels only) ─────────────────
    # Pre-fills nesting / sheet-goods calcs. Null for non-panel.
    default_sheet_length = Column(Float, nullable=True)
    default_sheet_width  = Column(Float, nullable=True)

    # ── DISPLAY ──────────────────────────────────────────────
    # sort_order controls the order materials appear in left panel
    # Lower number = appears first
    sort_order = Column(Integer, default=0)

    # ── STATUS ───────────────────────────────────────────────
    # Never delete materials — deactivate them instead so drawing
    # history referencing them by code is always preserved
    is_active = Column(Boolean, default=True)

    # ── TIMESTAMPS ───────────────────────────────────────────
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Material {self.code} — {self.name}>"
