# ─────────────────────────────────────────────────────────────
# api/projects.py
#
# project_number — auto-assigned integer per user (1, 2, 3...)
# job_number     — user-assigned, validated unique per user
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from models.project import Project, ProjectGrade, ProjectStandard, ProjectStatus
from pydantic import BaseModel
from typing import Optional
from datetime import date

router = APIRouter()


class ProjectCreate(BaseModel):
    company_id:     int
    created_by:     int
    project_name:   str
    job_number:     Optional[str] = ""
    description:    Optional[str] = ""
    project_grade:  Optional[str] = None
    standard:       Optional[str] = None
    client_name:    Optional[str] = ""
    client_address: Optional[str] = ""
    client_phone:   Optional[str] = ""
    client_fax:     Optional[str] = ""
    client_email:   Optional[str] = ""
    jobsite_name:    Optional[str] = ""
    jobsite_address: Optional[str] = ""
    jobsite_phone:   Optional[str] = ""
    jobsite_fax:     Optional[str] = ""
    jobsite_email:   Optional[str] = ""
    contractor_name: Optional[str] = ""
    architect_name:  Optional[str] = ""
    estimator_name:  Optional[str] = ""
    project_manager: Optional[str] = ""
    draftsman:       Optional[str] = ""
    drawn_by:        Optional[str] = ""
    checked_by:      Optional[str] = ""
    scheduled_start_date:      Optional[date] = None
    scheduled_completion_date: Optional[date] = None
    project_budget:            Optional[float] = None
    compliance_leed: Optional[bool] = False
    compliance_fsc:  Optional[bool] = False
    compliance_fr:   Optional[bool] = False


class ProjectUpdate(BaseModel):
    project_name:   Optional[str] = None
    job_number:     Optional[str] = None
    description:    Optional[str] = None
    project_grade:  Optional[str] = None
    standard:       Optional[str] = None
    client_name:    Optional[str] = None
    client_address: Optional[str] = None
    client_phone:   Optional[str] = None
    client_fax:     Optional[str] = None
    client_email:   Optional[str] = None
    jobsite_name:    Optional[str] = None
    jobsite_address: Optional[str] = None
    jobsite_phone:   Optional[str] = None
    jobsite_fax:     Optional[str] = None
    jobsite_email:   Optional[str] = None
    contractor_name: Optional[str] = None
    architect_name:  Optional[str] = None
    estimator_name:  Optional[str] = None
    project_manager: Optional[str] = None
    draftsman:       Optional[str] = None
    drawn_by:        Optional[str] = None
    checked_by:      Optional[str] = None
    scheduled_start_date:      Optional[date] = None
    scheduled_completion_date: Optional[date] = None
    project_budget:            Optional[float] = None
    status:                    Optional[str]   = None
    compliance_leed: Optional[bool] = None
    compliance_fsc:  Optional[bool] = None
    compliance_fr:   Optional[bool] = None


def project_to_dict(p: Project, db: Session) -> dict:
    return {
        "id":             p.id,
        "company_id":     p.company_id,
        "created_by":     p.created_by,
        "project_name":   p.project_name,
        "project_number": p.project_number,
        "job_number":     p.job_number,
        "description":    p.description,
        "project_grade":  p.project_grade.value  if p.project_grade else None,
        "standard":       p.standard.value        if p.standard      else None,
        "client_name":    p.client_name,
        "client_address": p.client_address,
        "client_phone":   p.client_phone,
        "client_fax":     p.client_fax,
        "client_email":   p.client_email,
        "jobsite_name":    p.jobsite_name,
        "jobsite_address": p.jobsite_address,
        "jobsite_phone":   p.jobsite_phone,
        "jobsite_fax":     p.jobsite_fax,
        "jobsite_email":   p.jobsite_email,
        "contractor_name": p.contractor_name,
        "architect_name":  p.architect_name,
        "estimator_name":  p.estimator_name,
        "project_manager": p.project_manager,
        "draftsman":       p.draftsman,
        "drawn_by":        p.drawn_by,
        "checked_by":      p.checked_by,
        "scheduled_start_date":      str(p.scheduled_start_date)      if p.scheduled_start_date      else None,
        "scheduled_completion_date": str(p.scheduled_completion_date) if p.scheduled_completion_date else None,
        "project_budget":   p.project_budget,
        "compliance_leed":  p.compliance_leed,
        "compliance_fsc":   p.compliance_fsc,
        "compliance_fr":    p.compliance_fr,
        "status":           p.status.value if p.status else None,
        "is_inactive":    p.is_inactive,
        "drawing_count":  db.execute(text("SELECT COUNT(*) FROM drawings WHERE project_id = :pid"), {"pid": p.id}).scalar(),
        "created_at":     str(p.created_at) if p.created_at else None,
        "updated_at":     str(p.updated_at) if p.updated_at else None,
    }


def _next_project_number(user_id: int, db: Session) -> int:
    """Auto-assigns next project number for this user starting from 1."""
    count = db.query(Project).filter(Project.created_by == user_id).count()
    return count + 1


