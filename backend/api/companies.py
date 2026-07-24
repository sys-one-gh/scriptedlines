# ─────────────────────────────────────────────────────────────
# api/companies.py
#
# Company API routes.
# GET  /api/companies/:id  → get company info (same company only)
# PUT  /api/companies/:id  → update company info (same company, admin/owner only)
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.company import Company
from models.user import User, UserRole
from auth import get_current_user, require_same_company
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


# ─── SCHEMAS ─────────────────────────────────────────────────

class CompanyUpdate(BaseModel):
    company_name:        Optional[str] = None
    company_address:     Optional[str] = None
    company_city:        Optional[str] = None
    company_province:    Optional[str] = None
    company_postal_code: Optional[str] = None
    company_phone:       Optional[str] = None
    company_fax:         Optional[str] = None
    company_email:       Optional[str] = None
    company_website:     Optional[str] = None
    logo_url:            Optional[str] = None


def company_to_dict(c: Company) -> dict:
    return {
        "id":                   c.id,
        "company_name":         c.company_name,
        "company_address":      c.company_address,
        "company_city":         c.company_city,
        "company_province":     c.company_province,
        "company_postal_code":  c.company_postal_code,
        "company_phone":        c.company_phone,
        "company_fax":          c.company_fax,
        "company_email":        c.company_email,
        "company_website":      c.company_website,
        "logo_url":             c.logo_url,
        "is_active":            c.is_active,
        "created_at":           str(c.created_at) if c.created_at else None,
        "updated_at":           str(c.updated_at) if c.updated_at else None,
    }


# ─── GET COMPANY ─────────────────────────────────────────────
@router.get("/companies/{company_id}")
def get_company(company_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    require_same_company(company_id, current_user)

    company = db.query(Company).filter(
        Company.id == company_id,
        Company.is_active == True
    ).first()

    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    return {"status": "ok", "company": company_to_dict(company)}


# ─── UPDATE COMPANY ──────────────────────────────────────────
@router.put("/companies/{company_id}")
def update_company(company_id: int, data: CompanyUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    require_same_company(company_id, current_user)

    if current_user.role not in (UserRole.owner, UserRole.admin):
        raise HTTPException(status_code=403, detail="Only an owner or admin can edit company details")

    company = db.query(Company).filter(Company.id == company_id).first()

    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(company, field, value)

    db.commit()
    db.refresh(company)

    return {"status": "ok", "company": company_to_dict(company)}
