"""
Analytics Service
Follows: dashboard_opens.txt & most_searched.txt (Analytics Workflow) & entire_project_flow.txt

  Analytics API → Count Tasks → Count Completed → Count Pending → Count Searches → Return JSON

  Most Searched: Search Logs → Group By Query → Count → Top Results
"""
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.task import Task
from app.models.document import Document
from app.models.user import User
from app.models.activity_log import ActivityLog
from app.models.search_log import SearchLog
from app.models.api_hit import ApiHit
from app.schemas.analytics import AnalyticsResponse, MostSearchedQuery, RecentActivity, UserTaskMetric, ApiEndpointHit


def get_analytics(db: Session) -> AnalyticsResponse:
    """
    Reads database tables to aggregate all analytics data.
    Follows: entire_project_flow.txt → Read Database → Task Counts → Completed vs Pending
             → Most Searched Queries → Dashboard
    """
    # Count Tasks (dashboard_opens.txt)
    total_tasks = db.query(func.count(Task.task_id)).scalar() or 0
    completed_tasks = db.query(func.count(Task.task_id)).filter(Task.status == "Completed").scalar() or 0
    pending_tasks = db.query(func.count(Task.task_id)).filter(Task.status == "Pending").scalar() or 0

    # Count Documents and Users
    total_documents = db.query(func.count(Document.document_id)).scalar() or 0
    total_users = db.query(func.count(User.user_id)).filter(User.role_id == 2).scalar() or 0

    # Count Searches
    total_searches = db.query(func.count(SearchLog.search_id)).scalar() or 0

    # Most Searched Queries (most_searched.txt: Group By Query → Count → Top Results)
    top_queries = (
        db.query(SearchLog.search_query, func.count(SearchLog.search_id).label("count"))
        .group_by(SearchLog.search_query)
        .order_by(func.count(SearchLog.search_id).desc())
        .limit(10)
        .all()
    )
    most_searched = [
        MostSearchedQuery(search_query=q.search_query, count=q.count)
        for q in top_queries
    ]

    # Recent Activity (last 20 events)
    recent = (
        db.query(ActivityLog, User.full_name)
        .join(User, ActivityLog.user_id == User.user_id)
        .order_by(ActivityLog.created_at.desc())
        .limit(20)
        .all()
    )
    recent_activities = [
        RecentActivity(
            activity_type=log.activity_type,
            activity_description=log.activity_description or "",
            user_name=name,
            created_at=log.created_at.isoformat(),
        )
        for log, name in recent
    ]

    # Task completion rate
    completion_rate = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0.0

    # User Task Metrics (for per-user graphs)
    user_task_metrics = []
    users = db.query(User).filter(User.role_id == 2).all()
    for u in users:
        u_total = db.query(func.count(Task.task_id)).filter(Task.assigned_to == u.user_id).scalar() or 0
        u_completed = db.query(func.count(Task.task_id)).filter(Task.assigned_to == u.user_id, Task.status == "Completed").scalar() or 0
        u_pending = db.query(func.count(Task.task_id)).filter(Task.assigned_to == u.user_id, Task.status == "Pending").scalar() or 0
        user_task_metrics.append(UserTaskMetric(
            user_name=u.full_name,
            total=u_total,
            completed=u_completed,
            pending=u_pending
        ))

    # API Hits Aggregation
    api_hits_data = db.query(
        ApiHit.endpoint,
        ApiHit.user_role,
        func.count(ApiHit.hit_id).label("count")
    ).group_by(ApiHit.endpoint, ApiHit.user_role).all()

    endpoint_stats = {}
    for row in api_hits_data:
        ep = row.endpoint
        role = row.user_role
        count = row.count
        if ep not in endpoint_stats:
            endpoint_stats[ep] = {"admin": 0, "user": 0, "anon": 0, "total": 0}
        
        endpoint_stats[ep]["total"] += count
        if role == "Admin":
            endpoint_stats[ep]["admin"] += count
        elif role == "User":
            endpoint_stats[ep]["user"] += count
        else:
            endpoint_stats[ep]["anon"] += count

    api_hits = []
    for ep, stats in endpoint_stats.items():
        api_hits.append(ApiEndpointHit(
            endpoint=ep,
            admin_hits=stats["admin"],
            user_hits=stats["user"],
            anonymous_hits=stats["anon"],
            total_hits=stats["total"]
        ))
    
    # Sort API hits by total hits descending
    api_hits.sort(key=lambda x: x.total_hits, reverse=True)


    return AnalyticsResponse(
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        pending_tasks=pending_tasks,
        total_documents=total_documents,
        total_users=total_users,
        total_searches=total_searches,
        most_searched_queries=most_searched,
        recent_activities=recent_activities,
        task_completion_rate=completion_rate,
        user_task_metrics=user_task_metrics,
        api_hits=api_hits,
    )
