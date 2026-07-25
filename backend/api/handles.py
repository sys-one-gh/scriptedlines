# ─────────────────────────────────────────────────────────────
# api/handles.py
#
# GET    /api/handles/manufacturers        → distinct manufacturer list
# GET    /api/handles/search                → search the global catalog
# GET    /api/projects/:id/handles          → handles added to a project
# POST   /api/projects/:id/handles          → add a handle to a project
# DELETE /api/projects/:id/handles/:row_id  → remove from a project
#
# Search/browse of the global catalog is read-only and available to any
# authenticated user. Adding/removing/listing project handles requires
# the caller's company to own the project (see _load_owned_project).
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from database import get_db
from models.library_handles import LibraryHandle
from models.project_handle import ProjectHandle
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


def _handle_to_dict(handle: LibraryHandle) -> dict:
    return {
        "handle_id":           handle.id,
        "code":                handle.code,
        "manufacturer":        handle.manufacturer,
        "style":               handle.style,
        "center_to_center_mm": handle.center_to_center_mm,
        "projection_mm":       handle.projection_mm,
        "finish":              handle.finish,
        "material":            handle.material,
        "mounting_holes":      handle.mounting_holes,
        "cost_each":           handle.cost_each,
        "lead_time":           handle.lead_time,
    }


# ─── GLOBAL CATALOG: MANUFACTURERS ────────────────────────────
@router.get("/handles/manufacturers")
def list_manufacturers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = db.query(LibraryHandle.manufacturer).filter(LibraryHandle.is_active == True).distinct().order_by(LibraryHandle.manufacturer).all()
    return {"status": "ok", "manufacturers": [r[0] for r in rows]}


# ─── GLOBAL CATALOG: SEARCH ────────────────────────────────────
@router.get("/handles/search")
def search_handles(
    q: Optional[str] = None,
    manufacturer: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(LibraryHandle).filter(LibraryHandle.is_active == True)

    if manufacturer:
        query = query.filter(LibraryHandle.manufacturer == manufacturer)

    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(or_(
            LibraryHandle.code.ilike(term),
            LibraryHandle.style.ilike(term),
            LibraryHandle.finish.ilike(term),
        ))

    handles = query.order_by(LibraryHandle.manufacturer, LibraryHandle.code).limit(min(limit, 500)).all()
    return {"status": "ok", "results": [_handle_to_dict(h) for h in handles]}


# ─── PROJECT HANDLES: LIST ─────────────────────────────────────
@router.get("/projects/{project_id}/handles")
def list_project_handles(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _load_owned_project(project_id, db, current_user)
    rows = db.query(ProjectHandle).filter(ProjectHandle.project_id == project_id).order_by(ProjectHandle.id).all()
    return {
        "status": "ok",
        "handles": [
            {"id": row.id, "project_code": row.project_code, "added_by": row.added_by,
             "created_at": str(row.created_at) if row.created_at else None,
             **_handle_to_dict(row.handle)}
            for row in rows
        ],
    }


# ─── PROJECT HANDLES: ADD ──────────────────────────────────────
class AddProjectHandle(BaseModel):
    handle_id: int
    project_code: str


@router.post("/projects/{project_id}/handles")
def add_project_handle(project_id: int, data: AddProjectHandle, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _load_owned_project(project_id, db, current_user)
    require_not_viewer(current_user, "add handles")

    project_code = data.project_code.strip()
    if not project_code:
        raise HTTPException(status_code=400, detail="Project code is required")

    handle = db.query(LibraryHandle).filter(LibraryHandle.id == data.handle_id).first()
    if not handle:
        raise HTTPException(status_code=404, detail="Handle not found")

    existing_handle = db.query(ProjectHandle).filter(
        ProjectHandle.project_id == project_id,
        ProjectHandle.handle_id == data.handle_id,
    ).first()
    if existing_handle:
        raise HTTPException(status_code=400, detail="This handle is already added to the project")

    existing_code = db.query(ProjectHandle).filter(
        ProjectHandle.project_id == project_id,
        ProjectHandle.project_code == project_code,
    ).first()
    if existing_code:
        raise HTTPException(status_code=400, detail=f"Code '{project_code}' is already used in this project")

    row = ProjectHandle(
        project_id   = project_id,
        handle_id    = handle.id,
        project_code = project_code,
        added_by     = current_user.id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    return {"status": "ok", "handle": {"id": row.id, "project_code": row.project_code, "added_by": row.added_by,
             "created_at": str(row.created_at) if row.created_at else None, **_handle_to_dict(handle)}}


# ─── PROJECT HANDLES: REMOVE ────────────────────────────────────
@router.delete("/projects/{project_id}/handles/{row_id}")
def remove_project_handle(project_id: int, row_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _load_owned_project(project_id, db, current_user)
    require_not_viewer(current_user, "remove handles")

    row = db.query(ProjectHandle).filter(
        ProjectHandle.id == row_id,
        ProjectHandle.project_id == project_id,
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Project handle not found")

    db.delete(row)
    db.commit()
    return {"status": "ok", "message": f"Removed handle {row_id} from project"}
