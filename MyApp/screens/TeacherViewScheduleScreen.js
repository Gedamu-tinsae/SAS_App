import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext'; // Use the custom hook

const TeacherViewScheduleScreen = ({ navigation }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState('mon');
  const daysOfWeek = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const [attendanceStatus, setAttendanceStatus] = useState({}); // State to hold attendance status for each schedule

  
  const { user, loading: authLoading } = useAuth(); // Access user data with useAuth
  console.log('User data:', user);

  // Show loading spinner if auth data is loading
  if (authLoading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  const teacherId = user?.teacherId; // Get teacher ID, ensure user is defined

  useEffect(() => {
    const fetchSchedules = async () => {
      if (!teacherId) {
        console.log('No teacherId available.');
        setLoading(false); // Ensure loading is set to false if no teacherId
        return;
      }

      console.log('Teacher ID being sent to backend:', teacherId);

      try {
        const response = await axios.get(`http://172.20.10.10:5000/get_teacher_schedule`, {
          params: { teacherId: teacherId },
        });

        console.log('Schedules response:', response.data);

        setSchedules(response.data);
      } catch (error) {
        console.error('Error fetching schedules:', error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSchedules();
  }, [teacherId]);


  const dayMap = {
    mon: 'Monday',
    tue: 'Tuesday',
    wed: 'Wednesday',
    thu: 'Thursday',
    fri: 'Friday',
    sat: 'Saturday',
    sun: 'Sunday'
  };

  console.log('All schedules:', schedules); // Log all fetched schedules


  const filteredSchedules = schedules.filter(schedule => 
    schedule.day_of_week === dayMap[selectedDay]
  );

  console.log('Filtered schedules:', filteredSchedules);

  const handleAttendance = async (schedule) => {
    try {
        const response = await axios.post(
            'http://172.20.10.10:5000/toggle_attendance',
            {
                day: selectedDay,
                period: `${schedule.time_start}-${schedule.time_end}`,
                status: !attendanceStatus[`${schedule.time_start}-${schedule.time_end}`] // Toggle the status
            },
            { headers: { 'Content-Type': 'application/json' } }
        );

        const newStatus = response.data.status;
        setAttendanceStatus(prev => ({
            ...prev,
            [`${schedule.time_start}-${schedule.time_end}`]: newStatus
        }));

        console.log(response.data.message || 'Attendance status updated.');
        console.log('Updated status:', newStatus);
    } catch (error) {
        console.error('Error toggling attendance:', error.message);
    }
};

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
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
        {filteredSchedules.length > 0 ? (
          filteredSchedules.map((schedule, index) => (
            <View key={index} style={styles.scheduleItem}>
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{schedule.time_start} - {schedule.time_end}</Text>
              </View>
              <View style={styles.scheduleInfo}>
                <Text style={styles.subjectText}>{schedule.course_name}</Text>
                <Text style={styles.classroomText}> {schedule.classroom}</Text>
                <Text style={styles.timeText}> {schedule.time_start} - {schedule.time_end}</Text>
              </View>
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={[styles.attendanceButton, attendanceStatus[`${schedule.time_start}-${schedule.time_end}`] ? styles.activeAttendance : styles.inactiveAttendance]}
                  onPress={() => handleAttendance(schedule)}
                >
                  <Text style={styles.buttonText}>
                    {attendanceStatus[`${schedule.time_start}-${schedule.time_end}`] ? 'End Attendance' : 'Take Attendance'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No schedules available for this day.</Text>
        )}
      </ScrollView>
    </View>
  );
};

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
  departmentText: {
    fontSize: 14,
    color: '#ddd',
  },
  attendanceButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 5,
  },
  buttonText: {
    color: 'black',
    fontSize: 14,
  },
  noDataText: {
    color: 'white',
    textAlign: 'center',
    marginTop: 20,
  },
  inactiveAttendance: {
    backgroundColor: '#78afba',
  },
  activeAttendance: {
    backgroundColor: '#dc3545',
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

export default TeacherViewScheduleScreen;
