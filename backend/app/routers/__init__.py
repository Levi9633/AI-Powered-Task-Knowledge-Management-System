from app.routers.auth import router as auth_router
from app.routers.tasks import router as tasks_router
from app.routers.documents import router as documents_router
from app.routers.search import router as search_router
from app.routers.analytics import router as analytics_router

__all__ = [
    "auth_router",
    "tasks_router",
    "documents_router",
    "search_router",
    "analytics_router",
]
