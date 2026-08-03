# ─────────────────────────────────────────────────────────────
# api/drawing_products.py
#
# Drawing products API routes.
# POST   /api/drawings/:id/products       → save product to drawing
# GET    /api/drawings/:id/products       → all products on drawing
# PUT    /api/drawings/:id/products/:pid  → update product
# DELETE /api/drawings/:id/products/:pid  → remove from drawing
#
# instance_code is auto-generated: {product_code}-{sequence}
# e.g. first FL-B1D = FL-B1D-01, second = FL-B1D-02
#
# Material/hardware fields reference project-scoped rows (never the
# global catalog, never a free-text string) — see the resolver
# helpers below. Materials are polymorphic ("layup" or "melamine"),
# same pattern as ProjectLayup's own faces; hardware and edge_banding
# are single-type. All references are validated against the
# drawing's own project_id, mirroring api/layups.py's approach.
# ─────────────────────────────────────────────────────────────

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.drawing_product import DrawingProduct
from models.drawing import Drawing
from models.project import Project
from models.product import Product
from models.project_layup import ProjectLayup
from models.project_melamine import ProjectMelamine
from models.project_edgeband import ProjectEdgeband
from models.project_hinge import ProjectHinge
from models.project_drawer_slide import ProjectDrawerSlide
from models.project_handle import ProjectHandle
from models.project_shelf_support import ProjectShelfSupport
from models.drawing_bom import DrawingBomPart, DrawingBomProduct
from models.user import User
from auth import get_current_user, require_same_company
from pydantic import BaseModel
from typing import Optional
from parts.registry import generate_parts

router = APIRouter()

SUPPORTED_MATERIAL_TYPES = {"layup", "melamine"}

# Single-type reference fields: (request field prefix, FK column, model, project-scope filter)
_HARDWARE_REFS = {
    "hinge":        ProjectHinge,
    "drawer_slide": ProjectDrawerSlide,
    "pull":         ProjectHandle,
    "shelf_pin":    ProjectShelfSupport,
}


