# ─────────────────────────────────────────────────────────────
# api/drawings.py
#
# Drawing API routes.
# POST   /api/drawings                        → create drawing + rev 00
# GET    /api/drawings/project/:id            → all drawings for project
# GET    /api/drawings/:id                    → single drawing + revisions
# PUT    /api/drawings/:id                    → update drawing fields
# DELETE /api/drawings/:id                    → hard delete
# POST   /api/drawings/:id/commit             → commit current revision
# POST   /api/drawings/:id/submit             → mark as submitted to client
# POST   /api/drawings/:id/final-commit       → final release after approval
#
# Every route loads the drawing's project and checks it belongs to the
# caller's company before doing anything else — see _load_owned_project /
# _load_owned_drawing below.
# ─────────────────────────────────────────────────────────────

import re
import os
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.drawing import Drawing, DrawingRevision, PaperSize, DrawingStatus
from models.project import Project
from models.user import User
from auth import get_current_user, require_same_company
from pydantic import BaseModel
from typing import Optional, Any

router = APIRouter()

# ─── DRAWING NUMBER VALIDATION ───────────────────────────────
DRAWING_NUMBER_RE = re.compile(r"^D[0-9]{4}$")

# ─── STORAGE BASE PATH ───────────────────────────────────────
# All committed PDFs stored under backend/storage/
# Structure: backend/storage/{project_number}/{level}/{drawing_number}/
STORAGE_BASE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "storage"
)

# ─── OWNERSHIP HELPERS ────────────────────────────────────────

def _load_owned_project(project_id: int, db: Session, current_user: User) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    require_same_company(project.company_id, current_user)
    return project


def _load_owned_drawing(drawing_id: int, db: Session, current_user: User) -> Drawing:
    drawing = db.query(Drawing).filter(Drawing.id == drawing_id).first()
    if not drawing:
        raise HTTPException(status_code=404, detail="Drawing not found")
    _load_owned_project(drawing.project_id, db, current_user)
    return drawing


# ─── REVISION NUMBER HELPERS ─────────────────────────────────

def next_revision_number(current: str) -> str:
    """Increment revision number: '00' → '01', '09' → '10', '99' → '100'"""
    try:
        n = int(current)
        return str(n + 1).zfill(2)
    except (ValueError, TypeError):
        return "01"

def pdf_storage_path(project_number: str, level: str, drawing_number: str, revision: str) -> str:
    """
    Returns the relative path for a committed PDF.
    Full path: backend/storage/{project_number}/{level}/{drawing_number}/{drawing_number}-RV{revision}.pdf
    Level defaults to 'general' if blank.
    """
    level_dir = (level or "general").strip().replace("/", "-").replace(" ", "_")
    filename  = f"{drawing_number}-RV{revision}.pdf"
    rel_path  = os.path.join(str(project_number), level_dir, drawing_number, filename)
    return rel_path

def ensure_storage_dir(rel_path: str) -> str:
    """Creates the directory for a PDF path and returns the full absolute path."""
    full_path = os.path.join(STORAGE_BASE, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    return full_path


# ─── SCHEMAS ─────────────────────────────────────────────────

class DrawingCreate(BaseModel):
    project_id:       int
    drawing_number:   str
    mw_number:        Optional[str] = ""
    title:            str
    level:            Optional[str] = ""
    location:         Optional[str] = ""
    arch_ref:         Optional[str] = ""
    item_description: Optional[str] = ""
    scale:            Optional[str] = "1:20"
    paper_size:       Optional[str] = "Arch_D"
    page_count:       Optional[int] = 1

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
    page_count:        Optional[int]  = None

class CommitRequest(BaseModel):
    description: Optional[str] = ""    # revision description e.g. "Issued for Review"

class SubmitRequest(BaseModel):
    pass

class FinalCommitRequest(BaseModel):
    description: Optional[str] = ""


# ─── SERIALIZERS ─────────────────────────────────────────────

def revision_to_dict(r: DrawingRevision) -> dict:
    return {
        "id":              r.id,
        "drawing_id":      r.drawing_id,
        "revision_number": r.revision_number,
        "date":            str(r.date) if r.date else None,
        "initials":        r.initials,
        "description":     r.description,
        "is_locked":       r.is_locked,
        "pdf_path":        r.pdf_path,
        "committed_at":    str(r.committed_at) if r.committed_at else None,
        "committed_by":    r.committed_by,
        "created_at":      str(r.created_at) if r.created_at else None,
    }

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
        "page_count":       d.page_count if d.page_count else 1,
        "status":           d.status.value if d.status else None,
        "for_client_review": d.for_client_review,
        "for_production":   d.for_production,
        "qty":              d.qty,
        "bom_generated_at": str(d.bom_generated_at) if d.bom_generated_at else None,
        "created_at":       str(d.created_at) if d.created_at else None,
        "updated_at":       str(d.updated_at) if d.updated_at else None,
    }
    if include_relations:
        result["svg_data"]  = d.svg_data
        result["revisions"] = [revision_to_dict(r) for r in d.revisions] if d.revisions else []
        result["products"]  = [
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
        ] if d.products else []
    return result


