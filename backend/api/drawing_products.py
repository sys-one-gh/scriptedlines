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
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.drawing_product import DrawingProduct
from models.drawing import Drawing
from models.project import Project
from models.product import Product
from models.user import User
from auth import get_current_user, require_same_company
from pydantic import BaseModel
from typing import Optional

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

    exterior_material: Optional[str] = ""
    interior_material: Optional[str] = ""
    back_material:     Optional[str] = ""
    subtop_material:   Optional[str] = ""
    edge_banding:      Optional[str] = ""

    hinge_code:        Optional[str] = ""
    drawer_slide_code: Optional[str] = ""
    pull_code:         Optional[str] = ""
    shelf_pin_code:    Optional[str] = ""

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

    exterior_material: Optional[str] = None
    interior_material: Optional[str] = None
    back_material:     Optional[str] = None
    subtop_material:   Optional[str] = None
    edge_banding:      Optional[str] = None

    hinge_code:        Optional[str] = None
    drawer_slide_code: Optional[str] = None
    pull_code:         Optional[str] = None
    shelf_pin_code:    Optional[str] = None

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


def product_to_dict(p: DrawingProduct) -> dict:
    return {
        "id":            p.id,
        "drawing_id":    p.drawing_id,
        "product_id":    p.product_id,
        "instance_code": p.instance_code,
        "x": p.x, "y": p.y, "rotation": p.rotation,
        "width": p.width, "height": p.height, "depth": p.depth,
        "doors": p.doors, "drawers": p.drawers, "shelves": p.shelves,
        "hinge_side": p.hinge_side, "door_type": p.door_type,
        "exterior_material": p.exterior_material,
        "interior_material": p.interior_material,
        "back_material":     p.back_material,
        "subtop_material":   p.subtop_material,
        "edge_banding":      p.edge_banding,
        "hinge_code":        p.hinge_code,
        "drawer_slide_code": p.drawer_slide_code,
        "pull_code":         p.pull_code,
        "shelf_pin_code":    p.shelf_pin_code,
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

    _load_owned_drawing(drawing_id, db, current_user)

    library_product = db.query(Product).filter(Product.id == data.product_id).first()
    if not library_product:
        raise HTTPException(status_code=404, detail="Product not found in library")

    instance_code = _generate_instance_code(drawing_id, library_product.code, db)

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
        exterior_material = data.exterior_material or "",
        interior_material = data.interior_material or "",
        back_material     = data.back_material     or "",
        subtop_material   = data.subtop_material   or "",
        edge_banding      = data.edge_banding      or "",
        hinge_code        = data.hinge_code        or "",
        drawer_slide_code = data.drawer_slide_code or "",
        pull_code         = data.pull_code         or "",
        shelf_pin_code    = data.shelf_pin_code    or "",
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

    return {"status": "ok", "product": product_to_dict(dp)}


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
        "products": [product_to_dict(p) for p in products],
    }


# ─── UPDATE PRODUCT ──────────────────────────────────────────
@router.put("/drawings/{drawing_id}/products/{product_id}")
def update_product(drawing_id: int, product_id: int, data: DrawingProductUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):

    _load_owned_drawing(drawing_id, db, current_user)

    dp = db.query(DrawingProduct).filter(
        DrawingProduct.id         == product_id,
        DrawingProduct.drawing_id == drawing_id,
    ).first()

    if not dp:
        raise HTTPException(status_code=404, detail="Product not found on drawing")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(dp, field, value)

    db.commit()
    db.refresh(dp)

    return {"status": "ok", "product": product_to_dict(dp)}


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

    return {"status": "ok", "message": f"Product {product_id} removed from drawing"}
