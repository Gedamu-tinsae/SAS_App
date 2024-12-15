import React, { useState } from 'react';
import { View, Text, Button, TouchableOpacity, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';

const screenWidth = Dimensions.get("window").width;

const AdminStaticsScreen = () => {
  const [selectedDepartment, setSelectedDepartment] = useState("department1");
  const [selectedCourse, setSelectedCourse] = useState("course1");
  const [redZoneStudents, setRedZoneStudents] = useState(["Student A", "Student B"]);
  const [showRedZoneList, setShowRedZoneList] = useState(false);

  const mockDepartments = ["Civil", "Computer", "IT", "Electrical", "Electronics","Structural"];
  const mockCourses = ["course1", "course2", "course3", "course4", "course5"];

  // Mock attendance data for departments and courses
  const mockAttendanceData = {
    department1: [20, 45, 28, 80, 99, 43, 50],
    department2: [30, 50, 60, 40, 80, 30, 90],
    course1: [50, 60, 70, 80, 40, 30, 90],
    course2: [40, 50, 30, 60, 80, 70, 50],
  };

  // Function to toggle Red Zone students list
  const toggleRedZoneList = () => {
    setShowRedZoneList(!showRedZoneList);
  };

  return (
    <ScrollView  style={{ flex: 1, backgroundColor: "#0f1322", padding: 20 }}>
      
      {/* Top Navigation Buttons */}
      {/* <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 20 }}>
        <TouchableOpacity style={{ backgroundColor: "#333", padding: 10, borderRadius: 50 }}>
          <Text style={{ color: "white", fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ backgroundColor: "#333", padding: 10, borderRadius: 50 }}>
          <Text style={{ color: "white", fontSize: 18 }}>⟳</Text>
        </TouchableOpacity>
      </View> */}

      {/* Department Dropdown and Graph */}
      <View style={{ backgroundColor: "#78afba", padding: 10, borderRadius: 10, marginBottom: 20 }}>
        <Picker
          selectedValue={selectedDepartment}
          style={{ height: 50, color: "black" }}
          onValueChange={(itemValue) => setSelectedDepartment(itemValue)}
        >
          {mockDepartments.map((dept, index) => (
            <Picker.Item key={index} label={dept} value={dept} />
          ))}
        </Picker>
        <LineChart
          data={{
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [{ data: mockAttendanceData[selectedDepartment] || [] }]
          }}
          width={screenWidth - 60}
          height={200}
          chartConfig={{
            backgroundColor: "#1A1A1A",
            backgroundGradientFrom: "#1A1A1A",
            backgroundGradientTo: "#1A1A1A",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          }}
          style={{ marginVertical: 10, borderRadius: 16 }}
        />
      </View>

      {/* Course Dropdown and Graph */}
      <View style={{ backgroundColor: "#78afba", padding: 10, borderRadius: 10, marginBottom: 20 }}>
        <Picker
          selectedValue={selectedCourse}
          style={{ height: 50, color: "black" }}
          onValueChange={(itemValue) => setSelectedCourse(itemValue)}
        >
          {mockCourses.map((course, index) => (
            <Picker.Item key={index} label={course} value={course} />
          ))}
        </Picker>
        <LineChart
          data={{
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [{ data: mockAttendanceData[selectedCourse] || [] }]
          }}
          width={screenWidth - 60}
          height={200}
          chartConfig={{
            backgroundColor: "#1A1A1A",
            backgroundGradientFrom: "#1A1A1A",
            backgroundGradientTo: "#1A1A1A",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          }}
          style={{ marginVertical: 10, borderRadius: 16 }}
        />
      </View>

      {/* Red Zone Students */}
      <TouchableOpacity
        style={{
          backgroundColor: "#78afba",
          padding: 20,
          borderRadius: 10,
          alignItems: "center",
          marginBottom: 20
        }}
        onPress={toggleRedZoneList}
      >
        <Text style={{ color: "black", fontSize: 16 }}>Red zoned students: {redZoneStudents.length}</Text>
      </TouchableOpacity>

      {showRedZoneList && (
        <ScrollView style={{ backgroundColor: "#333", padding: 10, borderRadius: 10 }}>
          {redZoneStudents.map((student, index) => (
            <Text key={index} style={{ color: "white", fontSize: 16 }}>
              {student}
            </Text>
          ))}
        </ScrollView>
      )}
    </ScrollView >
  );
};

export default AdminStaticsScreen;
