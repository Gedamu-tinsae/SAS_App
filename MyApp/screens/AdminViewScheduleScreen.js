import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import axios from 'axios';

const AdminViewScheduleScreen = ({ navigation }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [teacherId, setTeacherId] = useState('');

  const semesters = Array.from({ length: 8 }, (_, i) => `${i + 1}`);
  const batches = ['A', 'B', 'C', 'D', 'E', 'F'];
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Fetch schedules with applied filters
  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const params = {
        ...(selectedSemester && { semester: selectedSemester }),
        ...(selectedBatch && { batch: selectedBatch }),
        ...(selectedDay && { day: selectedDay }),
        ...(teacherId && { teacherId }),
      };

      const response = await axios.get(`http://172.20.10.10:5000/get_schedules`, { params });
      setSchedules(response.data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://172.20.10.10:5000/api/schedule/${id}`);
      setSchedules(schedules.filter(schedule => schedule.id !== id));
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Failed to delete schedule');
    }
  };

  const handleEdit = (schedule) => {
    navigation.navigate('EditScheduleScreen', { entry_id: schedule.id });
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin View Schedule</Text>
      
      {/* Filter Input for Teacher ID */}
      <TextInput
        style={styles.input}
        placeholder="Search for teacher's schedule by ID"
        placeholderTextColor="#aaa"
        value={teacherId}
        onChangeText={setTeacherId}
      />

      {/* Filter Row with Horizontal Scroll */}
      <View style={styles.filterContainer}>
        {[semesters, batches, daysOfWeek].map((filterOptions, index) => (
          <ScrollView
            key={index}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            style={styles.filterRow}
          >
            {filterOptions.map(option => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.filterButton,
                  (selectedSemester === option || selectedBatch === option || selectedDay === option) && styles.activeFilter
                ]}
                onPress={() => {
                  if (semesters.includes(option)) setSelectedSemester(option);
                  if (batches.includes(option)) setSelectedBatch(option);
                  if (daysOfWeek.includes(option)) setSelectedDay(option);
                }}
              >
                <Text style={styles.filterText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ))}
      </View>

      {/* Apply Filters Button */}
      <TouchableOpacity onPress={fetchSchedules} style={styles.applyFilterButton}>
        <Text style={styles.applyFilterButtonText}>Apply Filters</Text>
      </TouchableOpacity>

      {/* Schedules List */}
      {schedules.length > 0 ? (
        <FlatList
          data={schedules}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleText}>
                {item.course_name} - {item.day_of_week}, {item.time_start} to {item.time_end} in {item.classroom}
              </Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity onPress={() => handleEdit(item)} style={styles.editButton}>
                  <Text style={styles.buttonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
                  <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      ) : (
        <Text style={styles.noDataText}>No schedules available.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#0f1322',
  },
  title: {
    fontSize: 24,
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 40,
    backgroundColor: '#2F3847',
    color: 'white',
    marginBottom: 20,
    paddingHorizontal: 10,
    borderRadius: 20,
    textAlign: 'center',
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#333',
    borderRadius: 20,
    marginHorizontal: 5,
  },
  activeFilter: {
    backgroundColor: '#555',
  },
  filterText: {
    color: '#fff',
    fontSize: 14,
  },
  applyFilterButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
  },
  applyFilterButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  scheduleItem: {
    backgroundColor: '#777',
    borderRadius: 20,
    padding: 15,
    marginBottom: 10,
  },
  scheduleText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  editButton: {
    backgroundColor: '#78afba',
    padding: 10,
    borderRadius: 20,
    width: '48%',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 20,
    width: '48%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'black',
    fontWeight: 'bold',
  },
  noDataText: {
    color: 'white',
    marginTop: 20,
    textAlign: 'center',
  },
});

export default AdminViewScheduleScreen;
