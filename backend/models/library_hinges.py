# ─────────────────────────────────────────────────────────────
# models/library_hinges.py
#
# library_hinges — concealed cabinet door hinges. One row per
# manufacturer SKU (product line x overlay type x opening angle x
# fixing type are all distinct orderable products, same "one row
# per orderable variant" convention as laminates/melamine).
#
# code is the manufacturer's real part number (e.g. "71B3550"),
# not an internal code — matches how these are actually ordered.
#
# Self-contained, no shared lookup tables — same pattern as every
# other catalog this session.
# ─────────────────────────────────────────────────────────────

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.sql import func
from database import Base


class LibraryHinge(Base):

    __tablename__ = "library_hinges"

    id   = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False, index=True)   # manufacturer part number

    manufacturer = Column(String, nullable=False, index=True)
    product_line = Column(String, nullable=False)   # e.g. "CLIP top BLUMOTION" / "CLIP top"
    application  = Column(String, nullable=True)     # e.g. "Standard Hinge" / "Wide Angled Hinge"

    cabinet_type              = Column(String, default="")   # e.g. "Frameless"
    cabinet_thickness_min_mm  = Column(Float, nullable=True)

    overlay_type      = Column(String, nullable=False)   # Full Overlay / Half Overlay / Inset
    opening_angle_deg = Column(Integer, nullable=False)

    mechanism  = Column(String, default="")   # e.g. "Spring + BLUMOTION Soft-Close"
    soft_close = Column(Boolean, default=True)

    fixing_type = Column(String, nullable=False)   # hinge cup fixing: Screw-on / INSERTA / Press-in / EXPANDO

    milling_diameter_mm = Column(Float, nullable=False)   # cup bore, 35mm standard
    milling_depth_mm    = Column(Float, nullable=False)

    door_thickness_min_mm = Column(Float, nullable=True)
    door_thickness_max_mm = Column(Float, nullable=True)

    material = Column(String, default="")
    finish   = Column(String, default="")

    cost_per_pair = Column(Float, nullable=True)
    lead_time     = Column(String, default="")

    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<LibraryHinge {self.code} ({self.overlay_type} {self.opening_angle_deg}°)>"
