"""
Document Service
Follows: admin_flow.txt & internal_processing.txt (Document Upload Workflow)

  Select PDF/TXT → Upload → Backend receives file → Validate Extension
  → Extract Text → Chunk Text → Generate Embeddings → Store Embeddings
  → Save Metadata → Log Activity → Success
"""
import os
import uuid
from typing import List
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, UploadFile
import numpy as np

from app.config import settings
from app.models.document import Document
from app.models.user import User
from app.schemas.document import DocumentResponse
from app.services.activity_service import log_activity
from app.core.faiss_store import faiss_store
from app.utils.text_processing import extract_text, chunk_text

# Lazy-load embedding model to avoid slow startup
_embedding_model = None


def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        from sentence_transformers import SentenceTransformer
        _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedding_model


ALLOWED_TYPES = {"pdf", "txt", "docx"}


def _build_response(doc: Document) -> DocumentResponse:
    return DocumentResponse(
        document_id=doc.document_id,
        file_name=doc.file_name,
        original_file_name=doc.original_file_name,
        file_type=doc.file_type,
        file_size=doc.file_size,
        total_pages=doc.total_pages,
        total_chunks=doc.total_chunks,
        upload_date=doc.upload_date,
        processing_status=doc.processing_status,
        uploaded_by=doc.uploaded_by,
        uploader_name=doc.uploader.full_name if doc.uploader else None,
    )


def upload_document(
    file: UploadFile,
    uploaded_by: int,
    db: Session,
) -> DocumentResponse:
    """Full document upload pipeline per admin_flow.txt."""

    # Step 1: Validate Extension
    original_name = file.filename
    ext = original_name.rsplit(".", 1)[-1].lower() if "." in original_name else ""
    if ext not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, and TXT files are allowed")

    # Step 2: Save file to disk
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_name)
    content = file.file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    file_size = len(content)

    # Step 3: Save initial DB record with Processing status
    doc = Document(
        uploaded_by=uploaded_by,
        file_name=unique_name,
        original_file_name=original_name,
        file_type=ext.upper(),
        file_size=file_size,
        file_path=file_path,
        processing_status="Processing",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    try:
        # Step 4: Extract Text (returns list of page_data dicts)
        pages_data = extract_text(file_path, ext)

        # Use the number of extracted pages to avoid reading the PDF twice
        total_pages = pages_data[-1]["page_number"] if pages_data else 0

        # Step 5: Chunk Text
        chunks_data = chunk_text(pages_data)
        
        # Step 6: Generate Embeddings
        # Extract just the text strings for the embedding model
        text_strings = [c["chunk_text"] for c in chunks_data]
        
        model = get_embedding_model()
        embeddings = model.encode(text_strings, convert_to_numpy=True).astype(np.float32)

        # Step 7: Store in FAISS
        faiss_store.add_chunks(
            document_id=doc.document_id,
            file_name=original_name,
            chunks=chunks_data,
            embeddings=embeddings,
        )

        # Step 8: Save Metadata to MySQL
        doc.total_pages = total_pages
        doc.total_chunks = len(chunks_data)
        doc.processing_status = "Completed"
        db.commit()
        db.refresh(doc)

        # Step 9: Log Activity (logged_events.txt)
        log_activity(
            db,
            user_id=uploaded_by,
            activity_type="DOCUMENT_UPLOAD",
            activity_description=f"Document '{original_name}' uploaded with {len(chunks_data)} chunks",
        )

    except Exception as e:
        doc.processing_status = "Failed"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Document processing failed: {str(e)}")

    return _build_response(doc)


def get_documents(db: Session) -> List[DocumentResponse]:
    docs = db.query(Document).options(joinedload(Document.uploader)).order_by(Document.upload_date.desc()).all()
    return [_build_response(d) for d in docs]


def delete_document(document_id: int, db: Session) -> dict:
    doc = db.query(Document).filter(Document.document_id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Remove file from disk
    if doc.file_path and os.path.exists(doc.file_path):
        os.remove(doc.file_path)

    # Remove from FAISS index
    faiss_store.remove_document(document_id)

    # Remove from DB
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully"}
