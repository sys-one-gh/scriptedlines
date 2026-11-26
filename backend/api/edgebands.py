# ─────────────────────────────────────────────────────────────
# api/edgebands.py
#
# GET    /api/projects/:id/edgebands           → edges auto-created for a project
# PUT    /api/projects/:id/edgebands/:row_id   → change thickness (PVC rows only)
# DELETE /api/projects/:id/edgebands/:row_id   → remove
#
# No POST — edgeband rows are only ever created automatically by
# api/laminates.py::add_project_laminate, never added directly here.
# Manual DELETE is still allowed (a user may decide a face doesn't
# need banding even though the laminate stays in the project).
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.project_edgeband import ProjectEdgeband
from models.project_laminate import ProjectLaminate
from models.project import Project
from models.user import User, UserRole
from auth import get_current_user, require_not_viewer
from pydantic import BaseModel

router = APIRouter()

# Same pairing/formatting as api/laminates.py — duplicated per this
# codebase's no-cross-router-import convention.
EDGE_THICKNESS_WIDTH = {0.5: 22.0, 1.0: 28.0, 2.0: 35.0, 3.0: 42.0}


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


def _fmt_mm(value: float) -> str:
    return f"{value:g}"


def _edgeband_to_dict(e: ProjectEdgeband) -> dict:
    return {
        "id":                   e.id,
        "project_code":         e.project_code,
        "source_material_type": e.source_material_type,
        "source_material_id":   e.source_material_id,
        "edge_type":            e.edge_type,
        "thickness_mm":         e.thickness_mm,
        "width_mm":             e.width_mm,
        "description":          e.description,
        "added_by":             e.added_by,
        "created_at":           str(e.created_at) if e.created_at else None,
    }


# ─── LIST ────────────────────────────────────────────────────
@router.get("/projects/{project_id}/edgebands")
def list_project_edgebands(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _load_owned_project(project_id, db, current_user)
    rows = db.query(ProjectEdgeband).filter(ProjectEdgeband.project_id == project_id).order_by(ProjectEdgeband.id).all()
    return {"status": "ok", "edgebands": [_edgeband_to_dict(e) for e in rows]}


# ─── UPDATE THICKNESS ──────────────────────────────────────────
class UpdateEdgebandThickness(BaseModel):
    thickness_mm: float


@router.put("/projects/{project_id}/edgebands/{row_id}")
def update_edgeband_thickness(project_id: int, row_id: int, data: UpdateEdgebandThickness, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _load_owned_project(project_id, db, current_user)
    require_not_viewer(current_user, "change edgeband thickness")

    row = db.query(ProjectEdgeband).filter(
        ProjectEdgeband.id == row_id,
        ProjectEdgeband.project_id == project_id,
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Project edgeband not found")

    if row.edge_type != "PVC":
        raise HTTPException(status_code=400, detail="Color Core edges don't have a separate thickness to change")

    if data.thickness_mm not in EDGE_THICKNESS_WIDTH:
        allowed = ", ".join(_fmt_mm(t) for t in sorted(EDGE_THICKNESS_WIDTH))
        raise HTTPException(status_code=400, detail=f"Thickness must be one of: {allowed}mm")

    # Re-resolve the source laminate to rebuild the description.
    source = db.query(ProjectLaminate).filter(ProjectLaminate.id == row.source_material_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source laminate no longer exists in this project")
    laminate = source.laminate

    row.thickness_mm = data.thickness_mm
    row.width_mm      = EDGE_THICKNESS_WIDTH[data.thickness_mm]
    row.description   = f"{_fmt_mm(row.thickness_mm)}mm x {int(row.width_mm)}mm PVC to match {laminate.manufacturer} {laminate.finish_name}"

    db.commit()
    db.refresh(row)
    return {"status": "ok", "edgeband": _edgeband_to_dict(row)}


# ─── REMOVE ─────────────────────────────────────────────────
@router.delete("/projects/{project_id}/edgebands/{row_id}")
def remove_project_edgeband(project_id: int, row_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _load_owned_project(project_id, db, current_user)
    require_not_viewer(current_user, "remove edgebands")

    row = db.query(ProjectEdgeband).filter(
        ProjectEdgeband.id == row_id,
        ProjectEdgeband.project_id == project_id,
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Project edgeband not found")

    db.delete(row)
    db.commit()
    return {"status": "ok", "message": f"Removed edgeband {row_id} from project"}
