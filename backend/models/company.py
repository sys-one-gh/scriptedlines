# ─────────────────────────────────────────────────────────────
# models/company.py
#
# Companies table — stores the millwork company account.
# Every user, project, and drawing belongs to a company.
# Company info auto-fills the title block on every drawing.
# ─────────────────────────────────────────────────────────────

from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Company(Base):

    __tablename__ = "companies"

    # ── PRIMARY KEY ──────────────────────────────────────────
    id = Column(Integer, primary_key=True, index=True)

    # ── COMPANY INFO ─────────────────────────────────────────
    company_name        = Column(String, nullable=False)
    company_address     = Column(String, default="")
    company_city        = Column(String, default="")
    company_province    = Column(String, default="")
    company_postal_code = Column(String, default="")
    company_phone       = Column(String, default="")
    company_fax         = Column(String, default="")
    company_email       = Column(String, default="")
    company_website     = Column(String, default="")
    logo_url            = Column(String, default="")

    # ── STATUS ───────────────────────────────────────────────
    is_active = Column(Boolean, default=True)

    # ── TIMESTAMPS ───────────────────────────────────────────
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ── RELATIONSHIPS ────────────────────────────────────────
    users    = relationship("User",    back_populates="company")
    projects = relationship("Project", back_populates="company")

    def __repr__(self):
        return f"<Company {self.id} — {self.company_name}>"
