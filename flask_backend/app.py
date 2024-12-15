from flask import Flask, request, jsonify, session, current_app, abort, redirect, url_for,flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, logout_user, current_user,login_required
from werkzeug.security import generate_password_hash, check_password_hash
from flask_backend.models import db, User, Student, Teacher, ScheduleEntry, Class, AttendanceRecord, AttendanceStatus, FeatureToggle
import os
from flask_migrate import Migrate
import logging
from flask_cors import CORS
from flask_backend.facial_recognition import train_model, get_model_directory, recognize_face, load_and_preprocess_image
from werkzeug.utils import secure_filename
from datetime import datetime
from geopy.distance import geodesic
from authlib.integrations.flask_client import OAuth  
import secrets



# Initialize the Flask app and configure it
app = Flask(__name__)
CORS(app) 


GOOGLE_CLIENT_ID = '...'
GOOGLE_REDIRECT_URI = "http://localhost/google_callback"

app.config['GOOGLE_CLIENT_ID'] = GOOGLE_CLIENT_ID
app.config['GOOGLE_REDIRECT_URI'] = GOOGLE_REDIRECT_URI


app.config.update(
    SQLALCHEMY_DATABASE_URI=os.getenv('DATABASE_URL', 'postgresql://username:pasword@localhost:port/database'),
    SQLALCHEMY_TRACK_MODIFICATIONS=False,
    SECRET_KEY=os.getenv('SECRET_KEY', 'default_secret_key')  # Use a strong secret key in production
)

# Initialize the database and login manager
db.init_app(app)
login_manager = LoginManager()
login_manager.init_app(app)

oauth = OAuth(app)

# Initialize Google OAuth
google = oauth.register(
    name='google',
    client_id=app.config['GOOGLE_CLIENT_ID'],
    access_token_url='https://oauth2.googleapis.com/token',
    authorize_url='https://accounts.google.com/o/oauth2/auth',
    client_kwargs={
        'scope': 'openid email profile',
        'userinfo_endpoint': 'https://openidconnect.googleapis.com/v1/userinfo',
        'jwks_uri': 'https://www.googleapis.com/oauth2/v1/certs',
        'nonce': 'random_string_here'  # Add a nonce here
    },
    jwks_uri="https://www.googleapis.com/oauth2/v1/certs"
)


# Initialize Migrate
migrate = Migrate(app, db)  

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# User loader for Flask-Login
@login_manager.user_loader
def load_user(user_id):
    try:
        return User.query.get(int(user_id))
    except Exception as e:
        current_app.logger.error(f"Error loading user: {e}")
        return None


@app.route('/google_login')
def google_login():
    """Redirect to Google for login."""
    session['nonce'] = secrets.token_urlsafe(16)
    redirect_uri = url_for('google_callback', _external=True)
    current_app.logger.debug(f'Redirecting to Google with redirect_uri: {redirect_uri}')
    return google.authorize_redirect(redirect_uri, nonce=session['nonce'], prompt='select_account')

@app.route('/google_callback')
def google_callback():
    """Handle the callback from Google after login."""
    try:
        # Get the token and parse user information
        token = google.authorize_access_token()
        user_info = google.parse_id_token(token)
        current_app.logger.debug(f'Token: {token}')

        # Verify nonce
        if user_info['nonce'] != session.get('nonce'):
            return jsonify({"message": "Invalid nonce"}), 400

        # Check if the user already exists
        user = User.query.filter_by(email=user_info['email']).first()

        if user:
            # Log in existing user
            login_user(user)
            current_app.logger.info(f'User {user.email} logged in successfully.')

            # Prepare user data for response based on user type
            user_data = {
                "message": "Logged in successfully!",
                "userType": "admin" if user.is_admin else "teacher" if user.is_teacher else "student",
                "userId": user.id,
                "email": user.email,
            }
            return jsonify(user_data), 200

        else:
            # Prepare new user information for session
            new_user_info = {
                'email': user_info['email'],
                'google_id': user_info['sub'],
            }
            session['new_user_info'] = new_user_info  # Save new user info for registration

            return jsonify({"message": "New user, complete registration", "email": new_user_info['email']}), 200

    except Exception as e:
        current_app.logger.error(f'Google login failed: {e}')
        return jsonify({"message": "Google login failed"}), 500


