# ─────────────────────────────────────────────────────────────
# models/project_edgeband.py
#
# project_edgebands — DERIVED, not browsed/added. One row is
# auto-created whenever a laminate is added to a project (see
# api/laminates.py::add_project_laminate) and auto-removed when
# that laminate is removed. There is no global catalog to search —
# the edge only exists because a face material exists to match.
#
# edge_type: "PVC" normally, "Color Core" when the source laminate's
# collection is ColorCore2 (the color runs through the sheet, so the
# laminate itself is the edge — no separate thickness to pick).
#
# thickness_mm/width_mm are user-editable after creation (a dropdown
# in the Project Setup table, not a one-time pick) — width is paired
# to thickness by convention, not independently chosen. Both are
# null for Color Core rows. `description` is a cached, recomputed-
# on-edit string — not derived at read time — so it can be edited
# via a single field.
#
# source_material_type/source_material_id mirror the same polymorphic
# pattern as ProjectLayup's faces — "laminate" only for now, ready to
# extend to "veneer" once that catalog exists.
# ─────────────────────────────────────────────────────────────

from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class ProjectEdgeband(Base):

    __tablename__ = "project_edgebands"
    __table_args__ = (
        UniqueConstraint("project_id", "project_code", name="uq_project_edgeband_code"),
        UniqueConstraint("project_id", "source_material_type", "source_material_id", name="uq_project_edgeband_source"),
    )

    id                   = Column(Integer, primary_key=True, index=True)
    project_id           = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    project_code         = Column(String, nullable=False)   # system-assigned, e.g. "EB-01"

    source_material_type = Column(String, nullable=False)   # "laminate" for now
    source_material_id   = Column(Integer, nullable=False)  # project_laminates.id

    edge_type    = Column(String, nullable=False)            # "PVC" / "Color Core"
    thickness_mm = Column(Float, nullable=True)
    width_mm     = Column(Float, nullable=True)
    description  = Column(String, nullable=False)

    added_by  = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # ── RELATIONSHIPS ────────────────────────────────────────
    project = relationship("Project")

    def __repr__(self):
        return f"<ProjectEdgeband {self.project_code} project={self.project_id}>"
