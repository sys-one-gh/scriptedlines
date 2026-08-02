# ─────────────────────────────────────────────────────────────
# api/companies.py
#
# Company API routes.
# POST /api/companies/register                    → create a NEW company +
#                                                     its first user (owner),
#                                                     no auth required
# GET  /api/companies/:id                          → get company info (same company only)
# PUT  /api/companies/:id                          → update company info (same company, admin/owner only)
# GET  /api/companies/:id/join-code                → view the join code (owner/admin only)
# POST /api/companies/:id/join-code/regenerate     → rotate the join code (owner/admin only)
#
# join_code is deliberately never included in company_to_dict()'s
# general response — it's a credential, gated the same way an admin
# secret would be, not ordinary company info every member should see.
# ─────────────────────────────────────────────────────────────

import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.company import Company
from models.user import User, UserRole
from auth import get_current_user, require_same_company, hash_password, create_access_token
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"  # no 0/O/1/I/L — avoids ambiguity


def _generate_join_code(db: Session, length: int = 8) -> str:
    for _ in range(20):
        code = "".join(secrets.choice(_CODE_ALPHABET) for _ in range(length))
        if not db.query(Company).filter(Company.join_code == code).first():
            return code
    raise HTTPException(status_code=500, detail="Could not generate a unique join code")


# ─── SCHEMAS ─────────────────────────────────────────────────

class CompanyRegister(BaseModel):
    company_name: str
    first_name:   str
    last_name:    str
    email:        str
    password:     str
    initials:     Optional[str] = ""


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
        "is_platform_org":      c.is_platform_org,
        "created_at":           str(c.created_at) if c.created_at else None,
        "updated_at":           str(c.updated_at) if c.updated_at else None,
    }


# ─── REGISTER NEW COMPANY ─────────────────────────────────────
@router.post("/companies/register")
def register_company(data: CompanyRegister, db: Session = Depends(get_db)):

    if not data.company_name.strip():
        raise HTTPException(status_code=400, detail="Company name is required")

    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    company = Company(company_name=data.company_name.strip(), join_code=_generate_join_code(db))
    db.add(company)
    db.flush()  # get company.id without committing yet — mirrors drawings.py::create_drawing

    user = User(
        company_id    = company.id,
        first_name    = data.first_name,
        last_name     = data.last_name,
        email         = data.email,
        password_hash = hash_password(data.password),
        initials      = data.initials or "",
        role          = UserRole.owner,
    )
    db.add(user)
    db.commit()  # single commit for both company + user
    db.refresh(user)
    db.refresh(company)

    token = create_access_token(user)
    return {
        "status": "ok",
        "user": {
            "id": user.id, "company_id": user.company_id, "first_name": user.first_name,
            "last_name": user.last_name, "email": user.email, "role": user.role.value,
        },
        "company": {**company_to_dict(company), "join_code": company.join_code},
        "access_token": token,
        "token_type": "bearer",
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


# ─── GET JOIN CODE ────────────────────────────────────────────
@router.get("/companies/{company_id}/join-code")
def get_join_code(company_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    require_same_company(company_id, current_user)

    if current_user.role not in (UserRole.owner, UserRole.admin):
        raise HTTPException(status_code=403, detail="Only an owner or admin can view the join code")

    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    return {"status": "ok", "join_code": company.join_code}


# ─── REGENERATE JOIN CODE ─────────────────────────────────────
@router.post("/companies/{company_id}/join-code/regenerate")
def regenerate_join_code(company_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    require_same_company(company_id, current_user)

    if current_user.role not in (UserRole.owner, UserRole.admin):
        raise HTTPException(status_code=403, detail="Only an owner or admin can regenerate the join code")

    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    company.join_code = _generate_join_code(db)
    db.commit()

    return {"status": "ok", "join_code": company.join_code}
