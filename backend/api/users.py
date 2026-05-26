# ─────────────────────────────────────────────────────────────
# api/users.py
#
# User API routes.
# POST /api/users/register  → create new user
# POST /api/users/login     → authenticate user
# GET  /api/users/:id       → get user
# PUT  /api/users/:id       → update user
#
# Passwords are hashed with bcrypt directly (no passlib).
# SHA256 pre-hash bypasses bcrypt 72-byte limit.
# JWT authentication is added in a later phase.
# ─────────────────────────────────────────────────────────────
 
import hashlib
import bcrypt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.user import User, UserRole
from models.company import Company
from pydantic import BaseModel
from typing import Optional
 
router = APIRouter()
 
# ─── PASSWORD HASHING ────────────────────────────────────────
# SHA256 pre-hash bypasses bcrypt 72-byte limit.
# bcrypt used directly — no passlib dependency.
 
def _prehash(password: str) -> bytes:
    """SHA256 pre-hash — output is always 64 hex chars (well under 72 bytes)."""
    return hashlib.sha256(password.encode()).hexdigest().encode()
 
def hash_password(password: str) -> str:
    return bcrypt.hashpw(_prehash(password), bcrypt.gensalt()).decode()
 
def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(_prehash(plain), hashed.encode())
 
 
# ─── SCHEMAS ─────────────────────────────────────────────────
 
class UserRegister(BaseModel):
    company_id: int
    first_name: str
    last_name:  str
    email:      str
    password:   str
    initials:   Optional[str] = ""
    role:       Optional[str] = "draftsman"
 
 
class UserLogin(BaseModel):
    email:    str
    password: str
 
 
class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name:  Optional[str] = None
    initials:   Optional[str] = None
    role:       Optional[str] = None
 
 
def user_to_dict(u: User) -> dict:
    return {
        "id":         u.id,
        "company_id": u.company_id,
        "first_name": u.first_name,
        "last_name":  u.last_name,
        "email":      u.email,
        "role":       u.role.value if u.role else None,
        "initials":   u.initials,
        "is_active":  u.is_active,
        "last_login": str(u.last_login) if u.last_login else None,
        "created_at": str(u.created_at) if u.created_at else None,
    }
 
 
# ─── REGISTER ────────────────────────────────────────────────
@router.post("/users/register")
def register(data: UserRegister, db: Session = Depends(get_db)):
 
    company = db.query(Company).filter(Company.id == data.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
 
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
 
    try:
        role = UserRole[data.role]
    except KeyError:
        role = UserRole.draftsman
 
    user = User(
        company_id    = data.company_id,
        first_name    = data.first_name,
        last_name     = data.last_name,
        email         = data.email,
        password_hash = hash_password(data.password),
        initials      = data.initials or "",
        role          = role,
    )
 
    db.add(user)
    db.commit()
    db.refresh(user)
 
    return {"status": "ok", "user": user_to_dict(user)}
 
 
# ─── LOGIN ───────────────────────────────────────────────────
@router.post("/users/login")
def login(data: UserLogin, db: Session = Depends(get_db)):
 
    user = db.query(User).filter(
        User.email == data.email,
        User.is_active == True
    ).first()
 
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
 
    from sqlalchemy.sql import func
    user.last_login = func.now()
    db.commit()
    db.refresh(user)
 
    return {"status": "ok", "user": user_to_dict(user)}
 
 
# ─── GET USER ────────────────────────────────────────────────
@router.get("/users/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
 
    user = db.query(User).filter(
        User.id == user_id,
        User.is_active == True
    ).first()
 
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
 
    return {"status": "ok", "user": user_to_dict(user)}
 
 
# ─── UPDATE USER ─────────────────────────────────────────────
@router.put("/users/{user_id}")
def update_user(user_id: int, data: UserUpdate, db: Session = Depends(get_db)):
 
    user = db.query(User).filter(User.id == user_id).first()
 
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
 
    if data.first_name is not None:
        user.first_name = data.first_name
    if data.last_name is not None:
        user.last_name = data.last_name
    if data.initials is not None:
        user.initials = data.initials
    if data.role is not None:
        try:
            user.role = UserRole[data.role]
        except KeyError:
            pass
 
    db.commit()
    db.refresh(user)
 
    return {"status": "ok", "user": user_to_dict(user)}