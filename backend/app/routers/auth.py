from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.auth import LoginRequest, TokenResponse
from app.services.auth_service import login

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login_route(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    """
    POST /auth/login
    Follows: user_flow.txt → Backend_flow.txt (Authentication Workflow)
    Returns JWT token + user role for frontend to store and redirect.
    """
    ip_address = request.client.host if request.client else None
    return login(payload, db, ip_address)