def _update_total_pages(project_id: int, db: Session):
    """Recalculate page_number and total_pages for all drawings in a project."""
    drawings = db.query(Drawing).filter(
        Drawing.project_id == project_id
    ).order_by(Drawing.id).all()
    total = len(drawings)
    for i, d in enumerate(drawings, start=1):
        d.page_number = i
        d.total_pages = total
    db.commit()


# ─── CREATE DRAWING ──────────────────────────────────────────
@router.post("/drawings")
def create_drawing(data: DrawingCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):

    project = _load_owned_project(data.project_id, db, current_user)

    if not DRAWING_NUMBER_RE.match(data.drawing_number.upper()):
        raise HTTPException(status_code=400, detail="Drawing number must be D + 4 digits (e.g. D9501)")
    data.drawing_number = data.drawing_number.upper()

    # ── Duplicate safeguard — drawing number ─────────────────────
    # If a drawing with the same number exists in this project:
    #   - No committed revisions → auto-delete it and proceed
    #   - Has committed revisions → block and require + Rev instead
    existing_drawing = db.query(Drawing).filter(
        Drawing.project_id     == data.project_id,
        Drawing.drawing_number == data.drawing_number,
    ).first()
    if existing_drawing:
        has_commits = db.query(DrawingRevision).filter(
            DrawingRevision.drawing_id == existing_drawing.id,
            DrawingRevision.is_locked  == True,
        ).first()
        if has_commits:
            raise HTTPException(
                status_code=400,
                detail=f"Drawing {data.drawing_number} has committed revisions and cannot be replaced. Use + Rev to add a new revision."
            )
        # No commits — safe to auto-delete the duplicate
        db.delete(existing_drawing)
        db.flush()

    # ── Duplicate safeguard — MW# ─────────────────────────────────
    # Same logic: auto-delete if no commits, block if committed.
    if data.mw_number and data.mw_number.strip():
        existing_mw = db.query(Drawing).filter(
            Drawing.project_id == data.project_id,
            Drawing.mw_number  == data.mw_number.strip(),
        ).first()
        if existing_mw:
            has_commits = db.query(DrawingRevision).filter(
                DrawingRevision.drawing_id == existing_mw.id,
                DrawingRevision.is_locked  == True,
            ).first()
            if has_commits:
                raise HTTPException(
                    status_code=400,
                    detail=f"MW# {data.mw_number} is already used by drawing {existing_mw.drawing_number} which has committed revisions. Cannot replace."
                )
            # No commits — safe to auto-delete
            db.delete(existing_mw)
            db.flush()
    data.drawing_number = data.drawing_number.upper()

    try:
        paper_size = PaperSize[data.paper_size] if data.paper_size else PaperSize.Arch_D
    except KeyError:
        raise HTTPException(status_code=400, detail=f"Invalid paper_size: {data.paper_size}")

    existing_count = db.query(Drawing).filter(Drawing.project_id == data.project_id).count()
    page_number    = existing_count + 1

    drawing = Drawing(
        project_id       = data.project_id,
        created_by       = current_user.id,
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
        page_count       = data.page_count or 1,
        status           = DrawingStatus.draft,
    )

    db.add(drawing)
    db.flush()  # get drawing.id without committing yet

    # ── Auto-create Revision 00 row ───────────────────────────
    # Created in the same transaction as the drawing.
    # If rev00 insert fails, the entire transaction rolls back
    # so no orphan drawings are left in the DB.
    rev00 = DrawingRevision(
        drawing_id      = drawing.id,
        revision_number = "00",
        description     = "Initial",
        is_locked       = False,
    )
    db.add(rev00)
    db.commit()  # single commit for both drawing + revision
    db.refresh(drawing)

    _update_total_pages(data.project_id, db)
    db.refresh(drawing)

    return {"status": "ok", "drawing": drawing_to_dict(drawing)}


