from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DocumentResponse(BaseModel):
    document_id: int
    file_name: str
    original_file_name: str
    file_type: str
    file_size: Optional[int]
    total_pages: Optional[int]
    total_chunks: Optional[int]
    upload_date: datetime
    processing_status: str
    uploaded_by: int
    uploader_name: Optional[str] = None

    class Config:
        from_attributes = True