@app.route('/complete_registration', methods=['POST'])
def complete_registration():
    """Complete registration process for new users."""
    if 'new_user_info' not in session:
        return jsonify({"message": "Session expired. Please login again."}), 400

    new_user_info = session.get('new_user_info')
    data = request.get_json()
    required_fields = ['userType', 'name']

    # Check for missing fields
    if not all(field in data for field in required_fields):
        return jsonify({"message": "Missing required fields"}), 400

    try:
        # Create new user based on provided details
        user = User(
            email=new_user_info['email'],
            google_id=new_user_info['google_id'],
            is_teacher=data['userType'] == 'teacher',
            is_admin=data['userType'] == 'admin',
            is_registered=True
        )
        db.session.add(user)
        db.session.commit()

        # Add student or teacher details based on the user type
        if data['userType'] == 'student':
            student = Student(
                user_id=user.id,
                student_id=data.get('studentId'),
                name=data['name'],
                department=data.get('department'),
                semester=data.get('semester'),
                batch=data.get('batch')
            )
            db.session.add(student)
        elif data['userType'] == 'teacher':
            teacher = Teacher(
                user_id=user.id,
                teacher_id=data.get('teacherId'),
                name=data['name'],
                department=data.get('department')
            )
            db.session.add(teacher)

        db.session.commit()

        # Log in the new user
        login_user(user)
        session.pop('new_user_info', None)  # Clear session data

        # Prepare response with user data
        user_data = {
            "message": "Registration completed successfully!",
            "userType": "admin" if user.is_admin else "teacher" if user.is_teacher else "student",
            "userId": user.id,
            "email": user.email,
        }
        return jsonify(user_data), 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error during Google registration: {e}")
        return jsonify({"message": "Internal server error"}), 500


# Registration route
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    required_fields = ['email', 'password', 'userType']

    # Check for missing fields
    if not all(field in data for field in required_fields):
        return jsonify({"message": "Missing required fields"}), 400

    # Check if user already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"message": "Email already registered."}), 400

    try:
        hashed_password = generate_password_hash(data['password'])
        user = User(
            email=data['email'],
            password=hashed_password,
            is_teacher=data['userType'] == 'teacher',
            is_admin=data['userType'] == 'admin',
            is_registered=True
        )
        db.session.add(user)
        db.session.commit()

        # Add student or teacher details based on the user type
        if data['userType'] == 'student':
            student = Student(
                user_id=user.id,
                student_id=data.get('studentId'),
                name=data.get('name'),
                department=data.get('department'),
                semester=data.get('semester'),
                batch=data.get('batch')
            )
            db.session.add(student)
        elif data['userType'] == 'teacher':
            teacher = Teacher(
                user_id=user.id,
                teacher_id=data.get('teacherId'),
                name=data.get('name'),
                department=data.get('department')
            )
            db.session.add(teacher)

        db.session.commit()
        return jsonify({"message": "User registered successfully!"}), 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error during registration: {e}")
        return jsonify({"message": "Internal server error"}), 500

# Login route
@app.route('/login', methods=['POST'])
def login():
    # Parse JSON request
    data = request.get_json()
    current_app.logger.debug(f"Login request data: {data}")  # Log incoming request data
    user = User.query.filter_by(email=data.get('email')).first()

    # Check if user exists and password is correct
    if not user:
        current_app.logger.warning(f"User not found for email: {data.get('email')}")
        return jsonify({"message": "User not found"}), 404

    if not check_password_hash(user.password, data.get('password')):
        current_app.logger.warning(f"Invalid password attempt for email: {data.get('email')}")
        return jsonify({"message": "Invalid password"}), 401

    login_user(user)
    current_app.logger.debug(
        f"User authenticated: User ID = {user.id}, Role = "
        f"{'Admin' if user.is_admin else 'Teacher' if user.is_teacher else 'Unknown'}"
    )

    # Define the response based on user type
    user_data = {
        "message": "Logged in successfully!",
        "userType": "admin" if user.is_admin else "teacher" if user.is_teacher else "student",
        "userId": user.id,
    }

    # Add additional details for teacher
    if user.is_teacher:
        teacher = Teacher.query.filter_by(user_id=user.id).first()
        if teacher:
            user_data.update({
                "name": teacher.name,
                "teacherId": teacher.teacher_id,  # Use consistent naming
                "department": teacher.department,
            })
    
    # Check if user is a student
    student = Student.query.filter_by(user_id=user.id).first()
    if student:
        user_data.update({
            "name": student.name,
            "studentId": student.student_id,
            "department": student.department,
            "semester": student.semester,
            "batch": student.batch,
        })
        user_data["userType"] = "student"  # Update userType if student found

    current_app.logger.debug(f"User data being returned: {user_data}")  # Log outgoing user data
    return jsonify(user_data), 200, {'Content-Type': 'application/json'}