# ─── LIST DRAWINGS FOR PROJECT ───────────────────────────────
@router.get("/drawings/project/{project_id}")
def list_drawings(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _load_owned_project(project_id, db, current_user)
    drawings = db.query(Drawing).filter(
        Drawing.project_id == project_id
    ).order_by(Drawing.page_number).all()
    return {"status": "ok", "drawings": [drawing_to_dict(d) for d in drawings]}


# ─── GET SINGLE DRAWING ──────────────────────────────────────
@router.get("/drawings/{drawing_id}")
def get_drawing(drawing_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    drawing = _load_owned_drawing(drawing_id, db, current_user)
    return {"status": "ok", "drawing": drawing_to_dict(drawing, include_relations=True)}


# ─── UPDATE DRAWING ──────────────────────────────────────────
@router.put("/drawings/{drawing_id}")
def update_drawing(drawing_id: int, data: DrawingUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    drawing = _load_owned_drawing(drawing_id, db, current_user)

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
def delete_drawing(drawing_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    drawing = _load_owned_drawing(drawing_id, db, current_user)

    project_id = drawing.project_id
    db.delete(drawing)
    db.commit()
    _update_total_pages(project_id, db)
    return {"status": "ok", "message": f"Drawing {drawing_id} deleted"}


# ─── COMMIT REVISION ─────────────────────────────────────────
# Locks the current revision, generates PDF path, bumps revision number,
# changes status to submittal_pending, creates next editable revision row.
@router.post("/drawings/{drawing_id}/commit")
def commit_revision(drawing_id: int, data: CommitRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):

    drawing = _load_owned_drawing(drawing_id, db, current_user)

    # Find the current unlocked revision
    current_rev = db.query(DrawingRevision).filter(
        DrawingRevision.drawing_id  == drawing_id,
        DrawingRevision.is_locked   == False,
        DrawingRevision.revision_number == drawing.revision,
    ).first()

    if not current_rev:
        raise HTTPException(status_code=400, detail="No unlocked revision found to commit")

    # Build the PDF storage path from project info
    project = db.query(Project).filter(Project.id == drawing.project_id).first()
    rel_path = pdf_storage_path(
        project_number = project.project_number if project else "0",
        level          = drawing.level or "general",
        drawing_number = drawing.drawing_number,
        revision       = drawing.revision,
    )

    # Create the storage directory (PDF generation is Phase 8)
    try:
        ensure_storage_dir(rel_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not create storage directory: {e}")

    # Lock the current revision
    current_rev.is_locked    = True
    current_rev.pdf_path     = rel_path
    current_rev.committed_at = datetime.now(timezone.utc)
    current_rev.committed_by = current_user.id
    current_rev.description  = data.description or current_rev.description
    current_rev.date         = datetime.now(timezone.utc).date()

    # Bump drawing revision number and change status
    next_rev = next_revision_number(drawing.revision)
    drawing.revision = next_rev
    drawing.status   = DrawingStatus.submittal_pending

    # Create next editable revision row
    new_rev = DrawingRevision(
        drawing_id      = drawing_id,
        revision_number = next_rev,
        description     = "",
        is_locked       = False,
    )
    db.add(new_rev)
    db.commit()
    db.refresh(drawing)

    return {
        "status":          "ok",
        "message":         f"Revision {current_rev.revision_number} committed. Drawing is now Rev {next_rev}.",
        "committed_rev":   revision_to_dict(current_rev),
        "drawing":         drawing_to_dict(drawing, include_relations=True),
    }


# ─── SUBMIT TO CLIENT ────────────────────────────────────────
# Marks drawing as submitted — status: submittal_pending → submitted.
# Called after the PDF has been sent to the client.
@router.post("/drawings/{drawing_id}/submit")
def submit_to_client(drawing_id: int, data: SubmitRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):

    drawing = _load_owned_drawing(drawing_id, db, current_user)

    if drawing.status != DrawingStatus.submittal_pending:
        raise HTTPException(
            status_code=400,
            detail=f"Drawing must be in submittal_pending status to submit. Current: {drawing.status.value}"
        )

    drawing.status = DrawingStatus.submitted
    db.commit()
    db.refresh(drawing)

    return {"status": "ok", "drawing": drawing_to_dict(drawing)}


# ─── FINAL COMMIT ────────────────────────────────────────────
# Called after client returns drawings Reviewed as Noted.
# Locks the current revision as the final production-ready release.
# Status: submitted or approved → issued
# This is permanent — the drawing cannot be edited after final commit.
@router.post("/drawings/{drawing_id}/final-commit")
def final_commit(drawing_id: int, data: FinalCommitRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):

    drawing = _load_owned_drawing(drawing_id, db, current_user)

    allowed_statuses = {DrawingStatus.submitted, DrawingStatus.approved}
    if drawing.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Drawing must be submitted or approved to final commit. Current: {drawing.status.value}"
        )

    # Lock current revision
    current_rev = db.query(DrawingRevision).filter(
        DrawingRevision.drawing_id      == drawing_id,
        DrawingRevision.revision_number == drawing.revision,
        DrawingRevision.is_locked       == False,
    ).first()

    if current_rev:
        project  = db.query(Project).filter(Project.id == drawing.project_id).first()
        rel_path = pdf_storage_path(
            project_number = project.project_number if project else "0",
            level          = drawing.level or "general",
            drawing_number = drawing.drawing_number,
            revision       = drawing.revision,
        )
        try:
            ensure_storage_dir(rel_path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Could not create storage directory: {e}")

        current_rev.is_locked    = True
        current_rev.pdf_path     = rel_path
        current_rev.committed_at = datetime.now(timezone.utc)
        current_rev.committed_by = current_user.id
        current_rev.description  = data.description or "Final Release"
        current_rev.date         = datetime.now(timezone.utc).date()

    # Mark drawing as final release
    drawing.status         = DrawingStatus.issued
    drawing.for_production = True

    db.commit()
    db.refresh(drawing)

    return {
        "status":  "ok",
        "message": f"Drawing {drawing.drawing_number} Rev {drawing.revision} is now Final Release.",
        "drawing": drawing_to_dict(drawing, include_relations=True),
    }
