# ─────────────────────────────────────────────────────────────
# models/project_laminate.py
#
# project_laminates — join table linking a project to a specific
# orderable laminate variant (finish + texture + grade + thickness),
# i.e. one row per laminate_formica.id added to a project.
#
# project_code — the shop-drawing callout code (e.g. "PL-01") that
# identifies this material within THIS project. User-entered only;
# never auto-generated. Unique per project.
# ─────────────────────────────────────────────────────────────

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class ProjectLaminate(Base):

    __tablename__ = "project_laminates"
    __table_args__ = (
        UniqueConstraint("project_id", "variant_id", name="uq_project_laminate_variant"),
        UniqueConstraint("project_id", "project_code", name="uq_project_laminate_code"),
    )

    id           = Column(Integer, primary_key=True, index=True)
    project_id   = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    laminate_id  = Column(Integer, ForeignKey("laminates.id"), nullable=False, index=True)
    variant_id   = Column(Integer, ForeignKey("laminate_formica.id"), nullable=False, index=True)
    project_code = Column(String, nullable=False)
    added_by     = Column(Integer, ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # ── RELATIONSHIPS ────────────────────────────────────────
    project  = relationship("Project")
    laminate = relationship("Laminate")
    variant  = relationship("LaminateFormica")

    def __repr__(self):
        return f"<ProjectLaminate project={self.project_id} variant={self.variant_id}>"
