import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import axios from 'axios';

const AdminDashboardScreen = () => {
  const navigation = useNavigation();
  const { user,logout } = useAuth(); // Access the logout function from context
  const [attendance, setAttendance] = useState(null);
  console.log("User in AdminDashboardScreen:", user); 

  useEffect(() => {
    // Fetch attendance data from the backend
    const fetchAttendance = async () => {
      try {
        const response = await fetch('http://172.20.10.10:5000/get-attendance'); // Update to your actual endpoint
        const data = await response.json();
        setAttendance(data.attendancePercentage); // Assuming the response structure
      } catch (error) {
        console.error("Error fetching attendance:", error);
        Alert.alert('Error', 'Could not fetch attendance data');
      }
    };

    fetchAttendance();
  }, []);

  const handleLogout = () => {
    logout(); // Call the logout function
    navigation.navigate('Login'); // Navigate to Login screen after logging out
  };


  const [isTuningEnabled, setIsTuningEnabled] = useState(false);

  const toggleTuning = async () => {
    try {
      const response = await axios.post('http://172.20.10.10:5000/toggle_train_model');
      setIsTuningEnabled(response.data.is_enabled);
    } catch (error) {
      console.error("Error toggling tuning feature:", error);
      Alert.alert('Error', 'Could not toggle tuning feature');
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Settings and Logout Icons */}
      <View style={styles.topIconsContainer}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
          <FontAwesome name="sign-out" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Attendance Display Card */}
      <View style={styles.attendanceContainer}>
        <Text style={styles.attendanceText}>Overall Student Attendance</Text>
        <Text style={styles.attendancePercentage}>
          {attendance !== null ? `${attendance}%` : 'Loading...'}
        </Text>
        <Image
          source={require('../assets/trophy.png')} // Confirm this path is correct
          style={styles.trophyImage}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('CreateScheduleScreen')}
        >
          <FontAwesome name="plus-circle" size={24} color="black" />
          <Text style={styles.buttonText}>Create Schedule</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('AdminViewScheduleScreen')}
        >
          <FontAwesome name="calendar" size={24} color="black" />
          <Text style={styles.buttonText}>View Schedule</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('AdminViewAttendanceScreen')}
        >
          <FontAwesome name="check-square" size={24} color="black" />
          <Text style={styles.buttonText}>View Attendance</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button,{ backgroundColor: isTuningEnabled ? '#78afba' : 'red' }]} onPress={toggleTuning}>
        <MaterialIcons name="power-settings-new" size={24} color="black" />
        <Text style={styles.buttonText}>
          {isTuningEnabled ? 'Turn off Tuning' : 'Turn on Tuning'}
        </Text>
      </TouchableOpacity>
        
        <TouchableOpacity style={styles.button}
          onPress={() => navigation.navigate('AdminStaticsScreen')}
        >
          <FontAwesome name="bar-chart" size={24} color="black" />
          <Text style={styles.buttonText}>View Statistics</Text>
        </TouchableOpacity>
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
  attendanceContainer: {
    backgroundColor: '#858585',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 30,
  },
  attendanceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 5,
  },
  attendancePercentage: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 10,
  },
  trophyImage: {
    width: 50,
    height: 50,
    marginTop: 10,
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  button: {
    backgroundColor: '#78afba',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: 100,
    margin: 10,
  },
  buttonText: {
    color: 'black',
    marginTop: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default AdminDashboardScreen;
