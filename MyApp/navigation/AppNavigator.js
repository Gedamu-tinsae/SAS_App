import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext'; 
import LoginScreen from '../screens/LoginScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminViewScheduleScreen from '../screens/AdminViewScheduleScreen';
import StudentDashboardScreen from '../screens/StudentDashboardScreen';
import StudentViewAttendanceScreen from '../screens/StudentViewAttendanceScreen';
import StudentViewScheduleScreen from '../screens/StudentViewScheduleScreen';
import TeacherDashboardScreen from '../screens/TeacherDashboardScreen';
import TeacherViewScheduleScreen from '../screens/TeacherViewScheduleScreen';
import UploadAndTuneScreen from '../screens/UploadAndTuneScreen';
import AdminViewAttendanceScreen from '../screens/AdminViewAttendanceScreen';
import CreateScheduleScreen from '../screens/CreateScheduleScreen';
import CameraScreen from '../screens/CameraScreen';
import GiveAttendanceScreen from '../screens/GiveAttendanceScreen';
import EditScheduleScreen from '../screens/EditScheduleScreen';
import TeacherViewAttendanceScreen from '../screens/TeacherViewAttendanceScreen';
import ManualAttendanceScreen  from '../screens/ManualAttendanceScreen';
import AdminStaticsScreen from '../screens/AdminStaticsScreen'; 
import FinishRegistrationScreen from '../screens/FinishRegistrationScreen';
import LoadingScreen from '../screens/LoadingScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user } = useAuth(); // Use the custom hook to access user data

  // Determine initial route based on user role
  const getInitialRoute = () => {
    if (user) {
      switch (user.role) {
        case 'Admin':
          return 'AdminDashboard';
        case 'Student':
          return 'StudentDashboard';
        case 'Teacher':
          return 'TeacherDashboard';
        default:
          return 'Login';
      }
    }
    return 'Login';
  };

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={getInitialRoute()}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Registration" component={RegistrationScreen} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        <Stack.Screen name="AdminViewScheduleScreen" component={AdminViewScheduleScreen} />
        <Stack.Screen name="StudentDashboard" component={StudentDashboardScreen} />
        <Stack.Screen name="StudentViewAttendanceScreen" component={StudentViewAttendanceScreen} />
        <Stack.Screen name="StudentViewScheduleScreen" component={StudentViewScheduleScreen} />
        <Stack.Screen name="TeacherDashboard" component={TeacherDashboardScreen} />
        <Stack.Screen name="TeacherViewScheduleScreen" component={TeacherViewScheduleScreen} />
        <Stack.Screen name="UploadAndTuneScreen" component={UploadAndTuneScreen} />
        <Stack.Screen name="AdminViewAttendanceScreen" component={AdminViewAttendanceScreen} />
        <Stack.Screen name="CreateScheduleScreen" component={CreateScheduleScreen} />
        <Stack.Screen name="CameraScreen" component={CameraScreen} />
        <Stack.Screen name="GiveAttendanceScreen" component={GiveAttendanceScreen} />
        <Stack.Screen name="EditScheduleScreen" component={EditScheduleScreen}  />
        <Stack.Screen name="TeacherViewAttendanceScreen" component={TeacherViewAttendanceScreen}  />
        <Stack.Screen name="ManualAttendanceScreen" component={ManualAttendanceScreen}  />
        <Stack.Screen name="AdminStaticsScreen" component={AdminStaticsScreen}  />
        <Stack.Screen name="FinishRegistrationScreen" component={FinishRegistrationScreen}  />
        <Stack.Screen name="LoadingScreen" component={LoadingScreen}  />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
