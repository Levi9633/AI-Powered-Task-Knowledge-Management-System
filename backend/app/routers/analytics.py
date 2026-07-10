from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.dependencies import require_admin
from app.models.user import User
from app.schemas.analytics import AnalyticsResponse
from app.services.analytics_service import get_analytics

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("", response_model=AnalyticsResponse)
def analytics_route(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    GET /analytics — Admin only
    Follows: dashboard_opens.txt → Count Tasks/Completed/Pending/Searches → Return JSON
    Follows: most_searched.txt → Search Logs → Group By Query → Count → Top Results
    """
    return get_analytics(db)
