# ─────────────────────────────────────────────────────────────
# api/templates.py
#
# Drawing template routes — one template per project.
# GET /api/templates/project/:id   → get or auto-create template
# PUT /api/templates/project/:id   → update template fields
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.drawing import DrawingTemplate
from models.project import Project
from pydantic import BaseModel
from typing import Optional, Any
from datetime import date

router = APIRouter()


class TemplateUpdate(BaseModel):
    company_name:        Optional[str]  = None
    company_address:     Optional[str]  = None
    company_phone:       Optional[str]  = None
    company_fax:         Optional[str]  = None
    company_email:       Optional[str]  = None
    company_website:     Optional[str]  = None
    client_name:         Optional[str]  = None
    client_address:      Optional[str]  = None
    jobsite_name:        Optional[str]  = None
    jobsite_address:     Optional[str]  = None
    contractor_name:     Optional[str]  = None
    architect_name:      Optional[str]  = None
    drawn_by:            Optional[str]  = None
    checked_by:          Optional[str]  = None
    project_manager:     Optional[str]  = None
    important_notes:     Optional[str]  = None
    material_notes:      Optional[str]  = None
    finish_schedule:     Optional[Any]  = None
    awmac_member:        Optional[bool] = None
    awi_member:          Optional[bool] = None
    compliance_note:     Optional[str]  = None
    approval_stamp_text: Optional[str]  = None
    approval_name:       Optional[str]  = None
    approval_date:       Optional[date] = None


def template_to_dict(t: DrawingTemplate) -> dict:
    return {
        "id":                  t.id,
        "project_id":          t.project_id,
        "company_name":        t.company_name,
        "company_address":     t.company_address,
        "company_phone":       t.company_phone,
        "company_fax":         t.company_fax,
        "company_email":       t.company_email,
        "company_website":     t.company_website,
        "client_name":         t.client_name,
        "client_address":      t.client_address,
        "jobsite_name":        t.jobsite_name,
        "jobsite_address":     t.jobsite_address,
        "contractor_name":     t.contractor_name,
        "architect_name":      t.architect_name,
        "drawn_by":            t.drawn_by,
        "checked_by":          t.checked_by,
        "project_manager":     t.project_manager,
        "important_notes":     t.important_notes,
        "material_notes":      t.material_notes,
        "finish_schedule":     t.finish_schedule or [],
        "awmac_member":        t.awmac_member,
        "awi_member":          t.awi_member,
        "compliance_note":     t.compliance_note,
        "approval_stamp_text": t.approval_stamp_text,
        "approval_name":       t.approval_name,
        "approval_date":       str(t.approval_date) if t.approval_date else None,
        "created_at":          str(t.created_at) if t.created_at else None,
        "updated_at":          str(t.updated_at) if t.updated_at else None,
    }


@router.get("/templates/project/{project_id}")
def get_template(project_id: int, db: Session = Depends(get_db)):
    """
    Get template for a project.
    Auto-creates an empty template if none exists yet —
    so the frontend never gets a 404 for this endpoint.
    Pre-populates fields from the project record where available.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    template = db.query(DrawingTemplate).filter(
        DrawingTemplate.project_id == project_id
    ).first()

    if not template:
        # Auto-create from project data
        template = DrawingTemplate(
            project_id      = project_id,
            client_name     = project.client_name     or "",
            client_address  = project.client_address  or "",
            jobsite_name    = project.jobsite_name     or "",
            jobsite_address = project.jobsite_address  or "",
            contractor_name = project.contractor_name  or "",
            architect_name  = project.architect_name   or "",
            drawn_by        = project.drawn_by         or "",
            checked_by      = project.checked_by       or "",
            project_manager = project.project_manager  or "",
        )
        db.add(template)
        db.commit()
        db.refresh(template)

    return {"status": "ok", "template": template_to_dict(template)}


@router.put("/templates/project/{project_id}")
def update_template(project_id: int, data: TemplateUpdate, db: Session = Depends(get_db)):
    template = db.query(DrawingTemplate).filter(
        DrawingTemplate.project_id == project_id
    ).first()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found. Load it first via GET.")

    updates = data.model_dump(exclude_none=True)
    for field, value in updates.items():
        setattr(template, field, value)

    db.commit()
    db.refresh(template)
    return {"status": "ok", "template": template_to_dict(template)}
