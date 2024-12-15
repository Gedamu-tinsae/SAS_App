import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext'; // Import the custom hook
import axios from 'axios';

const StudentDashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth(); // Use the custom useAuth hook
  console.log("User in StudentDashboardScreen:", user); 

  const handleLogout = async () => {
    try {
      await logout(); // Call the logout function
      navigation.navigate('Login'); // Navigate to the Login screen after logging out
    } catch (error) {
      console.error("Logout failed:", error);
      Alert.alert('Error', 'Could not log out. Please try again.'); // Show an alert on error
    }
  };

  const [isTuningEnabled, setIsTuningEnabled] = useState(false);

  useEffect(() => {
    const fetchTuningStatus = async () => {
      try {
        const response = await axios.get('http://172.20.10.10:5000/get_train_model_status');
        setIsTuningEnabled(response.data.is_enabled);
        console.log("is_enabled:", response.data.is_enabled);
      } catch (error) {
        console.error("Error fetching tuning status:", error);
      }
    };

    fetchTuningStatus();
  }, []);


  return (
    <View style={styles.container}>
      {/* Top Settings and Logout Icons */}
      <View style={styles.topIconsContainer}>
        <TouchableOpacity 
          style={styles.iconButton} 
          onPress={() => navigation.navigate('SettingsScreen')} // Navigate to settings
        >
          <FontAwesome name="cog" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.iconButton} 
          onPress={handleLogout} // Call the logout function
        >
          <FontAwesome name="sign-out" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.greetingContainer}>
        <Text style={styles.greetingText}>Welcome, {user.name}!</Text>
        <Text style={styles.infoText}>ID: {user.studentId}</Text> 
        <Text style={styles.infoText}>Batch: {user.batch}</Text>
        <Text style={styles.infoText}>Department: {user.department}</Text>
        <Text style={styles.infoText}>Semester: {user.semester}</Text>
      </View>



      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('StudentViewScheduleScreen')}
        >
          <FontAwesome name="calendar" size={24} color="black" />
          <Text style={styles.buttonText}>View Schedule</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('StudentViewAttendanceScreen')}
        >
          <FontAwesome name="check-square" size={24} color="black" />
          <Text style={styles.buttonText}>View Attendance</Text>
        </TouchableOpacity>

        {/* Conditionally render Tune Model button based on isTuningEnabled */}
      {isTuningEnabled && (
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('UploadAndTuneScreen')}
        >
          <FontAwesome name="upload" size={24} color="black" />
          <Text style={styles.buttonText}>Tune Model</Text>
        </TouchableOpacity>
      )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1322',
    padding: 20,
  },
  topIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  iconButton: {
    backgroundColor: '#444',
    padding: 10,
    borderRadius: 50,
  },
  greetingContainer: {
    backgroundColor: '#858585',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 30,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    color: 'black',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    backgroundColor: '#78afba',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: 100,
  },
  buttonText: {
    color: 'black',
    marginTop: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default StudentDashboardScreen;
