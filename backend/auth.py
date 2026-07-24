# ─────────────────────────────────────────────────────────────
# auth.py
#
# JWT issuing/verification and the get_current_user dependency
# every protected route depends on. Tenant isolation (a user can
# only touch rows belonging to their own company) is enforced via
# require_same_company(), called after loading the target row.
# ─────────────────────────────────────────────────────────────

import os
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from database import get_db
from models.user import User

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not JWT_SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY environment variable is not set")

JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

_bearer_scheme = HTTPBearer(auto_error=False)


def create_access_token(user: User) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub":        str(user.id),
        "company_id": user.company_id,
        "role":       user.role.value if user.role else None,
        "iat":        now,
        "exp":        now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
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
