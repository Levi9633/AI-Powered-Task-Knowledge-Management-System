from sqlalchemy import (
    Column, Integer, String, BigInteger, DateTime, Enum, ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class ProcessingStatus(str, enum.Enum):
    processing = "Processing"
    completed = "Completed"
    failed = "Failed"


class Document(Base):
    __tablename__ = "documents"

    document_id = Column(Integer, primary_key=True, autoincrement=True)
    uploaded_by = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    original_file_name = Column(String(255), nullable=False)
    file_type = Column(String(20), nullable=False)
    file_size = Column(BigInteger, nullable=True)
    file_path = Column(String(500), nullable=True)
    total_pages = Column(Integer, nullable=True)
    total_chunks = Column(Integer, nullable=True)
    upload_date = Column(DateTime, server_default=func.now())
    processing_status = Column(
        Enum("Processing", "Completed", "Failed"),
        default="Completed"
    )
