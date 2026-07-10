from typing import Optional, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.models.user import User
from app.schemas.task import TaskCreate, TaskStatusUpdate, TaskResponse
from app.services.task_service import get_tasks, create_task, update_task_status, get_users_list

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.get("", response_model=List[TaskResponse])
def list_tasks(
    status: Optional[str] = None,
    assigned_to: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    GET /tasks | /tasks?status=Pending | /tasks?assigned_to=2
    Follows: dynamic_filter_flow.txt — dynamic database filtering
    RBAC: Users see only their tasks; Admins see all.
    """
    return get_tasks(db, current_user, status_filter=status, assigned_to=assigned_to)


@router.post("", response_model=TaskResponse)
def create_task_route(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    POST /tasks — Admin only
    Follows: admin_workflow.txt — Create Task → Assign User → Save → DB
    """
    return create_task(task_data, created_by=current_user.user_id, db=db)


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task_status_route(
    task_id: int,
    status_data: TaskStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    PATCH /tasks/{id} — Any authenticated user (only assigned user or admin)
    Follows: task_status_flow.txt → Pending → Complete → Activity Log → Analytics Updated
    """
    return update_task_status(task_id, status_data, current_user, db)


@router.get("/users", response_model=List[dict])
def list_users_for_assignment(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """GET /tasks/users — returns list of users for task assignment (Admin only)."""
    return get_users_list(db)
