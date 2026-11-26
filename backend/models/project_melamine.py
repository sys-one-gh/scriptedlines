# ─────────────────────────────────────────────────────────────
# models/project_melamine.py
#
# project_melamine — join table linking a project to a specific
# melamine SKU (library_melamine.id) added to it. Flat, one FK,
# same shape as project_cores (melamine has no master/variant split).
#
# project_code — the shop-drawing callout code (e.g. "ML-01") that
# identifies this material within THIS project. User-entered only;
# never auto-generated. Unique per project.
# ─────────────────────────────────────────────────────────────

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class ProjectMelamine(Base):

    __tablename__ = "project_melamine"
    __table_args__ = (
        UniqueConstraint("project_id", "melamine_id", name="uq_project_melamine_melamine"),
        UniqueConstraint("project_id", "project_code", name="uq_project_melamine_code"),
    )

    id           = Column(Integer, primary_key=True, index=True)
    project_id   = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    melamine_id  = Column(Integer, ForeignKey("library_melamine.id"), nullable=False, index=True)
    project_code = Column(String, nullable=False)
    added_by     = Column(Integer, ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # ── RELATIONSHIPS ────────────────────────────────────────
    project  = relationship("Project")
    melamine = relationship("MaterialMelamine")

    def __repr__(self):
        return f"<ProjectMelamine project={self.project_id} melamine={self.melamine_id}>"
