# ─────────────────────────────────────────────────────────────
# models/project.py
#
# Projects table — stores each millwork project.
# All fields here auto-fill the drawing title block.
# One project contains many drawings.
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

    # ── PRIMARY KEY ──────────────────────────────────────────
    id = Column(Integer, primary_key=True, index=True)

    # ── FOREIGN KEYS ─────────────────────────────────────────
    company_id  = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    created_by  = Column(Integer, ForeignKey("users.id"),     nullable=False)

    # ── PROJECT IDENTITY ─────────────────────────────────────
    project_name   = Column(String, nullable=False)
    project_number = Column(String, default="")
    job_number     = Column(String, default="")
    description    = Column(Text,   default="")

    # ── CLASSIFICATION ───────────────────────────────────────
    project_grade = Column(Enum(ProjectGrade),    nullable=True)
    standard      = Column(Enum(ProjectStandard), nullable=True)

    # ── CLIENT INFO ──────────────────────────────────────────
    client_name    = Column(String, default="")
    client_address = Column(String, default="")
    client_phone   = Column(String, default="")
    client_fax     = Column(String, default="")
    client_email   = Column(String, default="")

    # ── JOB SITE INFO ────────────────────────────────────────
    jobsite_name    = Column(String, default="")
    jobsite_address = Column(String, default="")
    jobsite_phone   = Column(String, default="")
    jobsite_fax     = Column(String, default="")
    jobsite_email   = Column(String, default="")

    # ── TEAM ─────────────────────────────────────────────────
    contractor_name = Column(String, default="")
    architect_name  = Column(String, default="")
    estimator_name  = Column(String, default="")
    project_manager = Column(String, default="")
    draftsman       = Column(String, default="")
    drawn_by        = Column(String, default="")
    checked_by      = Column(String, default="")

    # ── SCHEDULE AND BUDGET ───────────────────────────────────
    scheduled_start_date        = Column(Date,  nullable=True)
    scheduled_completion_date   = Column(Date,  nullable=True)
    project_budget              = Column(Float, nullable=True)

    # ── STATUS ───────────────────────────────────────────────
    status      = Column(Enum(ProjectStatus), default=ProjectStatus.active)
    is_inactive = Column(Boolean, default=False)

    # ── TIMESTAMPS ───────────────────────────────────────────
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ── RELATIONSHIPS ────────────────────────────────────────
    company         = relationship("Company", back_populates="projects")
    created_by_user = relationship("User",    back_populates="projects")
    drawings        = relationship("Drawing", back_populates="project",
                                  order_by="Drawing.page_number")

    def __repr__(self):
        return f"<Project {self.id} — {self.project_name}>"
