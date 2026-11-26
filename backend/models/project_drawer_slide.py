# ─────────────────────────────────────────────────────────────
# models/project_drawer_slide.py
#
# project_drawer_slides — join table linking a project to a
# specific drawer slide SKU (library_drawer_slides.id) added to it.
#
# project_code — the shop-drawing callout code (e.g. "DS-01") that
# identifies this hardware item within THIS project. User-entered
# only; never auto-generated. Unique per project.
# ─────────────────────────────────────────────────────────────

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class ProjectDrawerSlide(Base):

    __tablename__ = "project_drawer_slides"
    __table_args__ = (
        UniqueConstraint("project_id", "drawer_slide_id", name="uq_project_drawer_slide_slide"),
        UniqueConstraint("project_id", "project_code", name="uq_project_drawer_slide_code"),
    )

    id              = Column(Integer, primary_key=True, index=True)
    project_id      = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    drawer_slide_id = Column(Integer, ForeignKey("library_drawer_slides.id"), nullable=False, index=True)
    project_code    = Column(String, nullable=False)
    added_by        = Column(Integer, ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # ── RELATIONSHIPS ────────────────────────────────────────
    project      = relationship("Project")
    drawer_slide = relationship("LibraryDrawerSlide")

    def __repr__(self):
        return f"<ProjectDrawerSlide project={self.project_id} slide={self.drawer_slide_id}>"
