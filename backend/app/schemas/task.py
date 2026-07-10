from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from enum import Enum


class PriorityEnum(str, Enum):
    low = "Low"
    medium = "Medium"
    high = "High"


class StatusEnum(str, Enum):
    pending = "Pending"
    completed = "Completed"


class TaskCreate(BaseModel):
    title: str
    description: str
    assigned_to: int
    priority: PriorityEnum = PriorityEnum.medium
    due_date: Optional[date] = None


class TaskStatusUpdate(BaseModel):
    status: StatusEnum
    answer: Optional[str] = None


class TaskResponse(BaseModel):
    task_id: int
    title: str
    description: str
    assigned_to: int
    created_by: int
    priority: str
    status: str
    due_date: Optional[date]
    answer: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    assignee_name: Optional[str] = None
    creator_name: Optional[str] = None

    class Config:
        from_attributes = True