def _load_owned_drawing(drawing_id: int, db: Session, current_user: User) -> Drawing:
    drawing = db.query(Drawing).filter(Drawing.id == drawing_id).first()
    if not drawing:
        raise HTTPException(status_code=404, detail="Drawing not found")
    project = db.query(Project).filter(Project.id == drawing.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Drawing not found")
    require_same_company(project.company_id, current_user)
    return drawing


# ─── MATERIAL REFERENCE RESOLUTION (polymorphic) ──────────────

def _resolve_material(project_id: int, material_type: Optional[str], material_id: Optional[int], field_label: str, db: Session):
    """Strict — used on create/update. None/None is valid (field left
    unset). Raises if only one of the pair is given, the type isn't
    supported, or the row doesn't belong to this project."""
    if material_type is None and material_id is None:
        return
    if material_type is None or material_id is None:
        raise HTTPException(status_code=400, detail=f"{field_label}: type and id must be given together")
    if material_type not in SUPPORTED_MATERIAL_TYPES:
        raise HTTPException(status_code=400, detail=f"{field_label}: unsupported material type '{material_type}'")

    model = ProjectLayup if material_type == "layup" else ProjectMelamine
    row = db.query(model).filter(model.id == material_id, model.project_id == project_id).first()
    if not row:
        raise HTTPException(status_code=404, detail=f"{field_label}: not found in this project")


def _material_summary(material_type: Optional[str], material_id: Optional[int], db: Session) -> Optional[dict]:
    """Lenient — used when reading. No DB-level FK backs these, so a
    referenced row could theoretically be gone; degrade gracefully."""
    if material_type is None or material_id is None:
        return None
    model = ProjectLayup if material_type == "layup" else ProjectMelamine if material_type == "melamine" else None
    row = db.query(model).filter(model.id == material_id).first() if model else None
    return {
        "material_type": material_type,
        "material_id":   material_id,
        "project_code":  row.project_code if row else None,
        "found":         row is not None,
    }


# ─── HARDWARE / EDGEBAND REFERENCE RESOLUTION (single-type) ──

def _resolve_single_ref(project_id: int, model, ref_id: Optional[int], field_label: str, db: Session):
    """Strict — used on create/update. None is valid (field left unset)."""
    if ref_id is None:
        return
    row = db.query(model).filter(model.id == ref_id, model.project_id == project_id).first()
    if not row:
        raise HTTPException(status_code=404, detail=f"{field_label}: not found in this project")


def _single_ref_summary(model, ref_id: Optional[int], db: Session) -> Optional[dict]:
    """Lenient — used when reading."""
    if ref_id is None:
        return None
    row = db.query(model).filter(model.id == ref_id).first()
    return {
        "id":            ref_id,
        "project_code":  row.project_code if row else None,
        "found":         row is not None,
    }


# ─── BOM GENERATION (Phase 3/4 slice — see NEXT_STEPS.md) ─────
# Runs the naive part-template engine (backend/parts/) and writes its
# output as real DrawingBomPart rows + a DrawingBomProduct summary
# row, so GET /bom/:drawing_id reflects whatever's actually placed.
# Idempotent (delete-then-insert on drawing_product_id) — safe to
# call after every create/update, not just once.

def _regenerate_bom_parts(dp: DrawingProduct, product: Product, drawing: Drawing, db: Session):
    parts = generate_parts(product, dp)

    db.query(DrawingBomPart).filter(DrawingBomPart.drawing_product_id == dp.id).delete()

    role_summaries = {
        "exterior": _material_summary(dp.exterior_material_type, dp.exterior_material_id, db),
        "interior": _material_summary(dp.interior_material_type, dp.interior_material_id, db),
        "back":     _material_summary(dp.back_material_type,     dp.back_material_id,     db),
        "subtop":   _material_summary(dp.subtop_material_type,   dp.subtop_material_id,   db),
    }

    for spec in parts:
        summary = role_summaries.get(spec.material_role) if spec.material_role else None
        material_code = (summary or {}).get("project_code") or "TBD"
        db.add(DrawingBomPart(
            drawing_id         = dp.drawing_id,
            drawing_product_id = dp.id,
            part_number        = spec.part_number,
            description        = spec.description,
            material_code      = material_code,
            thickness_mm       = spec.thickness_mm,
            width_mm           = spec.width_mm,
            length_mm          = spec.length_mm,
            quantity           = spec.quantity,
            grain_direction    = spec.grain_direction,
        ))

    bom_product = db.query(DrawingBomProduct).filter(
        DrawingBomProduct.drawing_id    == dp.drawing_id,
        DrawingBomProduct.instance_code == dp.instance_code,
    ).first()
    if not bom_product:
        bom_product = DrawingBomProduct(drawing_id=dp.drawing_id, instance_code=dp.instance_code)
        db.add(bom_product)

    bom_product.product_code    = product.code
    bom_product.product_name    = product.name
    bom_product.quantity        = 1
    bom_product.width           = dp.width
    bom_product.height          = dp.height
    bom_product.depth           = dp.depth
    bom_product.doors           = dp.doors
    bom_product.drawers         = dp.drawers
    bom_product.shelves         = dp.shelves
    bom_product.exterior_finish = (role_summaries["exterior"] or {}).get("project_code") or ""
    bom_product.interior_finish = (role_summaries["interior"] or {}).get("project_code") or ""
    bom_product.sort_order      = dp.sort_order

    drawing.bom_generated_at = datetime.utcnow()
    db.commit()


def _clear_bom_parts(dp: DrawingProduct, db: Session):
    db.query(DrawingBomPart).filter(DrawingBomPart.drawing_product_id == dp.id).delete()
    db.query(DrawingBomProduct).filter(
        DrawingBomProduct.drawing_id    == dp.drawing_id,
        DrawingBomProduct.instance_code == dp.instance_code,
    ).delete()
    db.commit()


# ─── SCHEMAS ─────────────────────────────────────────────────

class DrawingProductCreate(BaseModel):
    product_id: int
    x:          Optional[float] = 0
    y:          Optional[float] = 0
    rotation:   Optional[int]   = 0
    width:      float
    height:     float
    depth:      float
    doors:      Optional[int] = 0
    drawers:    Optional[int] = 0
    shelves:    Optional[int] = 0

    hinge_side:  Optional[str] = ""
    door_type:   Optional[str] = ""

    exterior_material_type: Optional[str] = None
    exterior_material_id:   Optional[int] = None
    interior_material_type: Optional[str] = None
    interior_material_id:   Optional[int] = None
    back_material_type:     Optional[str] = None
    back_material_id:       Optional[int] = None
    subtop_material_type:   Optional[str] = None
    subtop_material_id:     Optional[int] = None
    edge_banding_id:        Optional[int] = None

    hinge_id:        Optional[int] = None
    drawer_slide_id: Optional[int] = None
    pull_id:         Optional[int] = None
    shelf_pin_id:    Optional[int] = None

    exterior_finish: Optional[str] = ""
    interior_finish: Optional[str] = ""

    label:             Optional[str]  = ""
    show_label:        Optional[bool] = True
    show_dimensions:   Optional[bool] = True
    show_product_code: Optional[bool] = True
    notes_on_drawing:  Optional[str]  = ""

    internal_notes:   Optional[str] = ""
    production_notes: Optional[str] = ""
    client_notes:     Optional[str] = ""

    bom_description: Optional[str]  = ""
    bom_category:    Optional[str]  = ""
    include_in_bom:  Optional[bool] = True
    bom_notes:       Optional[str]  = ""

    sort_order: Optional[int] = 0


class DrawingProductUpdate(BaseModel):
    x:          Optional[float] = None
    y:          Optional[float] = None
    rotation:   Optional[int]   = None
    width:      Optional[float] = None
    height:     Optional[float] = None
    depth:      Optional[float] = None
    doors:      Optional[int]   = None
    drawers:    Optional[int]   = None
    shelves:    Optional[int]   = None
    hinge_side: Optional[str]   = None
    door_type:  Optional[str]   = None

    exterior_material_type: Optional[str] = None
    exterior_material_id:   Optional[int] = None
    interior_material_type: Optional[str] = None
    interior_material_id:   Optional[int] = None
    back_material_type:     Optional[str] = None
    back_material_id:       Optional[int] = None
    subtop_material_type:   Optional[str] = None
    subtop_material_id:     Optional[int] = None
    edge_banding_id:        Optional[int] = None

    hinge_id:        Optional[int] = None
    drawer_slide_id: Optional[int] = None
    pull_id:         Optional[int] = None
    shelf_pin_id:    Optional[int] = None

    exterior_finish: Optional[str] = None
    interior_finish: Optional[str] = None

    label:             Optional[str]  = None
    show_label:        Optional[bool] = None
    show_dimensions:   Optional[bool] = None
    show_product_code: Optional[bool] = None
    notes_on_drawing:  Optional[str]  = None

    internal_notes:   Optional[str] = None
    production_notes: Optional[str] = None
    client_notes:     Optional[str] = None

    bom_description: Optional[str]  = None
    bom_category:    Optional[str]  = None
    include_in_bom:  Optional[bool] = None
    bom_notes:       Optional[str]  = None
    sort_order:      Optional[int]  = None


def product_to_dict(p: DrawingProduct, db: Session) -> dict:
    return {
        "id":            p.id,
        "drawing_id":    p.drawing_id,
        "product_id":    p.product_id,
        "instance_code": p.instance_code,
        "x": p.x, "y": p.y, "rotation": p.rotation,
        "width": p.width, "height": p.height, "depth": p.depth,
        "doors": p.doors, "drawers": p.drawers, "shelves": p.shelves,
        "hinge_side": p.hinge_side, "door_type": p.door_type,
        "exterior_material": _material_summary(p.exterior_material_type, p.exterior_material_id, db),
        "interior_material": _material_summary(p.interior_material_type, p.interior_material_id, db),
        "back_material":     _material_summary(p.back_material_type,     p.back_material_id,     db),
        "subtop_material":   _material_summary(p.subtop_material_type,   p.subtop_material_id,   db),
        "edge_banding":      _single_ref_summary(ProjectEdgeband,   p.edge_banding_id,  db),
        "hinge":             _single_ref_summary(ProjectHinge,      p.hinge_id,         db),
        "drawer_slide":      _single_ref_summary(ProjectDrawerSlide, p.drawer_slide_id, db),
        "pull":              _single_ref_summary(ProjectHandle,     p.pull_id,          db),
        "shelf_pin":         _single_ref_summary(ProjectShelfSupport, p.shelf_pin_id,   db),
        "exterior_finish": p.exterior_finish,
        "interior_finish": p.interior_finish,
        "label":             p.label,
        "show_label":        p.show_label,
        "show_dimensions":   p.show_dimensions,
        "show_product_code": p.show_product_code,
        "notes_on_drawing":  p.notes_on_drawing,
        "internal_notes":    p.internal_notes,
        "production_notes":  p.production_notes,
        "client_notes":      p.client_notes,
        "bom_description": p.bom_description,
        "bom_category":    p.bom_category,
        "include_in_bom":  p.include_in_bom,
        "bom_notes":       p.bom_notes,
        "sort_order":      p.sort_order,
        "is_active":       p.is_active,
        "created_at":      str(p.created_at) if p.created_at else None,
    }


def _generate_instance_code(drawing_id: int, product_code: str, db: Session) -> str:
    """
    Auto-generates instance code for a product on a drawing.
    Counts existing instances of the same product code on this drawing.
    e.g. FL-B1D-01, FL-B1D-02, FL-B1D-03
    """
    existing = db.query(DrawingProduct).filter(
        DrawingProduct.drawing_id == drawing_id,
        DrawingProduct.instance_code.like(f"{product_code}-%"),
    ).count()

    sequence = str(existing + 1).zfill(2)
    return f"{product_code}-{sequence}"


# ─── SAVE PRODUCT TO DRAWING ─────────────────────────────────
@router.post("/drawings/{drawing_id}/products")
def save_product(drawing_id: int, data: DrawingProductCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):

    drawing = _load_owned_drawing(drawing_id, db, current_user)

    library_product = db.query(Product).filter(Product.id == data.product_id).first()
    if not library_product:
        raise HTTPException(status_code=404, detail="Product not found in library")

    instance_code = _generate_instance_code(drawing_id, library_product.code, db)

    project_id = drawing.project_id
    _resolve_material(project_id, data.exterior_material_type, data.exterior_material_id, "Exterior material", db)
    _resolve_material(project_id, data.interior_material_type, data.interior_material_id, "Interior material", db)
    _resolve_material(project_id, data.back_material_type,     data.back_material_id,     "Back material",     db)
    _resolve_material(project_id, data.subtop_material_type,   data.subtop_material_id,   "Subtop material",   db)
    _resolve_single_ref(project_id, ProjectEdgeband,    data.edge_banding_id,  "Edge banding",  db)
    _resolve_single_ref(project_id, ProjectHinge,       data.hinge_id,         "Hinge",         db)
    _resolve_single_ref(project_id, ProjectDrawerSlide, data.drawer_slide_id,  "Drawer slide",  db)
    _resolve_single_ref(project_id, ProjectHandle,      data.pull_id,          "Pull",          db)
    _resolve_single_ref(project_id, ProjectShelfSupport, data.shelf_pin_id,    "Shelf pin",     db)

    dp = DrawingProduct(
        drawing_id        = drawing_id,
        product_id        = data.product_id,
        instance_code     = instance_code,
        x                 = data.x,
        y                 = data.y,
        rotation          = data.rotation,
        width             = data.width,
        height            = data.height,
        depth             = data.depth,
        doors             = data.doors,
        drawers           = data.drawers,
        shelves           = data.shelves,
        hinge_side        = data.hinge_side        or "",
        door_type         = data.door_type         or "",
        exterior_material_type = data.exterior_material_type,
        exterior_material_id   = data.exterior_material_id,
        interior_material_type = data.interior_material_type,
        interior_material_id   = data.interior_material_id,
        back_material_type     = data.back_material_type,
        back_material_id       = data.back_material_id,
        subtop_material_type   = data.subtop_material_type,
        subtop_material_id     = data.subtop_material_id,
        edge_banding_id   = data.edge_banding_id,
        hinge_id          = data.hinge_id,
        drawer_slide_id   = data.drawer_slide_id,
        pull_id           = data.pull_id,
        shelf_pin_id      = data.shelf_pin_id,
        exterior_finish   = data.exterior_finish   or "",
        interior_finish   = data.interior_finish   or "",
        label             = data.label             or "",
        show_label        = data.show_label,
        show_dimensions   = data.show_dimensions,
        show_product_code = data.show_product_code,
        notes_on_drawing  = data.notes_on_drawing  or "",
        internal_notes    = data.internal_notes    or "",
        production_notes  = data.production_notes  or "",
        client_notes      = data.client_notes      or "",
        bom_description   = data.bom_description   or "",
        bom_category      = data.bom_category      or "",
        include_in_bom    = data.include_in_bom,
        bom_notes         = data.bom_notes         or "",
        sort_order        = data.sort_order,
    )

    db.add(dp)
    db.commit()
    db.refresh(dp)

    _regenerate_bom_parts(dp, library_product, drawing, db)

    return {"status": "ok", "product": product_to_dict(dp, db)}


# ─── LIST PRODUCTS ON DRAWING ────────────────────────────────
@router.get("/drawings/{drawing_id}/products")
def list_products(drawing_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):

    _load_owned_drawing(drawing_id, db, current_user)

    products = db.query(DrawingProduct).filter(
        DrawingProduct.drawing_id == drawing_id,
        DrawingProduct.is_active  == True,
    ).order_by(DrawingProduct.sort_order, DrawingProduct.id).all()

    return {
        "status":   "ok",
        "products": [product_to_dict(p, db) for p in products],
    }


# ─── UPDATE PRODUCT ──────────────────────────────────────────
@router.put("/drawings/{drawing_id}/products/{product_id}")
def update_product(drawing_id: int, product_id: int, data: DrawingProductUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):

    drawing = _load_owned_drawing(drawing_id, db, current_user)

    dp = db.query(DrawingProduct).filter(
        DrawingProduct.id         == product_id,
        DrawingProduct.drawing_id == drawing_id,
    ).first()

    if not dp:
        raise HTTPException(status_code=404, detail="Product not found on drawing")

    updates = data.model_dump(exclude_none=True)
    project_id = drawing.project_id

    if "exterior_material_type" in updates or "exterior_material_id" in updates:
        _resolve_material(project_id, updates.get("exterior_material_type", dp.exterior_material_type), updates.get("exterior_material_id", dp.exterior_material_id), "Exterior material", db)
    if "interior_material_type" in updates or "interior_material_id" in updates:
        _resolve_material(project_id, updates.get("interior_material_type", dp.interior_material_type), updates.get("interior_material_id", dp.interior_material_id), "Interior material", db)
    if "back_material_type" in updates or "back_material_id" in updates:
        _resolve_material(project_id, updates.get("back_material_type", dp.back_material_type), updates.get("back_material_id", dp.back_material_id), "Back material", db)
    if "subtop_material_type" in updates or "subtop_material_id" in updates:
        _resolve_material(project_id, updates.get("subtop_material_type", dp.subtop_material_type), updates.get("subtop_material_id", dp.subtop_material_id), "Subtop material", db)
    if "edge_banding_id" in updates:
        _resolve_single_ref(project_id, ProjectEdgeband, updates["edge_banding_id"], "Edge banding", db)
    if "hinge_id" in updates:
        _resolve_single_ref(project_id, ProjectHinge, updates["hinge_id"], "Hinge", db)
    if "drawer_slide_id" in updates:
        _resolve_single_ref(project_id, ProjectDrawerSlide, updates["drawer_slide_id"], "Drawer slide", db)
    if "pull_id" in updates:
        _resolve_single_ref(project_id, ProjectHandle, updates["pull_id"], "Pull", db)
    if "shelf_pin_id" in updates:
        _resolve_single_ref(project_id, ProjectShelfSupport, updates["shelf_pin_id"], "Shelf pin", db)

    for field, value in updates.items():
        setattr(dp, field, value)

    db.commit()
    db.refresh(dp)

    library_product = db.query(Product).filter(Product.id == dp.product_id).first()
    _regenerate_bom_parts(dp, library_product, drawing, db)

    return {"status": "ok", "product": product_to_dict(dp, db)}


# ─── REMOVE PRODUCT FROM DRAWING ────────────────────────────
@router.delete("/drawings/{drawing_id}/products/{product_id}")
def remove_product(drawing_id: int, product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):

    _load_owned_drawing(drawing_id, db, current_user)

    dp = db.query(DrawingProduct).filter(
        DrawingProduct.id         == product_id,
        DrawingProduct.drawing_id == drawing_id,
    ).first()

    if not dp:
        raise HTTPException(status_code=404, detail="Product not found on drawing")

    dp.is_active = False
    db.commit()

    _clear_bom_parts(dp, db)

    return {"status": "ok", "message": f"Product {product_id} removed from drawing"}
