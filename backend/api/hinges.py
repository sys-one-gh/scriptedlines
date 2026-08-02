# ─────────────────────────────────────────────────────────────
# api/hinges.py
#
# GET    /api/hinges/manufacturers         → distinct manufacturer list
# GET    /api/hinges/search                → search the global catalog
# GET    /api/projects/:id/hinges          → hinges added to a project
# POST   /api/projects/:id/hinges          → add a hinge to a project
# DELETE /api/projects/:id/hinges/:row_id  → remove from a project
#
# Search/browse of the global catalog is read-only and available to any
# authenticated user. Adding/removing/listing project hinges requires
# the caller's company to own the project (see _load_owned_project).
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from database import get_db
from models.library_hinges import LibraryHinge
from models.project_hinge import ProjectHinge
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


def _hinge_to_dict(hinge: LibraryHinge) -> dict:
    return {
        "hinge_id":                  hinge.id,
        "code":                      hinge.code,
        "manufacturer":              hinge.manufacturer,
        "product_line":              hinge.product_line,
        "application":               hinge.application,
        "cabinet_type":              hinge.cabinet_type,
        "cabinet_thickness_min_mm":  hinge.cabinet_thickness_min_mm,
        "overlay_type":              hinge.overlay_type,
        "opening_angle_deg":         hinge.opening_angle_deg,
        "mechanism":                 hinge.mechanism,
        "soft_close":                hinge.soft_close,
        "fixing_type":               hinge.fixing_type,
        "milling_diameter_mm":       hinge.milling_diameter_mm,
        "milling_depth_mm":          hinge.milling_depth_mm,
        "door_thickness_min_mm":     hinge.door_thickness_min_mm,
        "door_thickness_max_mm":     hinge.door_thickness_max_mm,
        "material":                  hinge.material,
        "finish":                    hinge.finish,
        "cost_per_pair":             hinge.cost_per_pair,
        "lead_time":                 hinge.lead_time,
    }


# ─── GLOBAL CATALOG: MANUFACTURERS ────────────────────────────
@router.get("/hinges/manufacturers")
def list_manufacturers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = db.query(LibraryHinge.manufacturer).filter(LibraryHinge.is_active == True).distinct().order_by(LibraryHinge.manufacturer).all()
    return {"status": "ok", "manufacturers": [r[0] for r in rows]}


# ─── GLOBAL CATALOG: SEARCH ────────────────────────────────────
@router.get("/hinges/search")
def search_hinges(
    q: Optional[str] = None,
    manufacturer: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(LibraryHinge).filter(LibraryHinge.is_active == True)

    if manufacturer:
        query = query.filter(LibraryHinge.manufacturer == manufacturer)

    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(or_(
            LibraryHinge.code.ilike(term),
            LibraryHinge.product_line.ilike(term),
            LibraryHinge.overlay_type.ilike(term),
        ))

    hinges = query.order_by(LibraryHinge.manufacturer, LibraryHinge.code).limit(min(limit, 500)).all()
    return {"status": "ok", "results": [_hinge_to_dict(h) for h in hinges]}


# ─── PROJECT HINGES: LIST ──────────────────────────────────────
@router.get("/projects/{project_id}/hinges")
def list_project_hinges(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _load_owned_project(project_id, db, current_user)
    rows = db.query(ProjectHinge).filter(ProjectHinge.project_id == project_id).order_by(ProjectHinge.id).all()
    return {
        "status": "ok",
        "hinges": [
            {"id": row.id, "project_code": row.project_code, "added_by": row.added_by,
             "created_at": str(row.created_at) if row.created_at else None,
             **_hinge_to_dict(row.hinge)}
            for row in rows
        ],
    }


# ─── PROJECT HINGES: ADD ───────────────────────────────────────
class AddProjectHinge(BaseModel):
    hinge_id: int
    project_code: str


@router.post("/projects/{project_id}/hinges")
def add_project_hinge(project_id: int, data: AddProjectHinge, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _load_owned_project(project_id, db, current_user)
    require_not_viewer(current_user, "add hinges")

    project_code = data.project_code.strip()
    if not project_code:
        raise HTTPException(status_code=400, detail="Project code is required")

    hinge = db.query(LibraryHinge).filter(LibraryHinge.id == data.hinge_id).first()
    if not hinge:
        raise HTTPException(status_code=404, detail="Hinge not found")

    existing_hinge = db.query(ProjectHinge).filter(
        ProjectHinge.project_id == project_id,
        ProjectHinge.hinge_id == data.hinge_id,
    ).first()
    if existing_hinge:
        raise HTTPException(status_code=400, detail="This hinge is already added to the project")

    existing_code = db.query(ProjectHinge).filter(
        ProjectHinge.project_id == project_id,
        ProjectHinge.project_code == project_code,
    ).first()
    if existing_code:
        raise HTTPException(status_code=400, detail=f"Code '{project_code}' is already used in this project")

    row = ProjectHinge(
        project_id   = project_id,
        hinge_id     = hinge.id,
        project_code = project_code,
        added_by     = current_user.id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    return {"status": "ok", "hinge": {"id": row.id, "project_code": row.project_code, "added_by": row.added_by,
             "created_at": str(row.created_at) if row.created_at else None, **_hinge_to_dict(hinge)}}


# ─── PROJECT HINGES: REMOVE ─────────────────────────────────────
@router.delete("/projects/{project_id}/hinges/{row_id}")
def remove_project_hinge(project_id: int, row_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _load_owned_project(project_id, db, current_user)
    require_not_viewer(current_user, "remove hinges")

    row = db.query(ProjectHinge).filter(
        ProjectHinge.id == row_id,
        ProjectHinge.project_id == project_id,
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Project hinge not found")

    db.delete(row)
    db.commit()
    return {"status": "ok", "message": f"Removed hinge {row_id} from project"}
