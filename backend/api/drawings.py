# ─────────────────────────────────────────────────────────────
# api/drawings.py
#
# Drawing API routes.
# POST   /api/drawings                    → create drawing
# GET    /api/drawings/project/:id        → all drawings for project
# GET    /api/drawings/:id                → single drawing with all data
# PUT    /api/drawings/:id                → update drawing
# DELETE /api/drawings/:id                → soft delete
#
# On creation, automatically:
#   - Calculates and sets page_number
#   - Updates total_pages on all drawings in the project
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.drawing import Drawing, PaperSize, DrawingStatus
from models.project import Project
from pydantic import BaseModel
from typing import Optional, Any

router = APIRouter()


# ─── SCHEMAS ─────────────────────────────────────────────────

# Drawing number validation: D + exactly 4 digits e.g. D9501
import re
DRAWING_NUMBER_RE = re.compile(r"^D[0-9]{4}$")

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
    drawing_number:   Optional[str] = None
    title:            Optional[str] = None
    revision:         Optional[str] = None
    level:            Optional[str] = None
    location:         Optional[str] = None
    arch_ref:         Optional[str] = None
    item_description: Optional[str] = None
    scale:            Optional[str] = None
    paper_size:       Optional[str] = None
    svg_data:         Optional[Any] = None
    status:           Optional[str] = None
    for_client_review: Optional[bool] = None
    for_production:    Optional[bool] = None
    qty:               Optional[int]  = None


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
        result["bom_products"]   = [{"id": b.id, "instance_code": b.instance_code, "product_name": b.product_name, "quantity": b.quantity} for b in d.bom_products]
        result["bom_hardware"]   = [{"id": b.id, "code": b.code, "description": b.description, "quantity": b.quantity} for b in d.bom_hardware]
        result["bom_sheetgoods"] = [{"id": b.id, "material_code": b.material_code, "description": b.description, "quantity_sheets": b.quantity_sheets} for b in d.bom_sheetgoods]
        result["bom_edgeband"]   = [{"id": b.id, "code": b.code, "description": b.description, "total_length_mm": b.total_length_mm} for b in d.bom_edgeband]
        result["bom_parts"]      = [{"id": b.id, "part_number": b.part_number, "description": b.description, "quantity": b.quantity} for b in d.bom_parts]

    return result


def _update_total_pages(project_id: int, db: Session):
    """Recalculates and updates total_pages on all drawings in a project."""
    drawings = db.query(Drawing).filter(
        Drawing.project_id == project_id,
        Drawing.status != DrawingStatus.issued,
    ).order_by(Drawing.page_number).all()

    total = len(drawings)
    for drawing in drawings:
        drawing.total_pages = total

    db.commit()


# ─── CREATE DRAWING ──────────────────────────────────────────
@router.post("/drawings")
def create_drawing(data: DrawingCreate, db: Session = Depends(get_db)):

    # Verify project exists
    project = db.query(Project).filter(Project.id == data.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Validate drawing number format: D + 4 digits
    if not DRAWING_NUMBER_RE.match(data.drawing_number.upper()):
        raise HTTPException(
            status_code=400,
            detail="Drawing number must be D followed by 4 digits (e.g. D9501). Page numbers use decimal: D9501.01"
        )
    data.drawing_number = data.drawing_number.upper()

    # Resolve paper size enum
    try:
        paper_size = PaperSize[data.paper_size] if data.paper_size else PaperSize.Arch_D
    except KeyError:
        raise HTTPException(status_code=400, detail=f"Invalid paper_size: {data.paper_size}")

    # Calculate next page number for this project
    existing_count = db.query(Drawing).filter(
        Drawing.project_id == data.project_id
    ).count()
    page_number = existing_count + 1

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
        page_number      = page_number,
        total_pages      = page_number,
        status           = DrawingStatus.draft,
    )

    db.add(drawing)
    db.commit()
    db.refresh(drawing)

    # Update total_pages on all drawings in the project
    _update_total_pages(data.project_id, db)
    db.refresh(drawing)

    return {"status": "ok", "drawing": drawing_to_dict(drawing)}


# ─── LIST DRAWINGS FOR PROJECT ───────────────────────────────
@router.get("/drawings/project/{project_id}")
def list_drawings(project_id: int, db: Session = Depends(get_db)):

    drawings = db.query(Drawing).filter(
        Drawing.project_id == project_id,
    ).order_by(Drawing.page_number).all()

    return {
        "status":   "ok",
        "drawings": [drawing_to_dict(d) for d in drawings],
    }


# ─── GET SINGLE DRAWING ──────────────────────────────────────
@router.get("/drawings/{drawing_id}")
def get_drawing(drawing_id: int, db: Session = Depends(get_db)):

    drawing = db.query(Drawing).filter(Drawing.id == drawing_id).first()

    if not drawing:
        raise HTTPException(status_code=404, detail="Drawing not found")

    return {"status": "ok", "drawing": drawing_to_dict(drawing, include_relations=True)}


# ─── UPDATE DRAWING ──────────────────────────────────────────
@router.put("/drawings/{drawing_id}")
def update_drawing(drawing_id: int, data: DrawingUpdate, db: Session = Depends(get_db)):

    drawing = db.query(Drawing).filter(Drawing.id == drawing_id).first()

    if not drawing:
        raise HTTPException(status_code=404, detail="Drawing not found")

    updates = data.model_dump(exclude_none=True)

    # Handle enum fields
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


# ─── SOFT DELETE DRAWING ─────────────────────────────────────
@router.delete("/drawings/{drawing_id}")
def delete_drawing(drawing_id: int, db: Session = Depends(get_db)):

    drawing = db.query(Drawing).filter(Drawing.id == drawing_id).first()

    if not drawing:
        raise HTTPException(status_code=404, detail="Drawing not found")

    project_id     = drawing.project_id
    drawing.status = DrawingStatus.issued  # use issued as archived marker

    db.commit()

    # Recalculate page numbers
    _update_total_pages(project_id, db)

    return {"status": "ok", "message": f"Drawing {drawing_id} deleted"}