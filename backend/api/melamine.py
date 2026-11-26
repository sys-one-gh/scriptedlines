# ─────────────────────────────────────────────────────────────
# api/melamine.py
#
# GET    /api/melamine/manufacturers        → distinct manufacturer list
# GET    /api/melamine/search                → search the global catalog
# GET    /api/projects/:id/melamine          → melamine added to a project
# POST   /api/projects/:id/melamine          → add a SKU to a project
# DELETE /api/projects/:id/melamine/:row_id  → remove from a project
#
# Mirrors api/laminates.py — unlike cores, manufacturer matters here
# (a melamine decor is manufacturer-specific), so it keeps the
# manufacturers endpoint + search filter laminates has.
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from database import get_db
from models.material_melamine import MaterialMelamine
from models.project_melamine import ProjectMelamine
from models.project import Project
from models.user import User, UserRole
from auth import get_current_user, require_not_viewer
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


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


def _melamine_to_dict(m: MaterialMelamine) -> dict:
    sizes = [
        label for label, flag in (
            ("4x8",  m.size_4x8),
            ("5x8",  m.size_5x8),
            ("4x10", m.size_4x10),
            ("4x12", m.size_4x12),
            ("5x12", m.size_5x12),
            ("5x10", m.size_5x10),
        ) if flag
    ]
    return {
        "melamine_id":       m.id,
        "code":              m.code,
        "manufacturer":      m.manufacturer,
        "finish_code":       m.finish_code,
        "finish_name":       m.finish_name,
        "core_substrate":    m.core_substrate,
        "thickness_mm":      m.thickness_mm,
        "texture":           m.texture,
        "is_premium_texture":m.is_premium_texture,
        "sheen":             m.sheen,
        "grain":             m.grain,
        "g_sides":           m.g_sides,
        "sizes":             sizes,
        "fr_rated":          m.fr_rated,
        "leed":              m.leed,
        "fsc":               m.fsc,
        "carb_p2":           m.carb_p2,
        "is_mto":            m.is_mto,
    }


# ─── GLOBAL CATALOG: MANUFACTURERS ────────────────────────────
@router.get("/melamine/manufacturers")
def list_manufacturers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = db.query(MaterialMelamine.manufacturer).filter(MaterialMelamine.is_active == True).distinct().order_by(MaterialMelamine.manufacturer).all()
    return {"status": "ok", "manufacturers": [r[0] for r in rows]}


# ─── GLOBAL CATALOG: SEARCH ────────────────────────────────────
@router.get("/melamine/search")
def search_melamine(
    q: Optional[str] = None,
    manufacturer: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(MaterialMelamine).filter(MaterialMelamine.is_active == True)

    if manufacturer:
        query = query.filter(MaterialMelamine.manufacturer == manufacturer)

    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(or_(
            MaterialMelamine.code.ilike(term),
            MaterialMelamine.finish_name.ilike(term),
            MaterialMelamine.finish_code.ilike(term),
        ))

    rows = query.order_by(MaterialMelamine.manufacturer, MaterialMelamine.code).limit(min(limit, 500)).all()
    return {"status": "ok", "results": [_melamine_to_dict(m) for m in rows]}


# ─── PROJECT MELAMINE: LIST ────────────────────────────────────
@router.get("/projects/{project_id}/melamine")
def list_project_melamine(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _load_owned_project(project_id, db, current_user)
    rows = db.query(ProjectMelamine).filter(ProjectMelamine.project_id == project_id).order_by(ProjectMelamine.id).all()
    return {
        "status": "ok",
        "melamine": [
            {"id": row.id, "project_code": row.project_code, "added_by": row.added_by,
             "created_at": str(row.created_at) if row.created_at else None,
             **_melamine_to_dict(row.melamine)}
            for row in rows
        ],
    }


# ─── PROJECT MELAMINE: ADD ─────────────────────────────────────
class AddProjectMelamine(BaseModel):
    melamine_id: int
    project_code: str


@router.post("/projects/{project_id}/melamine")
def add_project_melamine(project_id: int, data: AddProjectMelamine, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _load_owned_project(project_id, db, current_user)
    require_not_viewer(current_user, "add melamine")

    project_code = data.project_code.strip()
    if not project_code:
        raise HTTPException(status_code=400, detail="Project code is required")

    melamine = db.query(MaterialMelamine).filter(MaterialMelamine.id == data.melamine_id).first()
    if not melamine:
        raise HTTPException(status_code=404, detail="Melamine not found")

    existing_melamine = db.query(ProjectMelamine).filter(
        ProjectMelamine.project_id == project_id,
        ProjectMelamine.melamine_id == data.melamine_id,
    ).first()
    if existing_melamine:
        raise HTTPException(status_code=400, detail="This melamine is already added to the project")

    existing_code = db.query(ProjectMelamine).filter(
        ProjectMelamine.project_id == project_id,
        ProjectMelamine.project_code == project_code,
    ).first()
    if existing_code:
        raise HTTPException(status_code=400, detail=f"Code '{project_code}' is already used in this project")

    row = ProjectMelamine(
        project_id   = project_id,
        melamine_id  = melamine.id,
        project_code = project_code,
        added_by     = current_user.id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    return {"status": "ok", "melamine": {"id": row.id, "project_code": row.project_code, "added_by": row.added_by,
             "created_at": str(row.created_at) if row.created_at else None, **_melamine_to_dict(melamine)}}


# ─── PROJECT MELAMINE: REMOVE ───────────────────────────────────
@router.delete("/projects/{project_id}/melamine/{row_id}")
def remove_project_melamine(project_id: int, row_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _load_owned_project(project_id, db, current_user)
    require_not_viewer(current_user, "remove melamine")

    row = db.query(ProjectMelamine).filter(
        ProjectMelamine.id == row_id,
        ProjectMelamine.project_id == project_id,
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Project melamine not found")

    db.delete(row)
    db.commit()
    return {"status": "ok", "message": f"Removed melamine {row_id} from project"}
