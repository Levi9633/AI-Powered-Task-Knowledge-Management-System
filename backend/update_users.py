import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.user import User

def main():
    db = SessionLocal()

    users = db.query(User).all()
    for user in users:
        # Extract just the first word as the single-word name
        new_name = user.full_name.split()[0]
        new_email = f"{new_name.lower()}@gmail.com"
        
        user.full_name = new_name
        user.email = new_email
        print(f"Updated to: {new_name} ({new_email})")
        
    db.commit()
    print("All users updated successfully!")

if __name__ == "__main__":
    main()
