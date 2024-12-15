// screens/CreateScheduleScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';

const CreateScheduleScreen = () => {
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [courseName, setCourseName] = useState('');
  const [classRoom, setClassRoom] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [batch, setBatch] = useState('');
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await axios.get('http://172.20.10.10:5000/teachers');
        setTeachers(response.data); // Assume response.data is an array of teachers
      } catch (error) {
        console.error('Error fetching teachers:', error);
      }
    };
    fetchTeachers();
  }, []);

  const handleSubmit = async () => {
    try {
      await axios.post('http://172.20.10.10:5000/create_schedule', {
        day_of_week: dayOfWeek,       // Change to day_of_week
        time_start: startTime,        // Change to time_start
        time_end: endTime,            // Change to time_end
        course_name: courseName,      // Change to course_name
        classroom: classRoom,
        teacher_id: teacherId,
        department,
        semester,
        batch,
      });
      alert('Schedule created successfully');
      // Optionally, reset the form fields after successful submission
      resetForm();
    } catch (error) {
      console.error('Error creating schedule:', error);
      alert('Failed to create schedule');
    }
  };

  const resetForm = () => {
    setDayOfWeek('');
    setStartTime('');
    setEndTime('');
    setCourseName('');
    setClassRoom('');
    setTeacherId('');
    setDepartment('');
    setSemester('');
    setBatch('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Create Schedule</Text>

      {/* Day of the Week */}
      <Picker selectedValue={dayOfWeek} style={styles.input} onValueChange={(itemValue) => setDayOfWeek(itemValue)}>
        <Picker.Item label="Select Day" value="" />
        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
          <Picker.Item key={day} label={day} value={day} />
        ))}
      </Picker>

      {/* Start Time */}
      <Picker selectedValue={startTime} style={styles.input} onValueChange={(itemValue) => setStartTime(itemValue)}>
        <Picker.Item label="Select Start Time" value="" />
        {['10:30', '11:30', '12:30', '1:30', '2:00', '3:00', '4:00', '5:00'].map(time => (
          <Picker.Item key={time} label={time} value={time} />
        ))}
      </Picker>

      {/* End Time */}
      <Picker selectedValue={endTime} style={styles.input} onValueChange={(itemValue) => setEndTime(itemValue)}>
        <Picker.Item label="Select End Time" value="" />
        {['11:30', '12:30', '1:30', '2:00', '3:00', '4:00', '5:00', '6:00'].map(time => (
          <Picker.Item key={time} label={time} value={time} />
        ))}
      </Picker>

      {/* Course Name */}
      <TextInput
        style={styles.input}
        placeholder="Course Name"
        placeholderTextColor="#ccc"
        value={courseName}
        onChangeText={setCourseName}
      />

      {/* Class Room */}
      <TextInput
        style={styles.input}
        placeholder="Class Room"
        placeholderTextColor="#ccc"
        value={classRoom}
        onChangeText={setClassRoom}
      />

      {/* Teacher */}
      <Picker selectedValue={teacherId} style={styles.input} onValueChange={(itemValue) => setTeacherId(itemValue)}>
        <Picker.Item label="Select Teacher" value="" />
        {teachers.map((t) => (
          <Picker.Item key={t.id} label={t.teacher_id} value={t.id} />
        ))}
      </Picker>

      {/* Department */}
      <Picker selectedValue={department} style={styles.input} onValueChange={(itemValue) => setDepartment(itemValue)}>
        <Picker.Item label="Select Department" value="" />
        {['Civil', 'Computer', 'IT', 'Electrical', 'Electronics', 'Structural'].map(dept => (
          <Picker.Item key={dept} label={dept} value={dept.toLowerCase()} />
        ))}
      </Picker>

      {/* Semester */}
      <Picker selectedValue={semester} style={styles.input} onValueChange={(itemValue) => setSemester(itemValue)}>
        <Picker.Item label="Select Semester" value="" />
        {Array.from({ length: 8 }, (_, i) => (
          <Picker.Item key={i + 1} label={`${i + 1}`} value={`${i + 1}`} />
        ))}
      </Picker>

      {/* Batch */}
      <Picker selectedValue={batch} style={styles.input} onValueChange={(itemValue) => setBatch(itemValue)}>
        <Picker.Item label="Select Batch" value="" />
        {['A', 'B', 'C', 'D', 'E', 'F'].map(b => (
          <Picker.Item key={b} label={b} value={b} />
        ))}
      </Picker>

      <TouchableOpacity onPress={handleSubmit} style={styles.createButton}>
        <Text style={styles.buttonText}>Create Schedule</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#0f1322',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    alignSelf: 'center',
  },
  input: {
    height: 40,
    backgroundColor: '#2F3847',
    color: 'white',
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  createButton: {
    backgroundColor: '#78afba',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'black',
    fontWeight: 'bold',
  },
});

export default CreateScheduleScreen;
