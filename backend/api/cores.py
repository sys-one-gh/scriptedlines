# ─────────────────────────────────────────────────────────────
# api/cores.py
#
# GET    /api/cores/search                 → search the global catalog
# GET    /api/projects/:id/cores           → cores added to a project
# POST   /api/projects/:id/cores           → add a core to a project
# DELETE /api/projects/:id/cores/:row_id   → remove from a project
#
# No manufacturer field/endpoint — unlike laminates, a core is a
# commodity spec any vendor can supply, so there's nothing to filter by.
# Search/browse of the global catalog is read-only and available to any
# authenticated user. Adding/removing/listing project cores requires
# the caller's company to own the project (see _load_owned_project).
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from database import get_db
from models.material_core import MaterialCore
from models.project_core import ProjectCore
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


def _core_to_dict(core: MaterialCore) -> dict:
    sizes = [
        label for label, flag in (
            ("4x8",  core.size_4x8),
            ("5x8",  core.size_5x8),
            ("4x10", core.size_4x10),
            ("4x12", core.size_4x12),
            ("5x12", core.size_5x12),
            ("5x10", core.size_5x10),
            ("5x5",  core.size_5x5),
        ) if flag
    ]
    return {
        "core_id":         core.id,
        "code":            core.code,
        "description":     core.description,
        "substrate_type":  core.substrate_type,
        "sizes":           sizes,
        "thickness_mm":    core.thickness_mm,
        "core_color":      core.core_color,
        "grain":           core.grain,
        "fr_rated":        core.fr_rated,
        "leed":            core.leed,
        "fsc":             core.fsc,
        "exterior_grade":  core.exterior_grade,
        "carb_p2":         core.carb_p2,
    }


# ─── GLOBAL CATALOG: SUBSTRATE TYPES ───────────────────────────
# Replaces the old manufacturers filter — substrate is the meaningful
# way to narrow cores now that manufacturer no longer applies.
@router.get("/cores/substrate-types")
def list_substrate_types(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = db.query(MaterialCore.substrate_type).filter(MaterialCore.is_active == True).distinct().order_by(MaterialCore.substrate_type).all()
    return {"status": "ok", "substrate_types": [r[0] for r in rows]}


# ─── GLOBAL CATALOG: SEARCH ────────────────────────────────────
@router.get("/cores/search")
def search_cores(
    q: Optional[str] = None,
    substrate_type: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(MaterialCore).filter(MaterialCore.is_active == True)

    if substrate_type:
        query = query.filter(MaterialCore.substrate_type == substrate_type)

    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(or_(
            MaterialCore.code.ilike(term),
            MaterialCore.description.ilike(term),
        ))

    cores = query.order_by(MaterialCore.substrate_type, MaterialCore.code).limit(min(limit, 500)).all()
    return {"status": "ok", "results": [_core_to_dict(c) for c in cores]}


# ─── PROJECT CORES: LIST ──────────────────────────────────────
@router.get("/projects/{project_id}/cores")
def list_project_cores(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _load_owned_project(project_id, db, current_user)
    rows = db.query(ProjectCore).filter(ProjectCore.project_id == project_id).order_by(ProjectCore.id).all()
    return {
        "status": "ok",
        "cores": [
            {"id": row.id, "project_code": row.project_code, "added_by": row.added_by,
             "created_at": str(row.created_at) if row.created_at else None,
             **_core_to_dict(row.core)}
            for row in rows
        ],
    }


# ─── PROJECT CORES: ADD ───────────────────────────────────────
class AddProjectCore(BaseModel):
    core_id: int
    project_code: str


@router.post("/projects/{project_id}/cores")
def add_project_core(project_id: int, data: AddProjectCore, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _load_owned_project(project_id, db, current_user)
    require_not_viewer(current_user, "add cores")

    project_code = data.project_code.strip()
    if not project_code:
        raise HTTPException(status_code=400, detail="Project code is required")

    core = db.query(MaterialCore).filter(MaterialCore.id == data.core_id).first()
    if not core:
        raise HTTPException(status_code=404, detail="Core not found")

    existing_core = db.query(ProjectCore).filter(
        ProjectCore.project_id == project_id,
        ProjectCore.core_id == data.core_id,
    ).first()
    if existing_core:
        raise HTTPException(status_code=400, detail="This core is already added to the project")

    existing_code = db.query(ProjectCore).filter(
        ProjectCore.project_id == project_id,
        ProjectCore.project_code == project_code,
    ).first()
    if existing_code:
        raise HTTPException(status_code=400, detail=f"Code '{project_code}' is already used in this project")

    row = ProjectCore(
        project_id   = project_id,
        core_id      = core.id,
        project_code = project_code,
        added_by     = current_user.id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    return {"status": "ok", "core": {"id": row.id, "project_code": row.project_code, "added_by": row.added_by,
             "created_at": str(row.created_at) if row.created_at else None, **_core_to_dict(core)}}


# ─── PROJECT CORES: REMOVE ─────────────────────────────────────
@router.delete("/projects/{project_id}/cores/{row_id}")
def remove_project_core(project_id: int, row_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _load_owned_project(project_id, db, current_user)
    require_not_viewer(current_user, "remove cores")

    row = db.query(ProjectCore).filter(
        ProjectCore.id == row_id,
        ProjectCore.project_id == project_id,
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Project core not found")

    db.delete(row)
    db.commit()
    return {"status": "ok", "message": f"Removed core {row_id} from project"}
