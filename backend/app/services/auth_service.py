"""
Authentication Service
Follows: Backend_flow.txt & user_flow.txt (Authentication Workflow)

  Receive Login Request → Find User → Compare Password
  → YES: Generate JWT → Return Token + User Role
  → NO: 401 Unauthorized
"""
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from passlib.context import CryptContext

from app.models.user import User
from app.core.jwt import create_access_token
from app.schemas.auth import LoginRequest, TokenResponse
from app.services.activity_service import log_activity

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def login(request: LoginRequest, db: Session, ip_address: str = None) -> TokenResponse:
    """
    Authenticate user and return JWT token with role information.
    Logs LOGIN event on success per logged_events.txt.
    """
    user = db.query(User).filter(User.email == request.email).first()

    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    # Update last_login timestamp
    user.last_login = datetime.utcnow()
    db.commit()

    # Generate JWT with user_id and role_id embedded
    token = create_access_token({"user_id": user.user_id, "role_id": user.role_id})

    # Log LOGIN activity (logged_events.txt)
    log_activity(
        db,
        user_id=user.user_id,
        activity_type="LOGIN",
        activity_description=f"{user.full_name} logged in",
        ip_address=ip_address,
    )

    return TokenResponse(
        access_token=token,
        user_id=user.user_id,
        full_name=user.full_name,
        role_id=user.role_id,
        role_name=user.role.role_name,
    )
