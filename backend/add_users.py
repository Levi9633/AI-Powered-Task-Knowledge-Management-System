import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.user import User
from app.models.role import Role
from app.services.auth_service import hash_password

def main():
    db = SessionLocal()

    # Get User role ID
    user_role = db.query(Role).filter(Role.role_name == "User").first()
    role_id = user_role.role_id if user_role else 2

    # Update existing "John Doe" (admin or user)
    john = db.query(User).filter(User.full_name == "John Doe").first()
    if john:
        john.full_name = "Rahul Sharma"
        db.commit()
        print(f"Updated John Doe to {john.full_name}")

    # Users to add
    new_users = [
        {"email": "priya@example.com", "full_name": "Priya Patel", "password": "password123"},
        {"email": "amit@example.com", "full_name": "Amit Kumar", "password": "password123"},
        {"email": "sneha@example.com", "full_name": "Sneha Gupta", "password": "password123"},
        {"email": "vikram@example.com", "full_name": "Vikram Singh", "password": "password123"},
        {"email": "anjali@example.com", "full_name": "Anjali Desai", "password": "password123"}
    ]

    for nu in new_users:
        existing = db.query(User).filter(User.email == nu["email"]).first()
        if not existing:
            user = User(
                email=nu["email"],
                password_hash=hash_password(nu["password"]),
                full_name=nu["full_name"],
                role_id=role_id,
                is_active=True
            )
            db.add(user)
            print(f"Added {nu['full_name']}")

    db.commit()
    print("All done!")

if __name__ == "__main__":
    main()
