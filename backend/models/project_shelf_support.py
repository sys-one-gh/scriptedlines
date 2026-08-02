# ─────────────────────────────────────────────────────────────
# models/project_shelf_support.py
#
# project_shelf_supports — join table linking a project to a
# specific shelf support SKU (library_shelf_supports.id) added
# to it.
#
# project_code — the shop-drawing callout code (e.g. "SP-01") that
# identifies this hardware item within THIS project. User-entered
# only; never auto-generated. Unique per project.
# ─────────────────────────────────────────────────────────────

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class ProjectShelfSupport(Base):

    __tablename__ = "project_shelf_supports"
    __table_args__ = (
        UniqueConstraint("project_id", "shelf_support_id", name="uq_project_shelf_support_support"),
        UniqueConstraint("project_id", "project_code", name="uq_project_shelf_support_code"),
    )

    id               = Column(Integer, primary_key=True, index=True)
    project_id       = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    shelf_support_id = Column(Integer, ForeignKey("library_shelf_supports.id"), nullable=False, index=True)
    project_code     = Column(String, nullable=False)
    added_by         = Column(Integer, ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # ── RELATIONSHIPS ────────────────────────────────────────
    project       = relationship("Project")
    shelf_support = relationship("LibraryShelfSupport")

    def __repr__(self):
        return f"<ProjectShelfSupport project={self.project_id} support={self.shelf_support_id}>"
