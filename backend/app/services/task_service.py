"""
Task Service
Follows:
  admin_workflow.txt   → Admin: Create Task → Enter Title/Description/AssignUser → Save → DB → User sees task
  user_workflow.txt    → User: Dashboard → My Tasks → Open → Read → Complete → Status Updated → Activity Logged
  task_status_flow.txt → Pending → User clicks Complete → Completed → Activity Log → Analytics Updated
  database_flow.txt    → Task → Assigned User → Status → Updated → Analytics Updated
  dynamic_filter_flow.txt → /tasks?status=completed → Database Filter → Return
"""
from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.models.task import Task
from app.models.user import User
from app.schemas.task import TaskCreate, TaskStatusUpdate, TaskResponse
from app.services.activity_service import log_activity


def _build_response(task: Task) -> TaskResponse:
    return TaskResponse(
        task_id=task.task_id,
        title=task.title,
        description=task.description,
        assigned_to=task.assigned_to,
        created_by=task.created_by,
        priority=task.priority,
        status=task.status,
        due_date=task.due_date,
        created_at=task.created_at,
        updated_at=task.updated_at,
        answer=task.answer,
        assignee_name=task.assignee.full_name if task.assignee else None,
        creator_name=task.creator.full_name if task.creator else None,
    )


def get_tasks(
    db: Session,
    current_user: User,
    status_filter: Optional[str] = None,
    assigned_to: Optional[int] = None,
) -> List[TaskResponse]:
    """
    Dynamic Filtering:  /tasks?status=Completed | /tasks?assigned_to=2
    Follows: dynamic_filter_flow.txt
    """
    query = db.query(Task)

    # Regular users only see their own tasks
    if current_user.role_id != 1:
        query = query.filter(Task.assigned_to == current_user.user_id)

    # Dynamic filters
    if status_filter:
        query = query.filter(Task.status == status_filter)
    if assigned_to:
        query = query.filter(Task.assigned_to == assigned_to)

    tasks = query.options(
        joinedload(Task.assignee),
        joinedload(Task.creator)
    ).order_by(Task.created_at.desc()).all()
    return [_build_response(t) for t in tasks]


def create_task(task_data: TaskCreate, created_by: int, db: Session) -> TaskResponse:
    """
    Admin creates task and assigns to user.
    Logs TASK_CREATED event per logged_events.txt.
    """
    # Verify assigned user exists
    user = db.query(User).filter(User.user_id == task_data.assigned_to).first()
    if not user:
        raise HTTPException(status_code=404, detail="Assigned user not found")

    task = Task(
        title=task_data.title,
        description=task_data.description,
        assigned_to=task_data.assigned_to,
        created_by=created_by,
        priority=task_data.priority.value,
        due_date=task_data.due_date,
        status="Pending",
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    log_activity(
        db,
        user_id=created_by,
        activity_type="TASK_CREATED",
        activity_description=f"Task '{task.title}' created and assigned to user {task_data.assigned_to}",
    )
    return _build_response(task)


def update_task_status(
    task_id: int,
    status_data: TaskStatusUpdate,
    current_user: User,
    db: Session,
) -> TaskResponse:
    """
    User clicks Complete → Completed → Activity Log → Analytics Updated
    Follows: task_status_flow.txt & user_workflow.txt
    """
    task = db.query(Task).filter(Task.task_id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Only the assigned user or admin can update
    if current_user.role_id != 1 and task.assigned_to != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorised to update this task")

    task.status = status_data.status.value
    if status_data.answer is not None:
        task.answer = status_data.answer
    db.commit()
    db.refresh(task)

    log_activity(
        db,
        user_id=current_user.user_id,
        activity_type="TASK_UPDATE",
        activity_description=f"Task '{task.title}' status updated to {task.status}",
    )
    return _build_response(task)


def get_users_list(db: Session) -> list:
    """Return all non-admin users for task assignment dropdown."""
    users = db.query(User).filter(User.role_id == 2, User.is_active == True).all()
    return [{"user_id": u.user_id, "full_name": u.full_name, "email": u.email} for u in users]
