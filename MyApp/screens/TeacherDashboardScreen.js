import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const TeacherDashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  console.log("User in TeacherDashboardScreen:", user); 

  const handleLogout = async () => {
    try {
      await logout();
      navigation.navigate('Login');
    } catch (error) {
      console.error("Logout failed:", error);
      Alert.alert('Error', 'Could not log out. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Settings and Logout Icons */}
      <View style={styles.topIconsContainer}>
        <TouchableOpacity 
          style={styles.iconButton} 
          onPress={() => navigation.navigate('SettingsScreen')}
        >
          <FontAwesome name="cog" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
          <FontAwesome name="sign-out" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Greeting Card */}
      <View style={styles.greetingContainer}>
        <Text style={styles.greetingText}>Welcome, {user.name}!</Text>
        <Text style={styles.infoText}>ID: {user.teacherId}</Text>
        <Text style={styles.infoText}>Department: {user.department}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('TeacherViewScheduleScreen')}
        >
          <FontAwesome name="calendar" size={24} color="black" />
          <Text style={styles.buttonText}>View Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('TeacherViewAttendanceScreen')}
        >
          <FontAwesome name="check-square" size={24} color="black" />
          <Text style={styles.buttonText}>View Attendance</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('ManualAttendanceScreen')}
        >
          <FontAwesome name="location-arrow" size={24} color="black" />
          <Text style={styles.buttonText}>Turn on Manual GPS</Text>
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

export default TeacherDashboardScreen;
