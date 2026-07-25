# ─────────────────────────────────────────────────────────────
# api/layups.py
#
# GET    /api/projects/:id/layups           → layups created for a project
# POST   /api/projects/:id/layups           → create a layup (core + 2 faces)
# DELETE /api/projects/:id/layups/:row_id   → remove from a project
#
# No search/browse endpoint — a layup combines materials already
# added to THIS project (project_cores, project_laminates), not the
# global catalog, so the composer lists what's already there instead
# of searching (see GET /projects/:id/cores and .../laminates).
#
# Faces are polymorphic (material_type/material_id) so metal laminate
# / veneer faces can be added later — see SUPPORTED_FACE_TYPES and
# _resolve_face below, the only two things that need a new branch.
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.project_layup import ProjectLayup
from models.project_core import ProjectCore
from models.project_laminate import ProjectLaminate
from models.material_core import MaterialCore
from models.project import Project
from models.user import User, UserRole
from auth import get_current_user, require_not_viewer
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

SUPPORTED_FACE_TYPES = {"laminate"}


def _load_owned_project(project_id: int, db: Session, current_user: User) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.company_id != current_user.company_id:
        if current_user.role == UserRole.scriptedlines_admin:
            raise HTTPException(
                status_code=403,
                detail="ScriptedLines admins have read-only access and can't edit project setup for a project outside their own company.",
            )
        raise HTTPException(status_code=404, detail="Not found")
    return project


def _resolve_project_core(project_id: int, project_core_id: int, db: Session) -> ProjectCore:
    row = db.query(ProjectCore).filter(
        ProjectCore.id == project_core_id,
        ProjectCore.project_id == project_id,
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Core not found in this project")
    return row


def _resolve_face(project_id: int, material_type: str, material_id: int, db: Session) -> dict:
    """Strict — used when creating a layup. Raises if the type isn't
    supported yet, or the referenced row doesn't belong to this project."""
    if material_type not in SUPPORTED_FACE_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported face material type: {material_type}")

    row = db.query(ProjectLaminate).filter(
        ProjectLaminate.id == material_id,
        ProjectLaminate.project_id == project_id,
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Face material not found in this project")

    return {
        "project_code":  row.project_code,
        "finish_code":   row.laminate.finish_code,
        "finish_name":   row.laminate.finish_name,
        "manufacturer":  row.laminate.manufacturer,
        "thickness_mm":  row.variant.thickness_mm,
    }


def _face_summary_for_display(material_type: str, material_id: int, finish_code_fallback: str, db: Session) -> dict:
    """Lenient — used when listing. The polymorphic face fields have no
    DB-level FK, so a referenced project_laminates row could theoretically
    be gone; degrade gracefully instead of 500ing the whole list."""
    summary = {"material_type": material_type, "finish_code": finish_code_fallback,
               "finish_name": None, "manufacturer": None, "thickness_mm": None}
    if material_type == "laminate":
        row = db.query(ProjectLaminate).filter(ProjectLaminate.id == material_id).first()
        if row:
            summary["finish_name"]  = row.laminate.finish_name
            summary["manufacturer"] = row.laminate.manufacturer
            summary["thickness_mm"] = row.variant.thickness_mm
    return summary


def _core_summary(project_core_id: int, db: Session) -> dict:
    pc = db.query(ProjectCore).filter(ProjectCore.id == project_core_id).first()
    if not pc:
        return {"project_code": None, "code": None, "description": None}
    core = db.query(MaterialCore).filter(MaterialCore.id == pc.core_id).first()
    return {
        "project_code": pc.project_code,
        "code":         core.code if core else None,
        "description":  core.description if core else None,
    }


def _layup_to_dict(row: ProjectLayup, db: Session) -> dict:
    return {
        "id":                 row.id,
        "project_code":       row.project_code,
        "added_by":           row.added_by,
        "created_at":         str(row.created_at) if row.created_at else None,
        "core":               _core_summary(row.project_core_id, db),
        "face_a":             _face_summary_for_display(row.face_a_material_type, row.face_a_material_id, row.face_a_finish_code, db),
        "face_b":             _face_summary_for_display(row.face_b_material_type, row.face_b_material_id, row.face_b_finish_code, db),
    }


# ─── LIST ────────────────────────────────────────────────────
@router.get("/projects/{project_id}/layups")
def list_project_layups(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _load_owned_project(project_id, db, current_user)
    rows = db.query(ProjectLayup).filter(ProjectLayup.project_id == project_id).order_by(ProjectLayup.id).all()
    return {"status": "ok", "layups": [_layup_to_dict(r, db) for r in rows]}


# ─── CREATE ──────────────────────────────────────────────────
class CreateLayup(BaseModel):
    project_code:    str
    project_core_id: int
    face_a_type:     str
    face_a_id:       int
    face_b_type:     str
    face_b_id:       int


@router.post("/projects/{project_id}/layups")
def create_layup(project_id: int, data: CreateLayup, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _load_owned_project(project_id, db, current_user)
    require_not_viewer(current_user, "create layups")

    project_code = data.project_code.strip()
    if not project_code:
        raise HTTPException(status_code=400, detail="Project code is required")

    existing_code = db.query(ProjectLayup).filter(
        ProjectLayup.project_id == project_id,
        ProjectLayup.project_code == project_code,
    ).first()
    if existing_code:
        raise HTTPException(status_code=400, detail=f"Code '{project_code}' is already used in this project")

    _resolve_project_core(project_id, data.project_core_id, db)
    face_a = _resolve_face(project_id, data.face_a_type, data.face_a_id, db)
    face_b = _resolve_face(project_id, data.face_b_type, data.face_b_id, db)

    row = ProjectLayup(
        project_id            = project_id,
        project_code          = project_code,
        project_core_id       = data.project_core_id,
        face_a_material_type  = data.face_a_type,
        face_a_material_id    = data.face_a_id,
        face_a_finish_code    = face_a["project_code"],
        face_b_material_type  = data.face_b_type,
        face_b_material_id    = data.face_b_id,
        face_b_finish_code    = face_b["project_code"],
        added_by              = current_user.id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    return {"status": "ok", "layup": _layup_to_dict(row, db)}


# ─── REMOVE ─────────────────────────────────────────────────
@router.delete("/projects/{project_id}/layups/{row_id}")
def remove_layup(project_id: int, row_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _load_owned_project(project_id, db, current_user)
    require_not_viewer(current_user, "remove layups")

    row = db.query(ProjectLayup).filter(
        ProjectLayup.id == row_id,
        ProjectLayup.project_id == project_id,
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Layup not found")

    db.delete(row)
    db.commit()
    return {"status": "ok", "message": f"Removed layup {row_id} from project"}
