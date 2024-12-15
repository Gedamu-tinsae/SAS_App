from flask_backend.app import db  # Keep this as is
from flask_backend.models import User, Student, Teacher, Class, ScheduleEntry, AttendanceRecord, AttendanceStatus, FeatureToggle

def create_database():
    with app.app_context():  # Create an application context
        try:
            db.create_all()
            print("Database tables created successfully.")
        except Exception as e:
            print(f"Error creating database tables: {e}")

if __name__ == '__main__':
    from flask_backend.app import app  # Import the app here to use its context
    create_database()
