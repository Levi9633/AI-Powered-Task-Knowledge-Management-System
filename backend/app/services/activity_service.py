"""
Activity Service
Follows: activity_logging_flow.txt & logged_events.txt

  User Action → Activity Service → Save (User ID, Action, Timestamp) → Database

Logged events: LOGIN, DOCUMENT_UPLOAD, TASK_CREATED, TASK_UPDATE, SEARCH
"""
from sqlalchemy.orm import Session
from app.models.activity_log import ActivityLog


def log_activity(
    db: Session,
    user_id: int,
    activity_type: str,
    activity_description: str,
    ip_address: str = None,
) -> None:
    """Persist an activity record — called after every key user action."""
    log = ActivityLog(
        user_id=user_id,
        activity_type=activity_type,
        activity_description=activity_description,
        ip_address=ip_address,
    )
    db.add(log)
    db.commit()
