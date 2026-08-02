# ─────────────────────────────────────────────────────────────
# api/bom.py
#
# BOM API routes — all five BOM sub-tables.
# BOM data is calculated by the geometry engine and written
# here automatically. These routes also allow manual edits.
#
# GET  /api/bom/:drawing_id           → full BOM for drawing
# POST /api/bom/:drawing_id/products  → add/update bom product
# POST /api/bom/:drawing_id/hardware  → add/update hardware
# POST /api/bom/:drawing_id/sheetgoods → add/update sheet goods
# POST /api/bom/:drawing_id/edgeband  → add/update edgeband
# POST /api/bom/:drawing_id/parts     → add/update parts
# DELETE /api/bom/:drawing_id/clear   → clear entire BOM
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.drawing import Drawing
from models.project import Project
from models.user import User
from models.drawing_bom import (
    DrawingBomProduct,
    DrawingBomHardware,
    DrawingBomSheetGoods,
    DrawingBomEdgeBand,
    DrawingBomPart,
)
from auth import get_current_user, require_same_company
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()


def _load_owned_drawing(drawing_id: int, db: Session, current_user: User) -> Drawing:
    drawing = db.query(Drawing).filter(Drawing.id == drawing_id).first()
    if not drawing:
        raise HTTPException(status_code=404, detail="Drawing not found")
    project = db.query(Project).filter(Project.id == drawing.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Drawing not found")
    require_same_company(project.company_id, current_user)
    return drawing


# ─── SCHEMAS ─────────────────────────────────────────────────

class BomProductCreate(BaseModel):
    instance_code:   str
    product_code:    str
    product_name:    str
    quantity:        Optional[int]   = 1
    width:           float
    height:          float
    depth:           float
    doors:           Optional[int]   = 0
    drawers:         Optional[int]   = 0
    shelves:         Optional[int]   = 0
    exterior_finish: Optional[str]   = ""
    interior_finish: Optional[str]   = ""
    notes:           Optional[str]   = ""
    sort_order:      Optional[int]   = 0


class BomHardwareCreate(BaseModel):
    code:        str
    description: str
    quantity:    Optional[int] = 0
    unit:        Optional[str] = "each"
    notes:       Optional[str] = ""
    sort_order:  Optional[int] = 0


class BomSheetGoodsCreate(BaseModel):
    material_code:   str
    description:     str
    thickness_mm:    float
    sheet_size:      Optional[str]   = "4x8"
    quantity_sheets: Optional[float] = 0
    core_type:       Optional[str]   = ""
    notes:           Optional[str]   = ""
    sort_order:      Optional[int]   = 0


class BomEdgeBandCreate(BaseModel):
    code:            str
    description:     str
    thickness_mm:    float
    total_length_mm: Optional[float] = 0
    colour:          Optional[str]   = ""
    notes:           Optional[str]   = ""
    sort_order:      Optional[int]   = 0


class BomPartCreate(BaseModel):
    drawing_product_id: int
    part_number:        str
    description:        str
    material_code:      str
    thickness_mm:       float
    width_mm:           float
    length_mm:          float
    quantity:           Optional[int] = 1
    grain_direction:    Optional[str] = "none"
    notes:              Optional[str] = ""
    sort_order:         Optional[int] = 0


# ─── GET FULL BOM ────────────────────────────────────────────
@router.get("/bom/{drawing_id}")
def get_bom(drawing_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):

    drawing = _load_owned_drawing(drawing_id, db, current_user)

    products   = db.query(DrawingBomProduct).filter(DrawingBomProduct.drawing_id   == drawing_id).order_by(DrawingBomProduct.sort_order).all()
    hardware   = db.query(DrawingBomHardware).filter(DrawingBomHardware.drawing_id  == drawing_id).order_by(DrawingBomHardware.sort_order).all()
    sheetgoods = db.query(DrawingBomSheetGoods).filter(DrawingBomSheetGoods.drawing_id == drawing_id).order_by(DrawingBomSheetGoods.sort_order).all()
    edgeband   = db.query(DrawingBomEdgeBand).filter(DrawingBomEdgeBand.drawing_id  == drawing_id).order_by(DrawingBomEdgeBand.sort_order).all()
    parts      = db.query(DrawingBomPart).filter(DrawingBomPart.drawing_id          == drawing_id).order_by(DrawingBomPart.sort_order).all()

    return {
        "status":     "ok",
        "drawing_id": drawing_id,
        "bom_generated_at": str(drawing.bom_generated_at) if drawing.bom_generated_at else None,
        "products":   [{"id": b.id, "instance_code": b.instance_code, "product_code": b.product_code, "product_name": b.product_name, "quantity": b.quantity, "width": b.width, "height": b.height, "depth": b.depth, "doors": b.doors, "drawers": b.drawers, "shelves": b.shelves, "exterior_finish": b.exterior_finish, "interior_finish": b.interior_finish, "notes": b.notes} for b in products],
        "hardware":   [{"id": b.id, "code": b.code, "description": b.description, "quantity": b.quantity, "unit": b.unit, "notes": b.notes} for b in hardware],
        "sheetgoods": [{"id": b.id, "material_code": b.material_code, "description": b.description, "thickness_mm": b.thickness_mm, "sheet_size": b.sheet_size, "quantity_sheets": b.quantity_sheets, "core_type": b.core_type, "notes": b.notes} for b in sheetgoods],
        "edgeband":   [{"id": b.id, "code": b.code, "description": b.description, "thickness_mm": b.thickness_mm, "total_length_mm": b.total_length_mm, "colour": b.colour, "notes": b.notes} for b in edgeband],
        "parts":      [{"id": b.id, "drawing_product_id": b.drawing_product_id, "part_number": b.part_number, "description": b.description, "material_code": b.material_code, "thickness_mm": b.thickness_mm, "width_mm": b.width_mm, "length_mm": b.length_mm, "quantity": b.quantity, "grain_direction": b.grain_direction, "notes": b.notes} for b in parts],
    }


# ─── ADD BOM PRODUCT ─────────────────────────────────────────
@router.post("/bom/{drawing_id}/products")
def add_bom_product(drawing_id: int, data: BomProductCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):

    drawing = _load_owned_drawing(drawing_id, db, current_user)

    item = DrawingBomProduct(
        drawing_id      = drawing_id,
        instance_code   = data.instance_code,
        product_code    = data.product_code,
        product_name    = data.product_name,
        quantity        = data.quantity,
        width           = data.width,
        height          = data.height,
        depth           = data.depth,
        doors           = data.doors,
        drawers         = data.drawers,
        shelves         = data.shelves,
        exterior_finish = data.exterior_finish or "",
        interior_finish = data.interior_finish or "",
        notes           = data.notes           or "",
        sort_order      = data.sort_order,
    )
    db.add(item)
    _stamp_bom(drawing, db)

    return {"status": "ok", "id": item.id}


# ─── ADD BOM HARDWARE ────────────────────────────────────────
@router.post("/bom/{drawing_id}/hardware")
def add_bom_hardware(drawing_id: int, data: BomHardwareCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):

    drawing = _load_owned_drawing(drawing_id, db, current_user)

    # Aggregate — if code already exists, add quantity
    existing = db.query(DrawingBomHardware).filter(
        DrawingBomHardware.drawing_id == drawing_id,
        DrawingBomHardware.code == data.code,
    ).first()

    if existing:
        existing.quantity += data.quantity
        db.commit()
        _stamp_bom(drawing, db)
        return {"status": "ok", "id": existing.id, "aggregated": True}

    item = DrawingBomHardware(
        drawing_id  = drawing_id,
        code        = data.code,
        description = data.description,
        quantity    = data.quantity,
        unit        = data.unit        or "each",
        notes       = data.notes       or "",
        sort_order  = data.sort_order,
    )
    db.add(item)
    _stamp_bom(drawing, db)

    return {"status": "ok", "id": item.id}


# ─── ADD BOM SHEET GOODS ─────────────────────────────────────
@router.post("/bom/{drawing_id}/sheetgoods")
def add_bom_sheetgoods(drawing_id: int, data: BomSheetGoodsCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):

    drawing = _load_owned_drawing(drawing_id, db, current_user)

    # Aggregate — if material_code + thickness already exists, add sheets
    existing = db.query(DrawingBomSheetGoods).filter(
        DrawingBomSheetGoods.drawing_id    == drawing_id,
        DrawingBomSheetGoods.material_code == data.material_code,
        DrawingBomSheetGoods.thickness_mm  == data.thickness_mm,
    ).first()

    if existing:
        existing.quantity_sheets += data.quantity_sheets
        db.commit()
        _stamp_bom(drawing, db)
        return {"status": "ok", "id": existing.id, "aggregated": True}

    item = DrawingBomSheetGoods(
        drawing_id      = drawing_id,
        material_code   = data.material_code,
        description     = data.description,
        thickness_mm    = data.thickness_mm,
        sheet_size      = data.sheet_size   or "4x8",
        quantity_sheets = data.quantity_sheets,
        core_type       = data.core_type    or "",
        notes           = data.notes        or "",
        sort_order      = data.sort_order,
    )
    db.add(item)
    _stamp_bom(drawing, db)

    return {"status": "ok", "id": item.id}


# ─── ADD BOM EDGEBAND ────────────────────────────────────────
@router.post("/bom/{drawing_id}/edgeband")
def add_bom_edgeband(drawing_id: int, data: BomEdgeBandCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):

    drawing = _load_owned_drawing(drawing_id, db, current_user)

    # Aggregate — if code already exists, add length
    existing = db.query(DrawingBomEdgeBand).filter(
        DrawingBomEdgeBand.drawing_id == drawing_id,
        DrawingBomEdgeBand.code       == data.code,
    ).first()

    if existing:
        existing.total_length_mm += data.total_length_mm
        db.commit()
        _stamp_bom(drawing, db)
        return {"status": "ok", "id": existing.id, "aggregated": True}

    item = DrawingBomEdgeBand(
        drawing_id      = drawing_id,
        code            = data.code,
        description     = data.description,
        thickness_mm    = data.thickness_mm,
        total_length_mm = data.total_length_mm,
        colour          = data.colour  or "",
        notes           = data.notes   or "",
        sort_order      = data.sort_order,
    )
    db.add(item)
    _stamp_bom(drawing, db)

    return {"status": "ok", "id": item.id}


# ─── ADD BOM PARTS ───────────────────────────────────────────
@router.post("/bom/{drawing_id}/parts")
def add_bom_parts(drawing_id: int, data: BomPartCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):

    drawing = _load_owned_drawing(drawing_id, db, current_user)

    item = DrawingBomPart(
        drawing_id         = drawing_id,
        drawing_product_id = data.drawing_product_id,
        part_number        = data.part_number,
        description        = data.description,
        material_code      = data.material_code,
        thickness_mm       = data.thickness_mm,
        width_mm           = data.width_mm,
        length_mm          = data.length_mm,
        quantity           = data.quantity,
        grain_direction    = data.grain_direction or "none",
        notes              = data.notes           or "",
        sort_order         = data.sort_order,
    )
    db.add(item)
    _stamp_bom(drawing, db)

    return {"status": "ok", "id": item.id}


# ─── CLEAR ENTIRE BOM ────────────────────────────────────────
@router.delete("/bom/{drawing_id}/clear")
def clear_bom(drawing_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Clears all BOM data for a drawing. Called by geometry engine before recalculating."""

    drawing = _load_owned_drawing(drawing_id, db, current_user)

    db.query(DrawingBomProduct).filter(DrawingBomProduct.drawing_id     == drawing_id).delete()
    db.query(DrawingBomHardware).filter(DrawingBomHardware.drawing_id   == drawing_id).delete()
    db.query(DrawingBomSheetGoods).filter(DrawingBomSheetGoods.drawing_id == drawing_id).delete()
    db.query(DrawingBomEdgeBand).filter(DrawingBomEdgeBand.drawing_id   == drawing_id).delete()
    db.query(DrawingBomPart).filter(DrawingBomPart.drawing_id           == drawing_id).delete()

    drawing.bom_generated_at = None
    db.commit()

    return {"status": "ok", "message": f"BOM cleared for drawing {drawing_id}"}


# ─── HELPERS ─────────────────────────────────────────────────

def _stamp_bom(drawing: Drawing, db: Session):
    """Updates bom_generated_at timestamp on the drawing."""
    drawing.bom_generated_at = datetime.utcnow()
    db.commit()
