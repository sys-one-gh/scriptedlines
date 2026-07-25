# ─────────────────────────────────────────────────────────────
# models/project_layup.py
#
# project_layups — a panel construction: one project_core plus two
# faces (one per side). Deliberately excludes edge banding — that's
# applied per-part (e.g. a cabinet gable's front edge), never to a
# full sheet, so it doesn't belong on a layup.
#
# References project-scoped rows, not the global catalog — a layup
# combines materials already added to THIS project (project_cores,
# project_laminates), not raw library_cores/laminate_formica rows.
# That's also why the face is polymorphic (material_type/material_id)
# rather than a fixed FK: only "laminate" (-> project_laminates.id)
# is wired up today, but metal laminate / veneer faces can be added
# later by teaching _resolve_face (api/layups.py) one more branch —
# no schema change needed here.
#
# face_a_finish_code / face_b_finish_code denormalize that face's own
# project_laminates.project_code at creation time (e.g. "PL-01") —
# kept as their own columns per explicit request; project_code on
# this table identifies the LAYUP itself and stays a plain manual
# field for now (auto-derivation from the face codes deferred).
# ─────────────────────────────────────────────────────────────

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class ProjectLayup(Base):

    __tablename__ = "project_layups"
    __table_args__ = (
        UniqueConstraint("project_id", "project_code", name="uq_project_layup_code"),
    )

    id              = Column(Integer, primary_key=True, index=True)
    project_id      = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    project_code    = Column(String, nullable=False)

    project_core_id = Column(Integer, ForeignKey("project_cores.id"), nullable=False, index=True)

    face_a_material_type = Column(String, nullable=False)   # "laminate" for now
    face_a_material_id   = Column(Integer, nullable=False)  # project_laminates.id when type="laminate"
    face_a_finish_code   = Column(String, nullable=False)

    face_b_material_type = Column(String, nullable=False)
    face_b_material_id   = Column(Integer, nullable=False)
    face_b_finish_code   = Column(String, nullable=False)

    added_by   = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # ── RELATIONSHIPS ────────────────────────────────────────
    project      = relationship("Project")
    project_core = relationship("ProjectCore")

    def __repr__(self):
        return f"<ProjectLayup {self.project_code} project={self.project_id}>"
