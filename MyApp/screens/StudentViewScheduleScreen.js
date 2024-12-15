import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert,Modal, TextInput, Button } from 'react-native';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import * as Location from 'expo-location';

const StudentViewScheduleScreen = ({ navigation }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState('mon');
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false); // New state for attendance toggle
  const [manualAttendanceEnabled, setManualAttendanceEnabled] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false); // For manual GPS modal
  const [manualLatitude, setManualLatitude] = useState('');
  const [manualLongitude, setManualLongitude] = useState('');

  const { user } = useAuth();
  const studentId = user?.studentId;

  const daysOfWeek = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const dayMap = {
    mon: 'Monday',
    tue: 'Tuesday',
    wed: 'Wednesday',
    thu: 'Thursday',
    fri: 'Friday',
    sat: 'Saturday',
    sun: 'Sunday'
  };

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        if (!studentId) {
          throw new Error('Student ID is not available.');
        }
        const response = await axios.get(`http://172.20.10.10:5000/get_student_schedule?studentId=${studentId}`);
        setSchedules(response.data);
      } catch (error) {
        setError(error.message);
        Alert.alert('Error', error.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchAttendanceToggle = async () => {
      try {
        const response = await axios.get(`http://172.20.10.10:5000/get_attendance_status`, {
          params: { studentId: studentId },
        });
        setIsAttendanceOpen(response.data.isAttendanceOpen|| {}); // Correct key for 'isAttendanceOpen'
        console.log("isAttendanceOpen:", response.data.isAttendanceOpen);
      } catch (error) {
        console.error('Error fetching attendance toggle status:', error.message);
      }
    };

    const fetchManualAttendanceStatus = async () => {
      try {
        const response = await axios.get(`http://172.20.10.10:5000/get_student_manual_attendance_status`, {
          params: { studentId: studentId },
        });
        setManualAttendanceEnabled(response.data.manual_attendance_enabled);
        console.log("manualAttendanceEnabled:", response.data.manual_attendance_enabled); // Log manualAttendanceEnabled

      } catch (error) {
        console.error('Error fetching manual attendance status:', error.message);
      }
    };
    

    fetchSchedules();
    fetchAttendanceToggle();
    fetchManualAttendanceStatus();
  }, [studentId, selectedDay]);

  const filteredSchedules = schedules.filter(schedule => 
    schedule.day_of_week === dayMap[selectedDay]
  );



  const handleManualLocationSubmit = async () => {
    if (!manualLatitude || !manualLongitude) {
      Alert.alert("Error", "Please enter both latitude and longitude.");
      return;
    }

    // Validate latitude and longitude
    const latitude = parseFloat(manualLatitude);
    const longitude = parseFloat(manualLongitude);

    if (isNaN(latitude) || isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      Alert.alert("Error", "Invalid latitude or longitude.");
      return;
    }

    console.log("Sending location to backend:", { latitude, longitude });

    try {
      const response = await axios.post('http://172.20.10.10:5000/check_student_location', {
        latitude: latitude,
        longitude: longitude,
      });

      if (response.data.status === 'success') {
        navigation.navigate('GiveAttendanceScreen', {
          studentId: studentId,
          courseName: 'Manual GPS Attendance', // or any course name you want to show
        });
      } else {
        Alert.alert("Location Error", response.data.message || "Location verification failed.");
      }
    } catch (error) {
      console.error("Error during location verification:", error);
      Alert.alert("Error", "An error occurred during location verification.");
    } finally {
      setIsModalVisible(false); // Close the modal after submission
    }
  };




  const verifyLocationAndNavigate = async (schedule) => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission denied", "Location permission is required to verify attendance.");
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Log the location values being sent
    console.log("Sending location to backend:", { latitude, longitude });
  
      const response = await axios.post('http://172.20.10.10:5000/check_student_location', {
        latitude: latitude,
        longitude: longitude,
      });
  
      if (response.data.status === 'success') {
        navigation.navigate('GiveAttendanceScreen', {
          studentId: studentId,
          courseName: schedule.course_name
        });
      } else {
        Alert.alert("Location Error", response.data.message || "Location verification failed.");
      }
    } catch (error) {
      console.error("Error during location verification:", error);
      Alert.alert("Error", "An error occurred during location verification.");
    }
  };


  if (loading) {
    return <ActivityIndicator size="large" color="white" />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Error fetching schedule</Text>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* <View style={styles.navButtons}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navButton}>
          <Text style={styles.navButtonText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => console.log('Logging out')} style={styles.navButton}>
          <Text style={styles.navButtonText}>⟳</Text>
        </TouchableOpacity>
      </View> */}

      <View style={styles.daysContainer}>
        {daysOfWeek.map(day => (
          <TouchableOpacity
            key={day}
            onPress={() => setSelectedDay(day)}
            style={[styles.dayButton, selectedDay === day && styles.activeDayButton]}
          >
            <Text style={styles.dayButtonText}>{day}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scheduleContainer}>
        {filteredSchedules.map((schedule, index) => {
        // Construct the key to check if attendance is open for this specific day and period
        const attendanceKey = `${selectedDay}-${schedule.time_start}-${schedule.time_end}`;
        const isAttendanceOpenForThisPeriod = isAttendanceOpen[attendanceKey] || false;
        console.log("isAttendanceOpen 2:", isAttendanceOpenForThisPeriod);

        return (
        <View key={index} style={styles.scheduleItem}>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{schedule.time_start} - {schedule.time_end}</Text>
          </View>
          <View style={styles.scheduleInfo}>
            <Text style={styles.subjectText}>{schedule.course_name}</Text>
            <Text style={styles.classroomText}>{schedule.classroom}</Text>
            <Text style={styles.professorText}>{schedule.teacher ? schedule.teacher.name : 'Unknown'}</Text>
          </View>
          <View style={styles.buttonContainer}>
            {isAttendanceOpenForThisPeriod && (
              <TouchableOpacity
                style={styles.presentButton}
                onPress={() => verifyLocationAndNavigate(schedule)}
              >
                <Text style={styles.buttonText}>Present</Text>
              </TouchableOpacity>
            )}
            {manualAttendanceEnabled && (
              <TouchableOpacity style={styles.gpsButton} onPress={() => setIsModalVisible(true)}>
                <Text style={styles.buttonText}>Manual GPS</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );

      })}

      </ScrollView>

      {/* Modal for Manual GPS */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter GPS Coordinates</Text>
            <TextInput
              style={styles.input}
              placeholder="Latitude"
              keyboardType="numeric"
              value={manualLatitude}
              onChangeText={setManualLatitude}
            />
            <TextInput
              style={styles.input}
              placeholder="Longitude"
              keyboardType="numeric"
              value={manualLongitude}
              onChangeText={setManualLongitude}
            />
            <Button title="Submit" onPress={handleManualLocationSubmit} />
            <Button title="Cancel" onPress={() => setIsModalVisible(false)} />
          </View>
        </View>
      </Modal>

    </View>
  );
};

export default StudentViewScheduleScreen;

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#0f1322',
  },
  navButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  navButton: {
    padding: 10,
    backgroundColor: '#333',
    borderRadius: 50,
  },
  navButtonText: {
    fontSize: 20,
    color: '#fff',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  dayButton: {
    padding: 5,
    backgroundColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  activeDayButton: {
    backgroundColor: '#555',
  },
  dayButtonText: {
    color: '#fff',
  },
  scheduleContainer: {
    flex: 1,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#858585',
    borderRadius: 20,
    padding: 15,
    marginBottom: 10,
  },
  scheduleInfo: {
    flex: 2, // Takes up more space for the central information
    alignItems: 'center', // Center-align the text within this section
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 15,
    color: '#111',
    fontWeight: 'bold',
  },
  subjectText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
  },
  classroomText: {
    fontSize: 14,
    color: '#111',
    fontWeight: 'bold',
  },
  professorText: {
    fontSize: 14,
    color: '#111',
    fontWeight: 'bold',
  },
  presentButton: {
    backgroundColor: '#78afba',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 5,
    borderWidth: 1, 
    borderColor: '#333',
  },
  gpsButton: {
    backgroundColor: '#78afba',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1, 
    borderColor: '#333',
  },
  buttonText: {
    color: 'black',
    fontSize: 14,
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#aaa',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  input: {
    width: '100%',
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  timeContainer: {
    flex: 1, // Takes up minimal space for the time
    justifyContent: 'center',
  },

buttonContainer: {
    flex: 2, // Takes up minimal space for the buttons
    flexDirection: 'column',
    alignItems: 'flex-end', // Align buttons to the right
    justifyContent: 'space-around',
  },
});
