from typing import List
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.models.user import User
from app.schemas.document import DocumentResponse
from app.services.document_service import upload_document, get_documents, delete_document

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.get("", response_model=List[DocumentResponse])
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """GET /documents — all authenticated users can view documents."""
    return get_documents(db)


@router.post("", response_model=DocumentResponse)
def upload_document_route(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    POST /documents — Admin only
    Follows: admin_flow.txt — Select PDF/TXT → Validate → Extract → Chunk → Embed → FAISS → MySQL
    Authorization: JWT → Role → Admin? → YES → Upload Allowed (admin_uploads.txt)
    """
    return upload_document(file, uploaded_by=current_user.user_id, db=db)


@router.delete("/{document_id}")
def delete_document_route(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """DELETE /documents/{id} — Admin only."""
    return delete_document(document_id, db)
