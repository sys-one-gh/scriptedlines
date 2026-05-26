# ─────────────────────────────────────────────────────────────
# models/user.py
#
# Users table — stores all user accounts.
# Each user belongs to one company.
# Password is always stored as a bcrypt hash — never plain text.
# ─────────────────────────────────────────────────────────────

import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class UserRole(enum.Enum):
    owner     = "owner"
    admin     = "admin"
    draftsman = "draftsman"
    viewer    = "viewer"


class User(Base):

    __tablename__ = "users"

    # ── PRIMARY KEY ──────────────────────────────────────────
    id = Column(Integer, primary_key=True, index=True)

    # ── FOREIGN KEY ──────────────────────────────────────────
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)

    # ── USER INFO ────────────────────────────────────────────
    first_name    = Column(String, nullable=False)
    last_name     = Column(String, nullable=False)
    email         = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role          = Column(Enum(UserRole), default=UserRole.draftsman)
    initials      = Column(String, default="")  # appears on drawings e.g. RPB

    # ── STATUS ───────────────────────────────────────────────
    is_active  = Column(Boolean, default=True)
    last_login = Column(DateTime(timezone=True), nullable=True)

    # ── TIMESTAMPS ───────────────────────────────────────────
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ── RELATIONSHIPS ────────────────────────────────────────
    company  = relationship("Company",  back_populates="users")
    projects = relationship("Project",  back_populates="created_by_user")
    drawings = relationship("Drawing",  back_populates="created_by_user")

    def __repr__(self):
        return f"<User {self.id} — {self.email}>"
