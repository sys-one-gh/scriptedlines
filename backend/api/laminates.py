# ─────────────────────────────────────────────────────────────
# api/laminates.py
#
# GET    /api/laminates/manufacturers          → distinct manufacturer list
# GET    /api/laminates/search                 → search the global catalog
# GET    /api/projects/:id/laminates           → laminates added to a project
# POST   /api/projects/:id/laminates           → add a variant to a project
# DELETE /api/projects/:id/laminates/:row_id   → remove from a project
#
# Search/browse of the global catalog is read-only and available to any
# authenticated user. Adding/removing/listing project laminates requires
# the caller's company to own the project (see _load_owned_project).
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from database import get_db
from models.laminate import Laminate, LaminateFormica
from models.project_laminate import ProjectLaminate
from models.project_edgeband import ProjectEdgeband
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
            # Platform admins already have legitimate read access to this
            # project (GET /projects, GET /drawings/...), so there's no
            # anti-enumeration reason to hide behind a vague 404 here —
            # a clear message is strictly better UX with no info leak.
            raise HTTPException(
                status_code=403,
                detail="ScriptedLines admins have read-only access and can't edit project setup for a project outside their own company.",
            )
        raise HTTPException(status_code=404, detail="Not found")
    return project


def _variant_to_dict(variant: LaminateFormica) -> dict:
    laminate = variant.laminate
    sizes = [
        label for label, flag in (
            ("4x8",  variant.size_4x8),
            ("5x8",  variant.size_5x8),
            ("4x10", variant.size_4x10),
            ("4x12", variant.size_4x12),
            ("5x12", variant.size_5x12),
            ("5x10", variant.size_5x10),
        ) if flag
    ]
    return {
        "variant_id":     variant.id,
        "laminate_id":    laminate.id,
        "finish_code":    laminate.finish_code,
        "finish_name":    laminate.finish_name,
        "manufacturer":   laminate.manufacturer,
        "collection":     laminate.collection,
        "variant":        laminate.variant,
        "texture_code":   variant.texture_code,
        "texture_name":   variant.texture_name,
        "grade_code":     variant.grade_code,
        "thickness_in":   variant.thickness_in,
        "thickness_mm":   variant.thickness_mm,
        "sizes":          sizes,
        "notes":          variant.notes,
    }


# ─── AUTO-DERIVED EDGEBAND (see models/project_edgeband.py) ──
# Adding/removing a laminate auto-creates/removes its matching edge —
# there's no separate "add an edgeband" flow. Width is paired to
# thickness by convention; only thickness is user-editable afterward
# (see api/edgebands.py's update endpoint).
EDGE_THICKNESS_WIDTH  = {0.5: 22.0, 1.0: 28.0, 2.0: 35.0, 3.0: 42.0}
DEFAULT_EDGE_THICKNESS = 1.0


def _fmt_mm(value: float) -> str:
    return f"{value:g}"


def _edgeband_description(edge_type: str, thickness_mm, width_mm, manufacturer: str, finish_name: str, collection: str) -> str:
    if edge_type == "Color Core":
        return f"Color Core edge of {manufacturer} {finish_name} ({collection})"
    return f"{_fmt_mm(thickness_mm)}mm x {int(width_mm)}mm PVC to match {manufacturer} {finish_name}"


def _next_edgeband_code(project_id: int, db: Session) -> str:
    count = db.query(ProjectEdgeband).filter(ProjectEdgeband.project_id == project_id).count()
    return f"EB-{count + 1:02d}"


def _create_edgeband_for_laminate(project_id: int, project_laminate: ProjectLaminate, laminate: Laminate, current_user: User, db: Session):
    edge_type = "Color Core" if laminate.collection == "ColorCore2" else "PVC"
    if edge_type == "PVC":
        thickness_mm = DEFAULT_EDGE_THICKNESS
        width_mm     = EDGE_THICKNESS_WIDTH[thickness_mm]
    else:
        thickness_mm = None
        width_mm     = None

    edge = ProjectEdgeband(
        project_id            = project_id,
        project_code          = _next_edgeband_code(project_id, db),
        source_material_type  = "laminate",
        source_material_id    = project_laminate.id,
        edge_type              = edge_type,
        thickness_mm           = thickness_mm,
        width_mm                = width_mm,
        description             = _edgeband_description(edge_type, thickness_mm, width_mm, laminate.manufacturer, laminate.finish_name, laminate.collection),
        added_by                = current_user.id,
    )
    db.add(edge)
    db.commit()


