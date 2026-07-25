# ─────────────────────────────────────────────────────────────
# models/library_shelf_supports.py
#
# library_shelf_supports — shelf pins. One row per style/size
# variant, same convention as the rest of the hardware catalog.
# ─────────────────────────────────────────────────────────────

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.sql import func
from database import Base


class LibraryShelfSupport(Base):

    __tablename__ = "library_shelf_supports"

    id   = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False, index=True)

    manufacturer = Column(String, nullable=False, index=True)
    style        = Column(String, nullable=False)   # Spoon / Locking Spoon
    diameter_mm  = Column(Float, nullable=False)     # 5mm standard

    material = Column(String, default="")
    finish   = Column(String, default="")

    has_stop = Column(Boolean, default=False)   # locking/anti-lift-out variant

    cost_per_100 = Column(Float, nullable=True)
    lead_time    = Column(String, default="")

    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<LibraryShelfSupport {self.code} ({self.style})>"