def _validate_job_number(job_number: str, user_id: int, db: Session, exclude_id: int = None):
    """Job number must be unique per user."""
    if not job_number or not job_number.strip():
        return
    query = db.query(Project).filter(
        Project.created_by == user_id,
        Project.job_number == job_number.strip(),
        Project.is_inactive == False,
    )
    if exclude_id:
        query = query.filter(Project.id != exclude_id)
    existing = query.first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Job number '{job_number}' is already used by project #{existing.project_number} — {existing.project_name}"
        )


# ─── CREATE ──────────────────────────────────────────────────
@router.post("/projects")
def create_project(data: ProjectCreate, db: Session = Depends(get_db)):

    # Validate job number uniqueness
    _validate_job_number(data.job_number, data.created_by, db)

    # Resolve enums
    grade = None
    if data.project_grade:
        try: grade = ProjectGrade[data.project_grade]
        except KeyError: raise HTTPException(status_code=400, detail=f"Invalid project_grade: {data.project_grade}")

    standard = None
    if data.standard:
        try: standard = ProjectStandard[data.standard]
        except KeyError: raise HTTPException(status_code=400, detail=f"Invalid standard: {data.standard}")

    project = Project(
        company_id      = data.company_id,
        created_by      = data.created_by,
        project_name    = data.project_name,
        project_number  = _next_project_number(data.created_by, db),
        job_number      = data.job_number     or "",
        description     = data.description    or "",
        project_grade   = grade,
        standard        = standard,
        client_name     = data.client_name    or "",
        client_address  = data.client_address or "",
        client_phone    = data.client_phone   or "",
        client_fax      = data.client_fax     or "",
        client_email    = data.client_email   or "",
        jobsite_name    = data.jobsite_name    or "",
        jobsite_address = data.jobsite_address or "",
        jobsite_phone   = data.jobsite_phone   or "",
        jobsite_fax     = data.jobsite_fax     or "",
        jobsite_email   = data.jobsite_email   or "",
        contractor_name = data.contractor_name or "",
        architect_name  = data.architect_name  or "",
        estimator_name  = data.estimator_name  or "",
        project_manager = data.project_manager or "",
        draftsman       = data.draftsman       or "",
        drawn_by        = data.drawn_by        or "",
        checked_by      = data.checked_by      or "",
        scheduled_start_date      = data.scheduled_start_date,
        scheduled_completion_date = data.scheduled_completion_date,
        project_budget            = data.project_budget,
        compliance_leed = data.compliance_leed or False,
        compliance_fsc  = data.compliance_fsc  or False,
        compliance_fr   = data.compliance_fr   or False,
        status      = ProjectStatus.active,
        is_inactive = False,
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    return {"status": "ok", "project": project_to_dict(project, db)}


# ─── LIST ────────────────────────────────────────────────────
@router.get("/projects")
def list_projects(company_id: int, db: Session = Depends(get_db)):

    projects = db.query(Project).filter(
        Project.company_id == company_id,
        Project.is_inactive == False,
    ).order_by(Project.project_number).all()

    active   = [project_to_dict(p, db) for p in projects if p.status == ProjectStatus.active]
    archived = [project_to_dict(p, db) for p in projects if p.status == ProjectStatus.archived]

    return {
        "status": "ok",
        "groups": [
            {"label": "Active",   "projects": active},
            {"label": "Archived", "projects": archived},
        ]
    }


# ─── GET ─────────────────────────────────────────────────────
@router.get("/projects/{project_id}")
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.is_inactive == False,
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"status": "ok", "project": project_to_dict(project, db)}


# ─── UPDATE ──────────────────────────────────────────────────
@router.put("/projects/{project_id}")
def update_project(project_id: int, data: ProjectUpdate, db: Session = Depends(get_db)):

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    updates = data.model_dump(exclude_none=True)

    # Validate job number uniqueness on update
    if "job_number" in updates:
        _validate_job_number(updates["job_number"], project.created_by, db, exclude_id=project_id)

    if "project_grade" in updates:
        try: project.project_grade = ProjectGrade[updates.pop("project_grade")]
        except KeyError: raise HTTPException(status_code=400, detail="Invalid project_grade")

    if "standard" in updates:
        try: project.standard = ProjectStandard[updates.pop("standard")]
        except KeyError: raise HTTPException(status_code=400, detail="Invalid standard")

    if "status" in updates:
        try: project.status = ProjectStatus[updates.pop("status")]
        except KeyError: raise HTTPException(status_code=400, detail="Invalid status")

    for field, value in updates.items():
        setattr(project, field, value)

    db.commit()
    db.refresh(project)

    return {"status": "ok", "project": project_to_dict(project, db)}


# ─── SOFT DELETE ─────────────────────────────────────────────
@router.delete("/projects/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.is_inactive = True
    project.status      = ProjectStatus.archived
    db.commit()
    return {"status": "ok", "message": f"Project {project_id} archived"}