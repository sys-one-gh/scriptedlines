# ─────────────────────────────────────────────────────────────
# models/project_hinge.py
#
# project_hinges — join table linking a project to a specific
# hinge SKU (library_hinges.id) added to it.
#
# project_code — the shop-drawing callout code (e.g. "HG-01") that
# identifies this hardware item within THIS project. User-entered
# only; never auto-generated. Unique per project.
# ─────────────────────────────────────────────────────────────

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class ProjectHinge(Base):

    __tablename__ = "project_hinges"
    __table_args__ = (
        UniqueConstraint("project_id", "hinge_id", name="uq_project_hinge_hinge"),
        UniqueConstraint("project_id", "project_code", name="uq_project_hinge_code"),
    )

    id           = Column(Integer, primary_key=True, index=True)
    project_id   = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    hinge_id     = Column(Integer, ForeignKey("library_hinges.id"), nullable=False, index=True)
    project_code = Column(String, nullable=False)
    added_by     = Column(Integer, ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # ── RELATIONSHIPS ────────────────────────────────────────
    project = relationship("Project")
    hinge   = relationship("LibraryHinge")

    def __repr__(self):
        return f"<ProjectHinge project={self.project_id} hinge={self.hinge_id}>"