# Logout route
@app.route('/logout', methods=['POST'])
def logout():
    try:
        logout_user()
        return jsonify({"message": "Logged out successfully!"}), 200
    except Exception as e:
        current_app.logger.error(f"Logout error: {e}")
        return jsonify({"message": "Error logging out"}), 500

@app.route('/teachers', methods=['GET'])
def get_teachers():
    try:
        teachers = Teacher.query.all()
        teacher_list = [{'id': teacher.id, 'teacher_id': teacher.teacher_id} for teacher in teachers]
        return jsonify(teacher_list), 200
    except Exception as e:
        print(f"Error fetching teachers: {e}")
        return jsonify({'message': 'Error fetching teachers'}), 500

@app.route('/create_schedule', methods=['GET', 'POST'])
@login_required
def create_schedule():
    if not current_user.is_admin:
        abort(403)

    departments = Student.query.with_entities(Student.department).distinct().all()
    semesters = [str(i) for i in range(1, 9)]
    batches = [chr(i) for i in range(ord('A'), ord('G') + 1)]
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    teachers = Teacher.query.all()

    if request.method == 'POST':
        data = request.get_json()
        logger.info("Received data for schedule creation: %s", data)

        # Extract data
        day_of_week = data.get('day_of_week')
        time_start = data.get('time_start')
        time_end = data.get('time_end')
        classroom = data.get('classroom')
        teacher_id = data.get('teacher_id')
        department = data.get('department')
        semester = data.get('semester')
        batch = data.get('batch')
        course_name = data.get('course_name')

        # Validate required fields
        if not (day_of_week and time_start and time_end and classroom and teacher_id and course_name):
            return jsonify({'message': 'Missing required fields'}), 400

        # Create or update the class entry
        schedule_str = f"{day_of_week} {time_start}-{time_end}"
        existing_class = Class.query.filter_by(name=course_name, teacher_id=teacher_id, schedule=schedule_str).first()

        if not existing_class:
            new_class = Class(name=course_name, teacher_id=teacher_id, schedule=schedule_str)
            db.session.add(new_class)
            db.session.commit()
            class_id = new_class.id
        else:
            class_id = existing_class.id

        # Handle teacher schedule entry with duplication check
        if teacher_id:
            existing_teacher_entry = ScheduleEntry.query.filter_by(
                teacher_id=teacher_id,
                day_of_week=day_of_week,
                time_start=time_start,
                time_end=time_end
            ).first()

            if existing_teacher_entry:
                # Update existing teacher entry
                existing_teacher_entry.classroom = classroom
                existing_teacher_entry.course_name = course_name
                existing_teacher_entry.department = None
                existing_teacher_entry.batch = None
                existing_teacher_entry.semester = None
                db.session.commit()  # Commit immediately after updating
            else:
                # Create new entry if not found
                new_entry = ScheduleEntry(
                    teacher_id=teacher_id,
                    day_of_week=day_of_week,
                    time_start=time_start,
                    time_end=time_end,
                    classroom=classroom,
                    course_name=course_name
                )
                db.session.add(new_entry)

        # Handle student schedule entry with duplication check
        if department and semester and batch:
            students = Student.query.filter_by(department=department, semester=semester, batch=batch).all()
            for student in students:
                existing_student_entry = ScheduleEntry.query.filter_by(
                    student_id=student.id,
                    day_of_week=day_of_week,
                    time_start=time_start,
                    time_end=time_end
                ).first()

                if existing_student_entry:
                    # Update existing student entry
                    existing_student_entry.classroom = classroom
                    existing_student_entry.teacher_id = teacher_id
                    existing_student_entry.course_name = course_name
                    existing_student_entry.department = department
                    existing_student_entry.batch = batch
                    existing_student_entry.semester = semester
                    db.session.commit()  # Commit immediately after updating
                else:
                    # Create new entry if not found
                    new_student_entry = ScheduleEntry(
                        student_id=student.id,
                        day_of_week=day_of_week,
                        time_start=time_start,
                        time_end=time_end,
                        classroom=classroom,
                        teacher_id=teacher_id,
                        course_name=course_name,
                        department=department,
                        batch=batch,
                        semester=semester
                    )
                    db.session.add(new_student_entry)

            # Commit all new entries at once, after handling all students
            db.session.commit()

        return jsonify({'message': 'Schedule created successfully!'}), 201

    # Return departments, semesters, batches, etc., for GET requests
    return jsonify({
        'departments': [dept[0] for dept in departments],
        'semesters': semesters,
        'batches': batches,
        'days': days,
        'teachers': [{'id': teacher.id, 'name': teacher.name} for teacher in teachers]
    }), 200

