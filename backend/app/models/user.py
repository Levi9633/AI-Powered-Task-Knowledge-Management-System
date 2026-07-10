from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    role_id = Column(Integer, ForeignKey("roles.role_id"), nullable=False)
    full_name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    profile_image = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    role = relationship("Role", backref="users")
    documents = relationship("Document", foreign_keys="Document.uploaded_by", backref="uploader")
    tasks_assigned = relationship("Task", foreign_keys="Task.assigned_to", backref="assignee")
    tasks_created = relationship("Task", foreign_keys="Task.created_by", backref="creator")
    activity_logs = relationship("ActivityLog", backref="user")
    search_logs = relationship("SearchLog", backref="user")
