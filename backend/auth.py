# ─────────────────────────────────────────────────────────────
# auth.py
#
# JWT issuing/verification and the get_current_user dependency
# every protected route depends on. Tenant isolation (a user can
# only touch rows belonging to their own company) is enforced via
# require_same_company(), called after loading the target row.
#
# Password hashing lives here too (not in api/users.py) since it's
# an auth concern every router is allowed to import from — the
# convention in this codebase is that api/*.py files never import
# from each other, only from models.* and auth.py.
# ─────────────────────────────────────────────────────────────

import os
import hashlib
import bcrypt
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from database import get_db
from models.user import User, UserRole

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not JWT_SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY environment variable is not set")

JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

_bearer_scheme = HTTPBearer(auto_error=False)


# ─── PASSWORD HASHING ────────────────────────────────────────
# SHA256 pre-hash bypasses bcrypt's 72-byte input limit.
# bcrypt used directly — no passlib dependency.

def _prehash(password: str) -> bytes:
    """SHA256 pre-hash — output is always 64 hex chars (well under 72 bytes)."""
    return hashlib.sha256(password.encode()).hexdigest().encode()

def hash_password(password: str) -> str:
    return bcrypt.hashpw(_prehash(password), bcrypt.gensalt()).decode()

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(_prehash(plain), hashed.encode())


def create_access_token(user: User) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub":                str(user.id),
        "company_id":         user.company_id,
        "role":               user.role.value if user.role else None,
        "iat":                now,
        "exp":                now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    # Only `sub` is read from the token — `role`/`company_id` in the
    # payload exist for frontend convenience only. The user row is
    # re-fetched live so every permission check
    # downstream (require_same_company, require_platform_admin, ...)
    # reflects current DB state, not a stale token claim.
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return user


def require_same_company(resource_company_id: int, user: User):
    """Raises 404 (not 403) so a foreign-tenant ID doesn't confirm it exists."""
    if resource_company_id != user.company_id:
        raise HTTPException(status_code=404, detail="Not found")


def require_not_viewer(user: User, action: str):
    """Viewer-role users are read-only for projects/drawings. Raises 403,
    unlike require_same_company's 404 — the user already knows this
    resource exists (it's in their own company), so there's no
    enumeration risk in telling them why they're blocked."""
    if user.role == UserRole.viewer:
        raise HTTPException(status_code=403, detail=f"Viewer accounts don't have permission to {action}.")


def require_platform_admin(user: User):
    """
    Gates ScriptedLines-internal endpoints (none exist yet — this is
    the reusable guard future ones will use). Checks UserRole.scriptedlines_admin
    specifically — not to be confused with UserRole.admin, which is a
    company-scoped role. Raises 404, matching require_same_company's
    reasoning — don't confirm an endpoint exists to an unauthorized caller.
    """
    if user.role != UserRole.scriptedlines_admin:
        raise HTTPException(status_code=404, detail="Not found")
