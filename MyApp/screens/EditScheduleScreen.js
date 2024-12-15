import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';

const EditScheduleScreen = ({ route, navigation }) => {
  const { entry_id } = route.params;

  console.log('Fetching schedule for entry_id:', entry_id);

  
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the schedule details and teacher list when the component loads
    const fetchData = async () => {
      try {
        const response = await axios.get(`http://172.20.10.10:5000/edit_schedule/${entry_id}`);
        const data = response.data;
        setDayOfWeek(data.day_of_week);
        setStartTime(data.time_start);
        setEndTime(data.time_end);
        setCourseName(data.course_name);
        setClassRoom(data.classroom);
        setTeacherId(data.teacher_id);
        setDepartment(data.department);
        setSemester(data.semester);
        setBatch(data.batch);
        setTeachers(data.teachers);
      } catch (error) {
        console.error('Error fetching schedule data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [entry_id]);

  console.log('Fetching schedule for entry_id:', entry_id);


  const handleUpdate = async () => {
    try {
      await axios.post(`http://172.20.10.10:5000/edit_schedule/${entry_id}`, {
        day_of_week: dayOfWeek,
        time_start: startTime,
        time_end: endTime,
        course_name: courseName,
        classroom: classRoom,
        teacher_id: teacherId,
        department,
        semester,
        batch,
      });
      alert('Schedule updated successfully');
      navigation.goBack(); // Go back to the previous screen after updating
    } catch (error) {
      console.error('Error updating schedule:', error);
      alert('Failed to update schedule');
    }
  };

  if (loading) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Edit Schedule</Text>
      <Picker selectedValue={dayOfWeek} style={styles.input} onValueChange={(itemValue) => setDayOfWeek(itemValue)}>
        <Picker.Item label="Select Day" value="" />
        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
          <Picker.Item key={day} label={day} value={day} />
        ))}
      </Picker>
      <Picker selectedValue={startTime} style={styles.input} onValueChange={(itemValue) => setStartTime(itemValue)}>
        <Picker.Item label="Select Start Time" value="" />
        {['10:30', '11:30', '12:30', '1:30', '2:00', '3:00', '4:00', '5:00'].map(time => (
          <Picker.Item key={time} label={time} value={time} />
        ))}
      </Picker>
      <Picker selectedValue={endTime} style={styles.input} onValueChange={(itemValue) => setEndTime(itemValue)}>
        <Picker.Item label="Select End Time" value="" />
        {['11:30', '12:30', '1:30', '2:00', '3:00', '4:00', '5:00', '6:00'].map(time => (
          <Picker.Item key={time} label={time} value={time} />
        ))}
      </Picker>
      <TextInput
        style={styles.input}
        placeholder="Course Name"
        placeholderTextColor="#ccc"
        value={courseName}
        onChangeText={setCourseName}
      />
      <TextInput
        style={styles.input}
        placeholder="Class Room"
        placeholderTextColor="#ccc"
        value={classRoom}
        onChangeText={setClassRoom}
      />
      <Picker selectedValue={teacherId} style={styles.input} onValueChange={(itemValue) => setTeacherId(itemValue)}>
        <Picker.Item label="Select Teacher" value="" />
        {teachers.map((teacher) => (
          <Picker.Item key={teacher.id} label={teacher.name} value={teacher.id} />
        ))}
      </Picker>
      <Picker selectedValue={department} style={styles.input} onValueChange={(itemValue) => setDepartment(itemValue)}>
        <Picker.Item label="Select Department" value="" />
        {['Civil', 'Computer', 'IT', 'Electrical', 'Electronics', 'Structural'].map(dept => (
          <Picker.Item key={dept} label={dept} value={dept.toLowerCase()} />
        ))}
      </Picker>
      <Picker selectedValue={semester} style={styles.input} onValueChange={(itemValue) => setSemester(itemValue)}>
        <Picker.Item label="Select Semester" value="" />
        {Array.from({ length: 8 }, (_, i) => (
          <Picker.Item key={i + 1} label={`${i + 1}`} value={`${i + 1}`} />
        ))}
      </Picker>
      <Picker selectedValue={batch} style={styles.input} onValueChange={(itemValue) => setBatch(itemValue)}>
        <Picker.Item label="Select Batch" value="" />
        {['A', 'B', 'C', 'D', 'E', 'F'].map(b => (
          <Picker.Item key={b} label={b} value={b} />
        ))}
      </Picker>
      <TouchableOpacity onPress={handleUpdate} style={styles.createButton}>
        <Text style={styles.buttonText}>Update Schedule</Text>
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

export default EditScheduleScreen;
