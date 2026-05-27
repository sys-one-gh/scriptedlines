# ─────────────────────────────────────────────────────────────
# models/project.py
#
# project_number — auto-assigned integer per user (1, 2, 3...)
# job_number     — user-assigned, unique per user
# ─────────────────────────────────────────────────────────────

import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Float, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class ProjectGrade(enum.Enum):
    Custom        = "Custom"
    Premium       = "Premium"
    Standard      = "Standard"
    Commercial    = "Commercial"
    Institutional = "Institutional"


class ProjectStandard(enum.Enum):
    AWMAC = "AWMAC"
    AWI   = "AWI"
    WI    = "WI"


class ProjectStatus(enum.Enum):
    active   = "active"
    archived = "archived"


class Project(Base):

    __tablename__ = "projects"

    id         = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey("users.id"),     nullable=False)

    # ── Identity ─────────────────────────────────────────────
    # project_number: auto-assigned by system per user (1, 2, 3...)
    # job_number:     user-assigned workplace number (e.g. 1930) — unique per user
    project_name   = Column(String,  nullable=False)
    project_number = Column(Integer, nullable=False)  # auto-assigned
    job_number     = Column(String,  default="")      # user workplace number
    description    = Column(Text,    default="")

    # ── Classification ───────────────────────────────────────
    project_grade = Column(Enum(ProjectGrade),    nullable=True)
    standard      = Column(Enum(ProjectStandard), nullable=True)

    # ── Client ───────────────────────────────────────────────
    client_name    = Column(String, default="")
    client_address = Column(String, default="")
    client_phone   = Column(String, default="")
    client_fax     = Column(String, default="")
    client_email   = Column(String, default="")

    # ── Job site ─────────────────────────────────────────────
    jobsite_name    = Column(String, default="")
    jobsite_address = Column(String, default="")
    jobsite_phone   = Column(String, default="")
    jobsite_fax     = Column(String, default="")
    jobsite_email   = Column(String, default="")

    # ── Team ─────────────────────────────────────────────────
    contractor_name = Column(String, default="")
    architect_name  = Column(String, default="")
    estimator_name  = Column(String, default="")
    project_manager = Column(String, default="")
    draftsman       = Column(String, default="")
    drawn_by        = Column(String, default="")
    checked_by      = Column(String, default="")

    # ── Schedule and budget ───────────────────────────────────
    scheduled_start_date        = Column(Date,  nullable=True)
    scheduled_completion_date   = Column(Date,  nullable=True)
    project_budget              = Column(Float, nullable=True)

    # ── Compliance ───────────────────────────────────────────
    compliance_leed = Column(Boolean, default=False)
    compliance_fsc  = Column(Boolean, default=False)
    compliance_fr   = Column(Boolean, default=False)

    # ── Status ───────────────────────────────────────────────
    status      = Column(Enum(ProjectStatus), default=ProjectStatus.active)
    is_inactive = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ── Relationships ────────────────────────────────────────
    company         = relationship("Company", back_populates="projects")
    created_by_user = relationship("User",    back_populates="projects")
    drawings        = relationship("Drawing", back_populates="project",
                                  order_by="Drawing.page_number")

    def __repr__(self):
        return f"<Project {self.id} — #{self.project_number} {self.project_name}>"