# ─────────────────────────────────────────────────────────────
# models/project_core.py
#
# project_cores — join table linking a project to a specific
# core SKU (library_cores.id) added to it. Flatter than
# project_laminates since cores have no master/variant split —
# one FK instead of two.
#
# project_code — the shop-drawing callout code (e.g. "CR-01") that
# identifies this material within THIS project. User-entered only;
# never auto-generated. Unique per project.
# ─────────────────────────────────────────────────────────────

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class ProjectCore(Base):

    __tablename__ = "project_cores"
    __table_args__ = (
        UniqueConstraint("project_id", "core_id", name="uq_project_core_core"),
        UniqueConstraint("project_id", "project_code", name="uq_project_core_code"),
    )

    id           = Column(Integer, primary_key=True, index=True)
    project_id   = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    core_id      = Column(Integer, ForeignKey("library_cores.id"), nullable=False, index=True)
    project_code = Column(String, nullable=False)
    added_by     = Column(Integer, ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # ── RELATIONSHIPS ────────────────────────────────────────
    project = relationship("Project")
    core    = relationship("MaterialCore")

    def __repr__(self):
        return f"<ProjectCore project={self.project_id} core={self.core_id}>"
