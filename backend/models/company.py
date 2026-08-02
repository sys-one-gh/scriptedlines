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

    # Exactly one row has this set true — ScriptedLines' own internal
    # company, home for platform-admin accounts. Enforced by a partial
    # unique index at the DB level (see the migration), not just here.
    is_platform_org = Column(Boolean, nullable=False, server_default="false")

    # The credential new users provide to join this company at
    # registration (see api/companies.py's _generate_join_code /
    # api/users.py's register()). NULL only for is_platform_org=true —
    # that company is never joined by code, only via platform_admin_secret_hash.
    join_code = Column(String, unique=True, nullable=True)

    # bcrypt hash of the platform-admin registration secret (see
    # api/users.py's register()). Only meaningful on the is_platform_org=true
    # row. Lives in the shared database — not an env var — so it's the same
    # value no matter whose machine the backend runs on.
    platform_admin_secret_hash = Column(String, nullable=True)

    # ── TIMESTAMPS ───────────────────────────────────────────
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ── RELATIONSHIPS ────────────────────────────────────────
    users    = relationship("User",    back_populates="company")
    projects = relationship("Project", back_populates="company")

    def __repr__(self):
        return f"<Company {self.id} — {self.company_name}>"
