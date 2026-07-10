from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.search import SearchRequest, SearchResponse
from app.services.search_service import search_documents

router = APIRouter(prefix="/search", tags=["AI Search"])


@router.post("", response_model=SearchResponse)
def search_route(
    request: SearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    POST /search
    Follows: complete_search_flow.txt, internal_ai_flow.txt, similarity_search.txt

    User Query → Embedding Model → Question Vector → FAISS → Top Similar Chunks → Return → Log Search
    Core retrieval is embedding-based (no LLM API used).
    """
    return search_documents(request, user_id=current_user.user_id, db=db)
