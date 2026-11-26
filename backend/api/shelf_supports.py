# ─────────────────────────────────────────────────────────────
# api/shelf_supports.py
#
# GET    /api/shelf-supports/manufacturers        → distinct manufacturer list
# GET    /api/shelf-supports/search               → search the global catalog
# GET    /api/projects/:id/shelf-supports         → supports added to a project
# POST   /api/projects/:id/shelf-supports         → add a support to a project
# DELETE /api/projects/:id/shelf-supports/:row_id → remove from a project
#
# Search/browse of the global catalog is read-only and available to any
# authenticated user. Adding/removing/listing project shelf supports
# requires the caller's company to own the project (see _load_owned_project).
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from database import get_db
from models.library_shelf_supports import LibraryShelfSupport
from models.project_shelf_support import ProjectShelfSupport
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


def _support_to_dict(support: LibraryShelfSupport) -> dict:
    return {
        "shelf_support_id": support.id,
        "code":              support.code,
        "manufacturer":      support.manufacturer,
        "style":             support.style,
        "diameter_mm":       support.diameter_mm,
        "material":          support.material,
        "finish":            support.finish,
        "has_stop":          support.has_stop,
        "cost_per_100":      support.cost_per_100,
        "lead_time":         support.lead_time,
    }


# ─── GLOBAL CATALOG: MANUFACTURERS ────────────────────────────
@router.get("/shelf-supports/manufacturers")
def list_manufacturers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = db.query(LibraryShelfSupport.manufacturer).filter(LibraryShelfSupport.is_active == True).distinct().order_by(LibraryShelfSupport.manufacturer).all()
    return {"status": "ok", "manufacturers": [r[0] for r in rows]}


# ─── GLOBAL CATALOG: SEARCH ────────────────────────────────────
@router.get("/shelf-supports/search")
def search_shelf_supports(
    q: Optional[str] = None,
    manufacturer: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(LibraryShelfSupport).filter(LibraryShelfSupport.is_active == True)

    if manufacturer:
        query = query.filter(LibraryShelfSupport.manufacturer == manufacturer)

    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(or_(
            LibraryShelfSupport.code.ilike(term),
            LibraryShelfSupport.style.ilike(term),
        ))

    supports = query.order_by(LibraryShelfSupport.manufacturer, LibraryShelfSupport.code).limit(min(limit, 500)).all()
    return {"status": "ok", "results": [_support_to_dict(s) for s in supports]}


# ─── PROJECT SHELF SUPPORTS: LIST ─────────────────────────────
@router.get("/projects/{project_id}/shelf-supports")
def list_project_shelf_supports(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _load_owned_project(project_id, db, current_user)
    rows = db.query(ProjectShelfSupport).filter(ProjectShelfSupport.project_id == project_id).order_by(ProjectShelfSupport.id).all()
    return {
        "status": "ok",
        "shelf_supports": [
            {"id": row.id, "project_code": row.project_code, "added_by": row.added_by,
             "created_at": str(row.created_at) if row.created_at else None,
             **_support_to_dict(row.shelf_support)}
            for row in rows
        ],
    }


# ─── PROJECT SHELF SUPPORTS: ADD ──────────────────────────────
class AddProjectShelfSupport(BaseModel):
    shelf_support_id: int
    project_code: str


@router.post("/projects/{project_id}/shelf-supports")
def add_project_shelf_support(project_id: int, data: AddProjectShelfSupport, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _load_owned_project(project_id, db, current_user)
    require_not_viewer(current_user, "add shelf supports")

    project_code = data.project_code.strip()
    if not project_code:
        raise HTTPException(status_code=400, detail="Project code is required")

    support = db.query(LibraryShelfSupport).filter(LibraryShelfSupport.id == data.shelf_support_id).first()
    if not support:
        raise HTTPException(status_code=404, detail="Shelf support not found")

    existing_support = db.query(ProjectShelfSupport).filter(
        ProjectShelfSupport.project_id == project_id,
        ProjectShelfSupport.shelf_support_id == data.shelf_support_id,
    ).first()
    if existing_support:
        raise HTTPException(status_code=400, detail="This shelf support is already added to the project")

    existing_code = db.query(ProjectShelfSupport).filter(
        ProjectShelfSupport.project_id == project_id,
        ProjectShelfSupport.project_code == project_code,
    ).first()
    if existing_code:
        raise HTTPException(status_code=400, detail=f"Code '{project_code}' is already used in this project")

    row = ProjectShelfSupport(
        project_id       = project_id,
        shelf_support_id = support.id,
        project_code     = project_code,
        added_by         = current_user.id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    return {"status": "ok", "shelf_support": {"id": row.id, "project_code": row.project_code, "added_by": row.added_by,
             "created_at": str(row.created_at) if row.created_at else None, **_support_to_dict(support)}}


# ─── PROJECT SHELF SUPPORTS: REMOVE ────────────────────────────
@router.delete("/projects/{project_id}/shelf-supports/{row_id}")
def remove_project_shelf_support(project_id: int, row_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _load_owned_project(project_id, db, current_user)
    require_not_viewer(current_user, "remove shelf supports")

    row = db.query(ProjectShelfSupport).filter(
        ProjectShelfSupport.id == row_id,
        ProjectShelfSupport.project_id == project_id,
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Project shelf support not found")

    db.delete(row)
    db.commit()
    return {"status": "ok", "message": f"Removed shelf support {row_id} from project"}
