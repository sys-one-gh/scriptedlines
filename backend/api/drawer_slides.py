# ─────────────────────────────────────────────────────────────
# api/drawer_slides.py
#
# GET    /api/drawer-slides/manufacturers         → distinct manufacturer list
# GET    /api/drawer-slides/search                → search the global catalog
# GET    /api/projects/:id/drawer-slides          → slides added to a project
# POST   /api/projects/:id/drawer-slides          → add a slide to a project
# DELETE /api/projects/:id/drawer-slides/:row_id  → remove from a project
#
# Search/browse of the global catalog is read-only and available to any
# authenticated user. Adding/removing/listing project drawer slides
# requires the caller's company to own the project (see _load_owned_project).
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from database import get_db
from models.library_drawer_slides import LibraryDrawerSlide
from models.project_drawer_slide import ProjectDrawerSlide
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


def _slide_to_dict(slide: LibraryDrawerSlide) -> dict:
    return {
        "drawer_slide_id":              slide.id,
        "code":                         slide.code,
        "manufacturer":                 slide.manufacturer,
        "product_line":                 slide.product_line,
        "mounting_type":                slide.mounting_type,
        "extension_type":               slide.extension_type,
        "length_mm":                    slide.length_mm,
        "length_label":                 slide.length_label,
        "runner_length_mm":             slide.runner_length_mm,
        "cabinet_depth_mm":             slide.cabinet_depth_mm,
        "min_cabinet_depth_mm":         slide.min_cabinet_depth_mm,
        "max_cabinet_depth_mm":         slide.max_cabinet_depth_mm,
        "load_capacity_lbs":            slide.load_capacity_lbs,
        "max_drawer_side_thickness_mm": slide.max_drawer_side_thickness_mm,
        "slide_thickness_mm":           slide.slide_thickness_mm,
        "slide_height_mm":              slide.slide_height_mm,
        "soft_close":                   slide.soft_close,
        "material":                     slide.material,
        "finish":                       slide.finish,
        "cost_per_pair":                slide.cost_per_pair,
        "lead_time":                    slide.lead_time,
    }


# ─── GLOBAL CATALOG: MANUFACTURERS ────────────────────────────
@router.get("/drawer-slides/manufacturers")
def list_manufacturers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = db.query(LibraryDrawerSlide.manufacturer).filter(LibraryDrawerSlide.is_active == True).distinct().order_by(LibraryDrawerSlide.manufacturer).all()
    return {"status": "ok", "manufacturers": [r[0] for r in rows]}


# ─── GLOBAL CATALOG: SEARCH ────────────────────────────────────
@router.get("/drawer-slides/search")
def search_drawer_slides(
    q: Optional[str] = None,
    manufacturer: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(LibraryDrawerSlide).filter(LibraryDrawerSlide.is_active == True)

    if manufacturer:
        query = query.filter(LibraryDrawerSlide.manufacturer == manufacturer)

    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(or_(
            LibraryDrawerSlide.code.ilike(term),
            LibraryDrawerSlide.product_line.ilike(term),
            LibraryDrawerSlide.length_label.ilike(term),
        ))

    slides = query.order_by(LibraryDrawerSlide.manufacturer, LibraryDrawerSlide.length_mm).limit(min(limit, 500)).all()
    return {"status": "ok", "results": [_slide_to_dict(s) for s in slides]}


# ─── PROJECT DRAWER SLIDES: LIST ──────────────────────────────
@router.get("/projects/{project_id}/drawer-slides")
def list_project_drawer_slides(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _load_owned_project(project_id, db, current_user)
    rows = db.query(ProjectDrawerSlide).filter(ProjectDrawerSlide.project_id == project_id).order_by(ProjectDrawerSlide.id).all()
    return {
        "status": "ok",
        "drawer_slides": [
            {"id": row.id, "project_code": row.project_code, "added_by": row.added_by,
             "created_at": str(row.created_at) if row.created_at else None,
             **_slide_to_dict(row.drawer_slide)}
            for row in rows
        ],
    }


# ─── PROJECT DRAWER SLIDES: ADD ───────────────────────────────
class AddProjectDrawerSlide(BaseModel):
    drawer_slide_id: int
    project_code: str


@router.post("/projects/{project_id}/drawer-slides")
def add_project_drawer_slide(project_id: int, data: AddProjectDrawerSlide, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _load_owned_project(project_id, db, current_user)
    require_not_viewer(current_user, "add drawer slides")

    project_code = data.project_code.strip()
    if not project_code:
        raise HTTPException(status_code=400, detail="Project code is required")

    slide = db.query(LibraryDrawerSlide).filter(LibraryDrawerSlide.id == data.drawer_slide_id).first()
    if not slide:
        raise HTTPException(status_code=404, detail="Drawer slide not found")

    existing_slide = db.query(ProjectDrawerSlide).filter(
        ProjectDrawerSlide.project_id == project_id,
        ProjectDrawerSlide.drawer_slide_id == data.drawer_slide_id,
    ).first()
    if existing_slide:
        raise HTTPException(status_code=400, detail="This drawer slide is already added to the project")

    existing_code = db.query(ProjectDrawerSlide).filter(
        ProjectDrawerSlide.project_id == project_id,
        ProjectDrawerSlide.project_code == project_code,
    ).first()
    if existing_code:
        raise HTTPException(status_code=400, detail=f"Code '{project_code}' is already used in this project")

    row = ProjectDrawerSlide(
        project_id      = project_id,
        drawer_slide_id = slide.id,
        project_code    = project_code,
        added_by        = current_user.id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    return {"status": "ok", "drawer_slide": {"id": row.id, "project_code": row.project_code, "added_by": row.added_by,
             "created_at": str(row.created_at) if row.created_at else None, **_slide_to_dict(slide)}}


# ─── PROJECT DRAWER SLIDES: REMOVE ─────────────────────────────
@router.delete("/projects/{project_id}/drawer-slides/{row_id}")
def remove_project_drawer_slide(project_id: int, row_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _load_owned_project(project_id, db, current_user)
    require_not_viewer(current_user, "remove drawer slides")

    row = db.query(ProjectDrawerSlide).filter(
        ProjectDrawerSlide.id == row_id,
        ProjectDrawerSlide.project_id == project_id,
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Project drawer slide not found")

    db.delete(row)
    db.commit()
    return {"status": "ok", "message": f"Removed drawer slide {row_id} from project"}
