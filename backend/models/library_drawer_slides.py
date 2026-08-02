# ─────────────────────────────────────────────────────────────
# models/library_drawer_slides.py
#
# library_drawer_slides — one row per length (each length is its
# own orderable SKU, same convention as hinges/laminates).
#
# code is the manufacturer's real part number (e.g. "563H4570B"),
# not an internal code — matches how these are actually ordered.
# ─────────────────────────────────────────────────────────────

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.sql import func
from database import Base


class LibraryDrawerSlide(Base):

    __tablename__ = "library_drawer_slides"

    id   = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False, index=True)   # manufacturer part number

    manufacturer = Column(String, nullable=False, index=True)
    product_line = Column(String, nullable=False)   # e.g. "TANDEM plus BLUMOTION 563H"

    mounting_type  = Column(String, nullable=False)  # Undermount / Side-mount / Center-mount
    extension_type = Column(String, nullable=False)  # Full Extension / Partial Extension

    length_mm    = Column(Float, nullable=False)   # drawer length this runner is sized for
    length_label = Column(String, nullable=False)   # e.g. '9in' — how it's actually ordered/spoken

    runner_length_mm = Column(Float, nullable=True)   # actual physical runner length (differs from drawer length)

    cabinet_depth_mm     = Column(Float, nullable=True)   # standard cabinet depth this runner is designed for
    min_cabinet_depth_mm = Column(Float, nullable=True)   # inside-cabinet-depth range this runner fits
    max_cabinet_depth_mm = Column(Float, nullable=True)

    load_capacity_lbs           = Column(Float, nullable=False)
    max_drawer_side_thickness_mm = Column(Float, nullable=True)

    # Physical envelope of the slide hardware itself — drives drawer box
    # sizing in the drawing engine (box width = opening width minus
    # 2x slide_thickness_mm for side-mount slides; box height clearance
    # is bounded by slide_height_mm). Undermount slides (e.g. Blum 563H)
    # don't have a directly comparable side-profile thickness — left
    # NULL rather than forcing an approximate figure.
    slide_thickness_mm = Column(Float, nullable=True)
    slide_height_mm    = Column(Float, nullable=True)

    soft_close = Column(Boolean, default=True)
    material   = Column(String, default="")
    finish     = Column(String, default="")

    cost_per_pair = Column(Float, nullable=True)
    lead_time     = Column(String, default="")

    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<LibraryDrawerSlide {self.code} ({self.length_label})>"
