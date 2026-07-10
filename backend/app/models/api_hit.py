from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database import Base

class ApiHit(Base):
    __tablename__ = "api_hits"

    hit_id = Column(Integer, primary_key=True, autoincrement=True)
    endpoint = Column(String(255), nullable=False)
    method = Column(String(10), nullable=False)
    user_role = Column(String(50), nullable=True) # "Admin", "User", "Anonymous"
    created_at = Column(DateTime, server_default=func.now())
