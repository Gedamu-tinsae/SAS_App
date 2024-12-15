# README: Smart Attendance System Mobile App  

This is the mobile application version of the **Smart Attendance System (SAS)**, designed to streamline attendance tracking using facial recognition and schedule management. It features a **React Native** front-end and a **Python Flask** back-end for a seamless and responsive user experience.

---

## Project Structure  

The project is organized as follows:  

```
my-project/
│-- flask_backend/
│   ├── __init__.py
│   ├── app.py
│   ├── create_db.py
│   ├── models.py
│   ├── facial_recognition.py
│   └── requirements.txt
│
└── MyReactNativeApp/
    ├── assets/
    │   └── trophy.png
    ├── context/
    │   └── AuthContext.js
    ├── navigation/
    │   └── AppNavigator.js
    ├── screens/
    │   ├── AdminDashboardScreen.js
    │   ├── AdminStaticScreen.js
    │   ├── AdminViewScheduleScreen.js
    │   ├── Camerascreen.js
    │   ├── CreateScheduleScreen.js
    │   ├── EditScheduleScreen.js
    │   ├── FinishRegistrationScreen.js
    │   ├── GiveAttendanceScreen.js
    │   ├── LoginScreen.js
    │   ├── ManualAttendanceScreen.js
    │   ├── RegistrationScreen.js
    │   ├── StudentDashboardScreen.js
    │   ├── StudentViewAttendanceScreen.js
    │   ├── StudentViewScheduleScreen.js
    │   ├── TeacherDashboardScreen.js
    │   ├── TeacherViewAttendanceScreen.js
    │   ├── TeacherViewScheduleScreen.js
    │   ├── UploadAndTuneScreen.js
    ├── App.js
    ├── babel.config.js
    └── package.json
```

---

## Features  

### Front-end (React Native):  
- **User Authentication**: Context-based authentication with `AuthContext.js`.  
- **User Roles**: Separate dashboards for Admin, Student, and Teacher roles.  
- **Attendance System**: Facial recognition and manual options for marking attendance.  
- **Schedules**:  
  - Admin: Create, edit, and view schedules.  
  - Students and Teachers: View their respective schedules.  
- **Performance Dashboard**: Admins can view system statistics.  
- **Camera Integration**: Capture images for facial recognition.  

### Back-end (Python Flask):  
- **API Integration**: Flask server provides APIs for user authentication, attendance data, and schedules.  
- **Database**: Manages users, schedules, and attendance data with PostgreSQL.  
- **Facial Recognition**: Processes images for identification using `facial_recognition.py`.  

---

## Setting Up  

### Back-end (Flask):  
1. Navigate to `flask_backend/`.  
2. Create the database:  
   ```bash
   python -m flask_backend.create_db
   ```  
3. Run the Flask server:  
   ```bash
   flask --app flask_backend.app run --host=0.0.0.0
   ```  
4. Ensure the server is accessible externally for communication with the mobile app.  

### Front-end (React Native):  
1. Navigate to `MyReactNativeApp/`.  
2. Install dependencies:  
   ```bash
   npm install
   ```  
3. Start the development server:  
   ```bash
   npx expo start
   ```  

---

## Communication Between Front-end and Back-end  

The mobile app communicates with the Flask server. If you're running the server locally, ensure the following:  
- Replace `127.0.0.1` in API calls with the local network IP (e.g., `http://172.20.10.10:5000/api/data`).  
- In `app.py`, configure Flask to accept external connections:  
  ```python
  if __name__ == '__main__':
      app.run(debug=True, host="0.0.0.0")
  ```  

---

## Deployment  

For production builds on Android:  
1. Run the app with:  
   ```bash
   npx expo run:android
   ```  
2. Configure OAuth for Google Login via Google Cloud Platform.  
3. Adjust redirect URIs as per your environment.  

---

## Debugging Tips  

- Clear the Expo cache:  
  ```bash
  npx expo start -c
  ```  
- If Expo Go doesn't support a feature, build the app locally or use `npx expo run:android`.  
- Use `console.log()` liberally in both front-end and back-end for debugging.  

---

## Key Commands  

### Back-end:  
- Create the database:  
  ```bash
  python -m flask_backend.create_db
  ```  
- Run the server:  
  ```bash
  flask --app flask_backend.app run --host=0.0.0.0
  ```  

### Front-end:  
- Start the Expo server:  
  ```bash
  npx expo start
  ```  
- Reset Expo cache:  
  ```bash
  npm start -- --reset-cache
  ```  

---

## Future Enhancements  

- **Push Notifications** for schedule updates.  
- **Offline Mode** for attendance marking.  
- **Enhanced Analytics** for user engagement and attendance trends.  

Feel free to contribute to the project by opening issues or submitting pull requests!