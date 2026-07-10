"""
AI-Powered Task & Knowledge Management System — FastAPI Backend
Startup: creates tables, seeds roles and default users.
"""
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from jose import jwt

from app.database import engine, SessionLocal
from app.models import Role, User, Document, Task, ActivityLog, SearchLog, ApiHit
from app.database import Base
from app.routers import (
    auth_router,
    tasks_router,
    documents_router,
    search_router,
    analytics_router,
)
from app.services.auth_service import hash_password
from app.config import settings

# ── Create all tables ──────────────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI-Powered Task & Knowledge Management System",
    description="MVP with JWT auth, RBAC, document upload, FAISS semantic search, task management, activity logging, and analytics.",
    version="1.0.0",
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API Logging Middleware ─────────────────────────────────────────────────────
class ApiLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if not path.startswith(("/auth", "/tasks", "/documents", "/search", "/analytics")):
            return await call_next(request)

        role = "Anonymous"
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
                role_id = payload.get("role_id")
                if role_id == 1:
                    role = "Admin"
                elif role_id == 2:
                    role = "User"
            except Exception:
                pass

        response = await call_next(request)

        db = SessionLocal()
        db.add(ApiHit(endpoint=path, method=request.method, user_role=role))
        db.commit()
        db.close()
        return response

app.add_middleware(ApiLoggingMiddleware)

# ── Static file serving for uploads ──────────────────────────────────────────
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# ── Include routers ────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(tasks_router)
app.include_router(documents_router)
app.include_router(search_router)
app.include_router(analytics_router)


# ── Seed database on startup ──────────────────────────────────────────────────
@app.on_event("startup")
def seed_database():
    """Seed roles and default users if they don't exist."""
    db = SessionLocal()
    try:
        # Seed Roles
        if db.query(Role).count() == 0:
            db.add_all([
                Role(role_id=1, role_name="Admin", description="System Administrator"),
                Role(role_id=2, role_name="User", description="Regular User"),
            ])
            db.commit()

        # Seed Admin user
        if not db.query(User).filter(User.email == "admin@demo.com").first():
            db.add(User(
                role_id=1,
                full_name="Admin User",
                email="admin@demo.com",
                password_hash=hash_password("password123"),
                is_active=True,
            ))
            db.commit()

        # Seed regular User
        if not db.query(User).filter(User.email == "user@demo.com").first():
            db.add(User(
                role_id=2,
                full_name="John Doe",
                email="user@demo.com",
                password_hash=hash_password("password123"),
                is_active=True,
            ))
            db.commit()

    finally:
        db.close()


@app.get("/", tags=["Health"])
def root():
    return {"message": "AI-Powered Task & Knowledge Management API is running", "version": "1.0.0"}
