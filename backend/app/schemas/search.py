from pydantic import BaseModel
from typing import List


class SearchRequest(BaseModel):
    query: str
    top_k: int = 8


class SearchResult(BaseModel):
    document_id: int
    file_name: str
    chunk_text: str
    page_number: int
    similarity_score: float


class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]
    total_results: int
    llm_response: str
