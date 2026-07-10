from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class SearchLog(Base):
    __tablename__ = "search_logs"

    search_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    search_query = Column(Text, nullable=False)
    results_found = Column(Integer, default=0)
    searched_at = Column(DateTime, server_default=func.now())
