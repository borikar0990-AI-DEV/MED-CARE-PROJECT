"""
Manual demo-data seeding script.

The API already seeds this automatically on startup when ENABLE_DEMO_SEED=true
(see app/main.py). Run this file directly if you want to (re)seed on demand,
e.g. right before a presentation:

    cd backend
    python seed.py
"""
from app.database import SessionLocal, init_db
from app.services.seed_service import DEMO_EMAIL, DEMO_PASSWORD, seed_demo_data

if __name__ == "__main__":
    init_db()
    db = SessionLocal()
    try:
        seed_demo_data(db)
    finally:
        db.close()

    print("Demo data ready.")
    print(f"  Email:    {DEMO_EMAIL}")
    print(f"  Password: {DEMO_PASSWORD}")