@app.route('/get_schedules', methods=['GET'])
@login_required  # Ensure that only logged-in users can access this
def get_schedules():
    schedules = ScheduleEntry.query.all()  # Fetch all schedules
    schedules_list = []
    for schedule in schedules:
        schedules_list.append({
            'id': schedule.id,
            'day_of_week': schedule.day_of_week,
            'time_start': schedule.time_start,
            'time_end': schedule.time_end,
            'course_name': schedule.course_name,
            'classroom': schedule.classroom,
            'teacher_id': schedule.teacher_id,
            'department': schedule.department,
            'semester': schedule.semester,
            'batch': schedule.batch
        })
    return jsonify(schedules_list), 200

@app.route('/api/schedule/<int:schedule_id>', methods=['DELETE'])
def delete_schedule(schedule_id):
    try:
        schedule_entry = ScheduleEntry.query.get(schedule_id)  # Fetch the schedule entry by ID
        if not schedule_entry:
            return jsonify({'message': 'Schedule entry not found.'}), 404
        
        db.session.delete(schedule_entry)  # Delete the schedule entry
        db.session.commit()  # Commit the transaction
        
        return jsonify({'message': 'Schedule entry deleted successfully.'}), 200
    except Exception as e:
        db.session.rollback()  # Rollback in case of error
        return jsonify({'message': 'An error occurred while deleting the schedule entry.', 'error': str(e)}), 500

@app.route('/get_teacher_schedule', methods=['GET'])
@login_required
def get_teacher_schedule():
    # Check if the current user is a teacher
    if not current_user.is_teacher:
        abort(403)  # Forbidden if the user is not a teacher

    # Use the teacher's ID from the current user context
    teacher_id = current_user.teacher_profile.id

    # Log the teacher ID being used for the query
    app.logger.debug(f'Fetching schedules for teacher ID: {teacher_id}')

    # Fetching schedules for the specified teacher
    schedules = ScheduleEntry.query.filter_by(teacher_id=teacher_id).all()
    
    # Log the fetched schedules
    app.logger.debug(f'Fetched schedules: {schedules}')

    # Format the response data
    schedule_data = [{
        'id': schedule.id,
        'course_name': schedule.course_name,
        'day_of_week': schedule.day_of_week,
        'time_start': schedule.time_start,
        'time_end': schedule.time_end,
        'classroom': schedule.classroom,
    } for schedule in schedules]

    return jsonify(schedule_data), 200

