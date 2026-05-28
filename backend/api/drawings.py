# ─────────────────────────────────────────────────────────────
# api/drawings.py
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.drawing import Drawing, PaperSize, DrawingStatus
from models.project import Project
from pydantic import BaseModel
from typing import Optional, Any
import re

router = APIRouter()

DRAWING_NUMBER_RE = re.compile(r"^D[0-9]{4}$")


# ─── SCHEMAS ─────────────────────────────────────────────────

class DrawingCreate(BaseModel):
    project_id:       int
    created_by:       int
    drawing_number:   str
    mw_number:        Optional[str] = ""
    title:            str
    level:            Optional[str] = ""
    location:         Optional[str] = ""
    arch_ref:         Optional[str] = ""
    item_description: Optional[str] = ""
    scale:            Optional[str] = "1:20"
    paper_size:       Optional[str] = "Arch_D"


class DrawingUpdate(BaseModel):
    drawing_number:    Optional[str]  = None
    title:             Optional[str]  = None
    revision:          Optional[str]  = None
    level:             Optional[str]  = None
    location:          Optional[str]  = None
    arch_ref:          Optional[str]  = None
    item_description:  Optional[str]  = None
    scale:             Optional[str]  = None
    paper_size:        Optional[str]  = None
    svg_data:          Optional[Any]  = None
    status:            Optional[str]  = None
    for_client_review: Optional[bool] = None
    for_production:    Optional[bool] = None
    qty:               Optional[int]  = None
    total_pages:       Optional[int]  = None


def drawing_to_dict(d: Drawing, include_relations: bool = False) -> dict:
    result = {
        "id":               d.id,
        "project_id":       d.project_id,
        "created_by":       d.created_by,
        "drawing_number":   d.drawing_number,
        "mw_number":        d.mw_number,
        "title":            d.title,
        "revision":         d.revision,
        "level":            d.level,
        "location":         d.location,
        "arch_ref":         d.arch_ref,
        "item_description": d.item_description,
        "scale":            d.scale,
        "paper_size":       d.paper_size.value if d.paper_size else None,
        "page_number":      d.page_number,
        "total_pages":      d.total_pages,
        "status":           d.status.value if d.status else None,
        "for_client_review": d.for_client_review,
        "for_production":   d.for_production,
        "qty":              d.qty,
        "bom_generated_at": str(d.bom_generated_at) if d.bom_generated_at else None,
        "created_at":       str(d.created_at) if d.created_at else None,
        "updated_at":       str(d.updated_at) if d.updated_at else None,
    }
    if include_relations:
        result["svg_data"] = d.svg_data
        result["products"] = [
            {
                "id":            p.id,
                "instance_code": p.instance_code,
                "product_id":    p.product_id,
                "x": p.x, "y": p.y, "rotation": p.rotation,
                "width": p.width, "height": p.height, "depth": p.depth,
                "doors": p.doors, "drawers": p.drawers, "shelves": p.shelves,
                "label": p.label, "notes_on_drawing": p.notes_on_drawing,
            }
            for p in d.products if p.is_active
        ]
    return result


def _recalculate_pages(project_id: int, db: Session):
    """After any create/delete, reassign page_number 1,2,3... and sync total_pages."""
    drawings = db.query(Drawing).filter(
        Drawing.project_id == project_id,
    ).order_by(Drawing.id).all()

    total = len(drawings)
    for i, d in enumerate(drawings, start=1):
        d.page_number = i
        d.total_pages = total
    db.commit()


# ─── CREATE ──────────────────────────────────────────────────
@router.post("/drawings")
def create_drawing(data: DrawingCreate, db: Session = Depends(get_db)):

    project = db.query(Project).filter(Project.id == data.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not DRAWING_NUMBER_RE.match(data.drawing_number.upper()):
        raise HTTPException(
            status_code=400,
            detail="Drawing number must be D followed by 4 digits (e.g. D9501)."
        )
    data.drawing_number = data.drawing_number.upper()

    try:
        paper_size = PaperSize[data.paper_size] if data.paper_size else PaperSize.Arch_D
    except KeyError:
        raise HTTPException(status_code=400, detail=f"Invalid paper_size: {data.paper_size}")

    existing_count = db.query(Drawing).filter(
        Drawing.project_id == data.project_id
    ).count()

    drawing = Drawing(
        project_id       = data.project_id,
        created_by       = data.created_by,
        drawing_number   = data.drawing_number,
        mw_number        = data.mw_number        or "",
        title            = data.title,
        level            = data.level            or "",
        location         = data.location         or "",
        arch_ref         = data.arch_ref         or "",
        item_description = data.item_description or "",
        scale            = data.scale            or "1:20",
        paper_size       = paper_size,
        page_number      = existing_count + 1,
        total_pages      = existing_count + 1,
        status           = DrawingStatus.draft,
    )

    db.add(drawing)
    db.commit()
    db.refresh(drawing)

    _recalculate_pages(data.project_id, db)
    db.refresh(drawing)

    return {"status": "ok", "drawing": drawing_to_dict(drawing)}


# ─── LIST FOR PROJECT ────────────────────────────────────────
@router.get("/drawings/project/{project_id}")
def list_drawings(project_id: int, db: Session = Depends(get_db)):

    drawings = db.query(Drawing).filter(
        Drawing.project_id == project_id,
    ).order_by(Drawing.page_number).all()

    return {
        "status":   "ok",
        "drawings": [drawing_to_dict(d) for d in drawings],
    }


# ─── GET SINGLE ──────────────────────────────────────────────
@router.get("/drawings/{drawing_id}")
def get_drawing(drawing_id: int, db: Session = Depends(get_db)):

    drawing = db.query(Drawing).filter(Drawing.id == drawing_id).first()
    if not drawing:
        raise HTTPException(status_code=404, detail="Drawing not found")

    return {"status": "ok", "drawing": drawing_to_dict(drawing, include_relations=True)}


# ─── UPDATE ──────────────────────────────────────────────────
@router.put("/drawings/{drawing_id}")
def update_drawing(drawing_id: int, data: DrawingUpdate, db: Session = Depends(get_db)):

    drawing = db.query(Drawing).filter(Drawing.id == drawing_id).first()
    if not drawing:
        raise HTTPException(status_code=404, detail="Drawing not found")

    updates = data.model_dump(exclude_none=True)

    if "paper_size" in updates:
        try:
            drawing.paper_size = PaperSize[updates.pop("paper_size")]
        except KeyError:
            raise HTTPException(status_code=400, detail="Invalid paper_size")

    if "status" in updates:
        try:
            drawing.status = DrawingStatus[updates.pop("status")]
        except KeyError:
            raise HTTPException(status_code=400, detail="Invalid status")

    for field, value in updates.items():
        setattr(drawing, field, value)

    db.commit()
    db.refresh(drawing)

    return {"status": "ok", "drawing": drawing_to_dict(drawing)}


# ─── HARD DELETE ─────────────────────────────────────────────
@router.delete("/drawings/{drawing_id}")
def delete_drawing(drawing_id: int, db: Session = Depends(get_db)):

    drawing = db.query(Drawing).filter(Drawing.id == drawing_id).first()
    if not drawing:
        raise HTTPException(status_code=404, detail="Drawing not found")

    project_id = drawing.project_id

    # Hard delete — remove row and all related data (cascade handles children)
    db.delete(drawing)
    db.commit()

    # Reassign page numbers on remaining drawings
    _recalculate_pages(project_id, db)

    return {"status": "ok", "message": f"Drawing {drawing_id} deleted"}