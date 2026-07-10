from app.database import SessionLocal
from app.models.activity_log import ActivityLog
from app.models.api_hit import ApiHit
from app.models.user import User

def backfill():
    db = SessionLocal()
    
    # Get all activity logs
    logs = db.query(ActivityLog, User.role_id).join(User, ActivityLog.user_id == User.user_id).all()
    
    for log, role_id in logs:
        # Determine role
        role = "Admin" if role_id == 1 else "User"
        
        # Map activity_type to endpoint
        endpoint = "/unknown"
        method = "POST"
        
        if log.activity_type == "LOGIN":
            endpoint = "/auth/login"
        elif log.activity_type == "SEARCH":
            endpoint = "/search"
            method = "GET"
        elif log.activity_type == "TASK_CREATED":
            endpoint = "/tasks"
        elif log.activity_type == "TASK_UPDATE":
            endpoint = "/tasks/{id}"
            method = "PUT"
        elif log.activity_type == "DOCUMENT_UPLOAD":
            endpoint = "/documents/upload"
            
        # Add to api_hits
        hit = ApiHit(
            endpoint=endpoint,
            method=method,
            user_role=role,
            created_at=log.created_at
        )
        db.add(hit)
        
    db.commit()
    db.close()
    print(f"Backfilled {len(logs)} API hits from ActivityLog.")

if __name__ == "__main__":
    backfill()