# ─── GLOBAL CATALOG: MANUFACTURERS ────────────────────────────
@router.get("/laminates/manufacturers")
def list_manufacturers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = db.query(Laminate.manufacturer).filter(Laminate.is_active == True).distinct().order_by(Laminate.manufacturer).all()
    return {"status": "ok", "manufacturers": [r[0] for r in rows]}


# ─── GLOBAL CATALOG: SEARCH ────────────────────────────────────
@router.get("/laminates/search")
def search_laminates(
    q: Optional[str] = None,
    manufacturer: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(LaminateFormica).join(Laminate).filter(
        Laminate.is_active == True,
        LaminateFormica.is_active == True,
    )

    if manufacturer:
        query = query.filter(Laminate.manufacturer == manufacturer)

    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(or_(
            Laminate.finish_code.ilike(term),
            Laminate.finish_name.ilike(term),
        ))

    variants = query.order_by(Laminate.finish_name, LaminateFormica.grade_code).limit(min(limit, 500)).all()
    return {"status": "ok", "results": [_variant_to_dict(v) for v in variants]}


# ─── PROJECT LAMINATES: LIST ──────────────────────────────────
@router.get("/projects/{project_id}/laminates")
def list_project_laminates(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _load_owned_project(project_id, db, current_user)
    rows = db.query(ProjectLaminate).filter(ProjectLaminate.project_id == project_id).order_by(ProjectLaminate.id).all()
    return {
        "status": "ok",
        "laminates": [
            {"id": row.id, "project_code": row.project_code, "added_by": row.added_by,
             "created_at": str(row.created_at) if row.created_at else None,
             **_variant_to_dict(row.variant)}
            for row in rows
        ],
    }


# ─── PROJECT LAMINATES: ADD ───────────────────────────────────
class AddProjectLaminate(BaseModel):
    variant_id: int
    project_code: str


@router.post("/projects/{project_id}/laminates")
def add_project_laminate(project_id: int, data: AddProjectLaminate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _load_owned_project(project_id, db, current_user)
    require_not_viewer(current_user, "add laminates")

    project_code = data.project_code.strip()
    if not project_code:
        raise HTTPException(status_code=400, detail="Project code is required")

    variant = db.query(LaminateFormica).filter(LaminateFormica.id == data.variant_id).first()
    if not variant:
        raise HTTPException(status_code=404, detail="Laminate variant not found")

    existing_variant = db.query(ProjectLaminate).filter(
        ProjectLaminate.project_id == project_id,
        ProjectLaminate.variant_id == data.variant_id,
    ).first()
    if existing_variant:
        raise HTTPException(status_code=400, detail="This laminate is already added to the project")

    existing_code = db.query(ProjectLaminate).filter(
        ProjectLaminate.project_id == project_id,
        ProjectLaminate.project_code == project_code,
    ).first()
    if existing_code:
        raise HTTPException(status_code=400, detail=f"Code '{project_code}' is already used in this project")

    row = ProjectLaminate(
        project_id   = project_id,
        laminate_id  = variant.laminate_id,
        variant_id   = variant.id,
        project_code = project_code,
        added_by     = current_user.id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    _create_edgeband_for_laminate(project_id, row, variant.laminate, current_user, db)

    return {"status": "ok", "laminate": {"id": row.id, "project_code": row.project_code, "added_by": row.added_by,
             "created_at": str(row.created_at) if row.created_at else None, **_variant_to_dict(variant)}}


# ─── PROJECT LAMINATES: REMOVE ─────────────────────────────────
@router.delete("/projects/{project_id}/laminates/{row_id}")
def remove_project_laminate(project_id: int, row_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _load_owned_project(project_id, db, current_user)
    require_not_viewer(current_user, "remove laminates")

    row = db.query(ProjectLaminate).filter(
        ProjectLaminate.id == row_id,
        ProjectLaminate.project_id == project_id,
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Project laminate not found")

    # The auto-derived edge only exists because this laminate does.
    db.query(ProjectEdgeband).filter(
        ProjectEdgeband.project_id == project_id,
        ProjectEdgeband.source_material_type == "laminate",
        ProjectEdgeband.source_material_id == row_id,
    ).delete()

    db.delete(row)
    db.commit()
    return {"status": "ok", "message": f"Removed laminate {row_id} from project"}
