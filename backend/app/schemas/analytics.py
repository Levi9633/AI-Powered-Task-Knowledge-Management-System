from pydantic import BaseModel
from typing import List


class MostSearchedQuery(BaseModel):
    search_query: str
    count: int


class RecentActivity(BaseModel):
    activity_type: str
    activity_description: str
    user_name: str
    created_at: str


class UserTaskMetric(BaseModel):
    user_name: str
    total: int
    completed: int
    pending: int

class ApiEndpointHit(BaseModel):
    endpoint: str
    admin_hits: int
    user_hits: int
    anonymous_hits: int
    total_hits: int


class AnalyticsResponse(BaseModel):
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    total_documents: int
    total_users: int
    total_searches: int
    most_searched_queries: List[MostSearchedQuery]
    recent_activities: List[RecentActivity]
    task_completion_rate: float
    user_task_metrics: List[UserTaskMetric] = []
    api_hits: List[ApiEndpointHit] = []
