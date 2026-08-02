# ─────────────────────────────────────────────────────────────
# models/library_handles.py
#
# library_handles — pulls and knobs. One row per finish/size
# variant, same "one row per orderable SKU" convention as the
# rest of the hardware catalog.
# ─────────────────────────────────────────────────────────────

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.sql import func
from database import Base


class LibraryHandle(Base):

    __tablename__ = "library_handles"

    id   = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False, index=True)

    manufacturer = Column(String, nullable=False, index=True)
    style        = Column(String, nullable=False)   # Bar Pull / Knob

    center_to_center_mm = Column(Float, nullable=True)   # null for single-hole knobs
    projection_mm        = Column(Float, nullable=True)

    finish   = Column(String, nullable=False)
    material = Column(String, default="")

    mounting_holes = Column(Integer, default=2)

    cost_each = Column(Float, nullable=True)
    lead_time = Column(String, default="")

    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<LibraryHandle {self.code} ({self.style})>"