# Set the upload folder path
UPLOAD_FOLDER = os.path.join(get_model_directory(), 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/api/facial-recognition/upload', methods=['POST'])
def upload_and_train():
    try:
        student_id = request.form.get('studentId')
        if not student_id:
            return jsonify({'message': 'Student ID is required'}), 400

        images = request.files.getlist('images')
        if not images:
            return jsonify({'message': 'No images uploaded'}), 400

        image_paths = []
        for image in images:
            filename = secure_filename(image.filename)
            image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            image.save(image_path)
            image_paths.append(image_path)

        # Train the model with the uploaded images
        train_model(student_id, image_paths, get_model_directory())

        return jsonify({'message': 'Training completed successfully'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500
        
@app.route('/api/facial-recognition/test', methods=['POST'])
def test_recognition():
    try:
        student_id = request.form.get('studentId')
        image_data = request.files.get('imageData')

        if not student_id or not image_data:
            return jsonify({'message': 'Student ID and image data are required'}), 400

        # Save the image temporarily
        temp_image_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(image_data.filename))
        image_data.save(temp_image_path)

        # Pass the path of the saved image to the recognize_face function
        result = recognize_face(temp_image_path, student_id, get_model_directory())
        if result:
            return jsonify({'message': 'Face recognized successfully', 'student_id': result}), 200
        else:
            return jsonify({'message': 'Face not recognized'}), 404
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@app.route('/process_attendance', methods=['POST'])
@login_required
def process_attendance():
    logging.debug(f"Current user: {current_user}")

    # Log the incoming request data
    logging.debug(f"Request data: {request.data}")  # Log raw request data

    try:
        # Access image file through request.files
        image_file = request.files.get('image_data')  # Use request.files for the image
        student_id = request.form.get('student_id')
        course_name = request.form.get('course_name')

        logging.debug(f"Received image file: {image_file.filename if image_file else 'None'}")
        logging.debug(f"Received student ID: {student_id}")
        logging.debug(f"Received course name: {course_name}")

        if image_file and student_id and course_name:
            model_directory = get_model_directory()
            # Use image_file for recognition, you might need to save it temporarily or read directly
            recognized_id = recognize_face(image_file, student_id, model_directory)

            if recognized_id:
                logging.debug(f"Face recognized. Recording attendance for student ID: {student_id}")

                # Fetch student record using student_id
                student = Student.query.filter_by(student_id=student_id).first()

                if student:
                    # Fetch the corresponding Class instance using course_name
                    class_instance = Class.query.filter_by(name=course_name).first()

                    if class_instance:
                        # Create attendance record
                        attendance_record = AttendanceRecord(
                            student_id=student.id,
                            class_id=class_instance.id,
                            timestamp=datetime.utcnow(),
                            present=True
                        )
                        db.session.add(attendance_record)
                        db.session.commit()

                        # Fetch the student name for response
                        student_name = student.name
                        return jsonify({'success': True, 'student_name': student_name}), 200
                    else:
                        return jsonify({'success': False, 'error': 'Class not found.'}), 400
                else:
                    return jsonify({'success': False, 'error': 'Student not found.'}), 400
            else:
                return jsonify({'success': False, 'error': 'Face not recognized.'}), 400
        else:
            return jsonify({'success': False, 'error': 'No image file, student ID, or course name received.'}), 400
    except Exception as e:
        logging.error(f"Error processing attendance: {e}")
        return jsonify({'success': False, 'error': 'An error occurred while processing attendance.'}), 500

@app.route('/toggle_attendance', methods=['POST'])
@login_required
def toggle_attendance():
    data = request.json  # Expecting JSON payload
    day = data.get('day')
    period = data.get('period')
    status = data.get('status', False)  # Now expecting boolean `status`

    # Logic to toggle attendance status
    attendance = AttendanceStatus.query.filter_by(day=day, period=period).first()
    if not attendance:
        attendance = AttendanceStatus(day=day, period=period, status=status)
        db.session.add(attendance)
    else:
        attendance.status = status

    db.session.commit()
    return jsonify({'message': 'Attendance status updated successfully!', 'status': attendance.status}), 200

@app.route('/edit_schedule/<int:entry_id>', methods=['GET', 'POST'])
@login_required
def edit_schedule(entry_id):
    if not current_user.is_admin:
        abort(403)

    entry = ScheduleEntry.query.get(entry_id)
    if not entry:
        abort(404)

    if request.method == 'POST':
        data = request.get_json()
        entry.day_of_week = data.get('day_of_week')
        entry.time_start = data.get('time_start')
        entry.time_end = data.get('time_end')
        entry.course_name = data.get('course_name')
        entry.classroom = data.get('classroom')
        entry.teacher_id = data.get('teacher_id')
        entry.department = data.get('department')
        entry.semester = data.get('semester')
        entry.batch = data.get('batch')

        db.session.commit()
        return jsonify({'message': 'Schedule updated successfully!'}), 200

    # For GET request, return the current schedule details and teachers
    departments = [d.department for d in Student.query.distinct(Student.department).all()]
    teachers = Teacher.query.all()
    teacher_list = [{'id': t.id, 'name': t.name} for t in teachers]

    return jsonify({
        'day_of_week': entry.day_of_week,
        'time_start': entry.time_start,
        'time_end': entry.time_end,
        'course_name': entry.course_name,
        'classroom': entry.classroom,
        'teacher_id': entry.teacher_id,
        'department': entry.department,
        'semester': entry.semester,
        'batch': entry.batch,
        'teachers': teacher_list,
        'departments': departments,
    }), 200

@app.route('/admin/view_all_student_attendance', methods=['GET'])
def view_all_student_attendance():
    # Extract filters from request arguments
    semester = request.args.get('semester')
    batch = request.args.get('batch')
    department = request.args.get('department')
    student_id = request.args.get('student_id')

    # Query for students based on provided filters
    query = Student.query
    if semester:
        query = query.filter_by(semester=semester)
    if batch:
        query = query.filter_by(batch=batch)
    if department:
        query = query.filter_by(department=department)
    if student_id:
        query = query.filter_by(student_id=student_id)

    students = query.all()
    student_ids = [student.id for student in students]

    # Query attendance records for the filtered students
    attendance_records = AttendanceRecord.query.filter(
        AttendanceRecord.student_id.in_(student_ids)
    ).all()

    # Construct response data
    student_data = []
    for student in students:
        records = [rec for rec in attendance_records if rec.student_id == student.id]
        total_classes = len(records)
        attended_classes = sum(rec.present for rec in records)
        attendance_percentage = int((attended_classes / total_classes) * 100) if total_classes > 0 else 0

        student_data.append({
            'student_id': student.student_id,
            'name': student.name,
            'attended': attended_classes,
            'total': total_classes,
            'percentage': attendance_percentage
        })

    return jsonify(student_data)

@app.route('/view_student_attendance', methods=['GET'])
@login_required
def view_student_attendance():
    try:
        # Fetch the teacher profile based on the current user
        teacher = Teacher.query.filter_by(user_id=current_user.id).first()
        if not teacher:
            return jsonify({"error": "Teacher profile not found"}), 404

        # Fetch filter parameters from the request
        semester = request.args.get('semester')
        batch = request.args.get('batch')
        department = request.args.get('department')
        student_id = request.args.get('student_id')

        # Fetch all classes for the teacher
        classes = Class.query.filter_by(teacher_id=teacher.id).all()

        # Initialize the list to store attendance records
        filtered_attendance_records = []

        # Iterate over each class
        for cls in classes:
            # Fetch attendance records for the class, applying filters
            query = AttendanceRecord.query.join(Student).filter(AttendanceRecord.class_id == cls.id)

            if semester:
                query = query.filter(Student.semester == semester)
            if batch:
                query = query.filter(Student.batch == batch)
            if department:
                query = query.filter(Student.department == department)
            if student_id:
                query = query.filter(Student.student_id == student_id)

            records = query.all()

            for record in records:
                student = record.student
                # Find or create the attendance summary for this student in this class
                attendance_summary = next((item for item in filtered_attendance_records 
                                           if item['student_id'] == student.id and item['class_name'] == cls.name), None)
                if attendance_summary is None:
                    attendance_summary = {
                        'student_id': student.id,
                        'student_name': student.name,
                        'class_name': cls.name,
                        'total_classes': 0,
                        'attended_classes': 0,
                        'student_database_id': student.student_id  # Add the actual database student_id here
                    }
                    filtered_attendance_records.append(attendance_summary)

                # Update attendance summary
                attendance_summary['total_classes'] += 1
                if record.present:
                    attendance_summary['attended_classes'] += 1

        # Calculate attendance percentage for each record
        for summary in filtered_attendance_records:
            summary['attendance_percentage'] = (
                (summary['attended_classes'] / summary['total_classes']) * 100 
                if summary['total_classes'] > 0 else 0
            )

        # Optionally, you can return unique semesters, batches, and departments for filters
        semesters = Student.query.with_entities(Student.semester).distinct().all()
        batches = Student.query.with_entities(Student.batch).distinct().all()
        departments = Student.query.with_entities(Student.department).distinct().all()

        return jsonify({
            "attendance_records": filtered_attendance_records,
            "semesters": [s.semester for s in semesters],
            "batches": [b.batch for b in batches],
            "departments": [d.department for d in departments]
        })

    except Exception as e:
        print("Error occurred:", e)  # Log the error
        return jsonify({"error": "An error occurred while fetching attendance data."}), 500

@app.route('/api/student/attendance')  # API route for fetching attendance data for the student
@login_required
def get_student_attendance():
    # Fetch the student based on the current user
    student = Student.query.filter_by(user_id=current_user.id).first()

    if not student:
        return jsonify({'message': 'Student not found'}), 404

    # Fetch attendance records for the student, including related Class data
    attendance_records = (
        AttendanceRecord.query
        .filter_by(student_id=student.id)
        .join(Class)  # Join the Class model
        .all()
    )

    # Create a dictionary to store course attendance data
    course_attendance = {}
    classes = Class.query.all()
    schedule_entry_map = {cls.id: cls.name for cls in classes}

    for record in attendance_records:
        course_name = schedule_entry_map.get(record.class_id, 'Unknown Course')
        if course_name not in course_attendance:
            course_attendance[course_name] = {
                'total_classes': 0,
                'attended_classes': 0,
                'batch': student.batch  # Add batch information
            }
        course_attendance[course_name]['total_classes'] += 1
        if record.present:
            course_attendance[course_name]['attended_classes'] += 1

    # Calculate attendance percentage for each course
    for course, data in course_attendance.items():
        total_classes = data['total_classes']
        attended_classes = data['attended_classes']
        if total_classes > 0:
            data['attendance_percentage'] = int((attended_classes / total_classes) * 100)
        else:
            data['attendance_percentage'] = 0

    # Create a list of all courses with their attendance data
    all_courses = {}
    for cls in classes:
        all_courses[cls.name] = {
            'total_classes': 0,
            'attended_classes': 0,
            'attendance_percentage': 0,
            'batch': student.batch
        }
    
    # Merge the attendance data into the all_courses dictionary
    for course_name, data in course_attendance.items():
        all_courses[course_name]['total_classes'] = data['total_classes']
        all_courses[course_name]['attended_classes'] = data['attended_classes']
        all_courses[course_name]['attendance_percentage'] = data['attendance_percentage']

    return jsonify(all_courses), 200

@app.route('/api/student/attendance_calendar', methods=['GET'])
@login_required
def get_attendance_calendar():
    student = Student.query.filter_by(user_id=current_user.id).first()
    if not student:
        return jsonify({'message': 'Student not found'}), 404

    # Retrieve attendance records for the student, returning only date and attendance status
    attendance_records = AttendanceRecord.query.filter_by(student_id=student.id).all()
    
    # Build a dictionary with date as key and attendance status as value
    attendance_by_date = {}
    for record in attendance_records:
        date_str = record.timestamp.strftime('%Y-%m-%d')  # Format date as string
        attendance_by_date[date_str] = record.present

        print("Attendance Records:", attendance_by_date)  # Log the attendance records

    return jsonify(attendance_by_date), 200

@app.route('/get_students', methods=['GET'])
@login_required
def get_students():
    try:
        # Retrieve all students from the database
        students = Student.query.all()
        student_data = [{"id": student.id, "name": student.name, "student_id": student.student_id} for student in students]
        return jsonify({"students": student_data}), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching students: {e}")
        return jsonify({"error": "Error fetching student data"}), 500

@app.route('/toggle_manual_attendance_all', methods=['POST'])
@login_required
def toggle_manual_attendance_for_all():
    try:
        is_enabled = request.json.get('is_enabled', False)
        # Enable or disable manual attendance for all students
        Student.query.update({Student.manual_attendance_enabled: is_enabled})
        db.session.commit()
        return jsonify({"message": "Manual attendance updated for all students"}), 200
    except Exception as e:
        current_app.logger.error(f"Error toggling attendance for all students: {e}")
        return jsonify({"error": "Could not update manual attendance for all students"}), 500

@app.route('/toggle_manual_attendance_selected', methods=['POST'])
@login_required
def toggle_manual_attendance_for_selected():
    try:
        student_ids = request.json.get('student_ids', [])
        enable_for_selected = request.json.get('enable', True)

        if enable_for_selected:
            # Enable manual attendance for selected students
            Student.query.filter(Student.id.in_(student_ids)).update(
                {Student.manual_attendance_enabled: True}, synchronize_session=False
            )
            # Disable manual attendance for students not in the selected list
            Student.query.filter(~Student.id.in_(student_ids)).update(
                {Student.manual_attendance_enabled: False}, synchronize_session=False
            )
        else:
            # Only disable manual attendance for the selected students
            Student.query.filter(Student.id.in_(student_ids)).update(
                {Student.manual_attendance_enabled: False}, synchronize_session=False
            )

        db.session.commit()
        return jsonify({"message": "Manual attendance updated for selected students"}), 200
    except Exception as e:
        current_app.logger.error(f"Error toggling attendance for selected students: {e}")
        return jsonify({"error": "Could not update manual attendance for selected students"}), 500

@app.route('/get_student_manual_attendance_status', methods=['GET'])
@login_required
def get_student_manual_attendance_status():
    student_id = request.args.get('studentId')
    
    try:
        student = Student.query.filter_by(student_id=student_id).first()
        if not student:
            return jsonify({"error": "Student not found"}), 404
        
        # Assume 'manual_attendance_enabled' is a column in the Student model
        return jsonify({"manual_attendance_enabled": student.manual_attendance_enabled}), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching manual attendance status: {e}")
        return jsonify({"error": "Error fetching manual attendance status"}), 500


@app.route('/get_student_schedule', methods=['GET'])
@login_required
def get_student_schedule():
    if not current_user.is_registered:  # Ensure the user is a registered student
        abort(403)

    # Use the student_id from the current user's profile
    student_id = current_user.student_profile.student_id  # Retrieve the student ID from the profile

    # Log the student ID being used for the query
    app.logger.debug(f'Fetching schedules for student ID: {student_id}')

    # Fetch the current student's profile to get the department, batch, and semester
    current_student = Student.query.filter_by(student_id=student_id).first()

    if not current_student:
        abort(404)  # Student not found

    # Fetch the student's schedule entries based on department, batch, and semester
    schedule_entries = ScheduleEntry.query.filter(
        ScheduleEntry.department == current_student.department,
        ScheduleEntry.batch == current_student.batch,
        ScheduleEntry.semester == current_student.semester
    ).all()

    # Log the fetched schedules
    app.logger.debug(f'Fetched schedules: {schedule_entries}')

    # Format the response data
    schedule_data = [{
        'id': schedule.id,
        'course_name': schedule.course_name,
        'day_of_week': schedule.day_of_week,
        'time_start': schedule.time_start,
        'time_end': schedule.time_end,
        'classroom': schedule.classroom,
        'department': schedule.department,
        'batch': schedule.batch,
        'semester': schedule.semester,
    } for schedule in schedule_entries]

    return jsonify(schedule_data), 200


@app.route('/get_attendance_status', methods=['GET'])
@login_required
def get_attendance_status():
    try:
        student_id = request.args.get('studentId')
        current_student = Student.query.filter_by(student_id=student_id).first()

        if not current_student:
            abort(404, "Student not found")

        # Fetch the student's schedule entries based on department, batch, and semester
        schedule_entries = ScheduleEntry.query.filter(
            ScheduleEntry.department == current_student.department,
            ScheduleEntry.batch == current_student.batch,
            ScheduleEntry.semester == current_student.semester
        ).all()

        # Initialize schedule dictionary for attendance status
        days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat']
        periods = ['10:30-11:30', '11:30-12:30', '12:30-1:30', '1:30-2:00', '2:00-3:00', '3:00-4:00', '4:00-5:00', '5:00-6:00']
        schedule = {day: {period: None for period in periods} for day in days}

        for entry in schedule_entries:
            day = entry.day_of_week
            period = f"{entry.time_start}-{entry.time_end}"
            if day in schedule and period in schedule[day]:
                schedule[day][period] = entry

        # Fetch attendance status for the student's schedule
        attendance_entries = AttendanceStatus.query.all()
        
        # Use string keys instead of tuples for JSON serialization
        attendance_status = {
            f"{entry.day}-{entry.period}": entry.status
            for entry in attendance_entries
        }
        
        current_app.logger.debug(f"attendance_active: {attendance_status}")  # Log the attendance status

        return jsonify({'isAttendanceOpen': attendance_status}), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching attendance status: {e}")
        return jsonify({"error": "Failed to retrieve attendance status"}), 500

# Flask route to toggle "train_model" on or off by admin
@app.route('/toggle_train_model', methods=['POST'])
@login_required
def toggle_train_model():
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403

    train_model_toggle = FeatureToggle.query.filter_by(feature_name='train_model').first()
    
    if train_model_toggle:
        train_model_toggle.is_enabled = not train_model_toggle.is_enabled
    else:
        train_model_toggle = FeatureToggle(feature_name='train_model', is_enabled=True)
        db.session.add(train_model_toggle)
    
    db.session.commit()
    return jsonify({'success': True, 'is_enabled': train_model_toggle.is_enabled}), 200

@app.route('/get_train_model_status', methods=['GET'])
@login_required
def get_train_model_status():
    train_model_toggle = FeatureToggle.query.filter_by(feature_name='train_model').first()
    is_enabled = train_model_toggle.is_enabled if train_model_toggle else False
    return jsonify({'is_enabled': is_enabled}), 200

SCHOOL_LOCATIONS = [
    (22.560504, 72.923237),  # Example location 1
    (23.030200, 72.577200),  # Example location 2
    (22.552786, 72.924109),  # School location
    (37.4220936, -122.083922), #Emu-Google's location
    (22.557279, 72.922350), #yoftis
    (40.741895, -73.989308),
    # Add more 
]
ALLOWED_RADIUS = 500  # in meters

app.config['SCHOOL_LOCATIONS'] = SCHOOL_LOCATIONS
app.config['ALLOWED_RADIUS'] = ALLOWED_RADIUS

def is_within_allowed_area(latitude, longitude):
    student_coords = (latitude, longitude)
    
    for school_coords in app.config['SCHOOL_LOCATIONS']:
        distance = geodesic(school_coords, student_coords).meters
        if distance <= app.config['ALLOWED_RADIUS']:
            return True
    return False

@app.route('/check_student_location', methods=['POST'])
def check_student_location():
    try:
        data = request.json
        latitude = float(data.get('latitude'))
        longitude = float(data.get('longitude'))

        # Log the received latitude and longitude
        app.logger.debug(f"Received location from frontend: Latitude = {latitude}, Longitude = {longitude}")
        
        
        if is_within_allowed_area(latitude, longitude):
            return jsonify({'status': 'success'})
        else:
            return jsonify({'status': 'error', 'message': 'You are not within the allowed area to take attendance.'})
    
    except Exception as e:
        return jsonify({'status': 'error', 'message': 'An error occurred during location verification.'}), 500

mock_attendance_data = { "attendancePercentage": 85  }
@app.route('/get-attendance', methods=['GET'])
def get_attendance():
    # Return the mock attendance data
    return jsonify(mock_attendance_data), 200



if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0")
