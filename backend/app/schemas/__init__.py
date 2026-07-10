from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.task import TaskCreate, TaskStatusUpdate, TaskResponse
from app.schemas.document import DocumentResponse
from app.schemas.search import SearchRequest, SearchResponse, SearchResult
from app.schemas.analytics import AnalyticsResponse, MostSearchedQuery, RecentActivity

__all__ = [
    "LoginRequest", "TokenResponse",
    "TaskCreate", "TaskStatusUpdate", "TaskResponse",
    "DocumentResponse",
    "SearchRequest", "SearchResponse", "SearchResult",
    "AnalyticsResponse", "MostSearchedQuery", "RecentActivity",
]
