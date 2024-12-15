import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import axios from 'axios';  // Add axios to handle API requests

// Adjusted ManualAttendanceScreen
const ManualAttendanceScreen = () => {
    const [students, setStudents] = useState([]);
    const [manualAttendanceEnabled, setManualAttendanceEnabled] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        fetchStudents();
    }, []);

    
    const fetchStudents = async () => {
        try {
            const response = await axios.get('http://172.20.10.10:5000/get_students');
            console.log("Fetched students:", response.data.students);
            setStudents(response.data.students);
        } catch (error) {
            console.error("Error fetching students:", error);
        }
    };

    const toggleManualAttendance = async () => {
        try {
            await axios.post('http://172.20.10.10:5000/toggle_manual_attendance_all', {
                is_enabled: !manualAttendanceEnabled
            });
            setManualAttendanceEnabled(!manualAttendanceEnabled);
        } catch (error) {
            console.error("Error toggling manual attendance for all:", error);
        }
    };

    const handleSelectStudent = (studentId) => {
        setSelectedStudents((prevSelected) =>
            prevSelected.includes(studentId)
                ? prevSelected.filter(id => id !== studentId)
                : [...prevSelected, studentId]
        );
    };

    const handleEnableForSelected = async () => {
        try {
            await axios.post('http://172.20.10.10:5000/toggle_manual_attendance_selected', {
                student_ids: selectedStudents,
                enable: true
            });
            console.log("Enabled for students:", selectedStudents);
        } catch (error) {
            console.error("Error enabling manual attendance for selected students:", error);
        }
    };

    const handleDisableForSelected = async () => {
        try {
            await axios.post('http://172.20.10.10:5000/toggle_manual_attendance_selected', {
                student_ids: selectedStudents,
                enable: false
            });
            console.log("Disabled for students:", selectedStudents);
        } catch (error) {
            console.error("Error disabling manual attendance for selected students:", error);
        }
    };

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchText.toLowerCase()) ||
        student.student_id.toString().includes(searchText)  // Ensure it's a string comparison
    );
    


    return (
        <View style={styles.container}>
            {/* Header with Go Back and Logout buttons */}
            {/* <View style={styles.header}>
                <TouchableOpacity style={styles.backButton}>
                    <Text style={styles.buttonText}>←</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.logoutButton}>
                    <Text style={styles.buttonText}>⇄</Text>
                </TouchableOpacity>
            </View> */}

            {/* Toggle Manual Attendance Button */}
            <TouchableOpacity
                style={[styles.toggleButton, manualAttendanceEnabled ? styles.toggleOn : styles.toggleOff]}
                onPress={toggleManualAttendance}
            >
                <Text style={styles.toggleButtonText}>
                    {manualAttendanceEnabled ? "Disable manual attendance for all students" : "Enable manual attendance for all students"}
                </Text>
            </TouchableOpacity>

            {/* Search Input */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search for student by ID"
                    placeholderTextColor="#ccc"
                    value={searchText}
                    onChangeText={setSearchText}
                />
            </View>

            {/* List of Students */}
            <ScrollView style={styles.studentList}>
                {filteredStudents.map(student => (
                    <TouchableOpacity
                        key={student.id}
                        style={styles.studentItem}
                        onPress={() => handleSelectStudent(student.id)}
                    >
                        <View style={styles.checkbox}>
                            {selectedStudents.includes(student.id) && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                        <Text style={styles.studentText}>{student.name}</Text>
                        <Text style={styles.studentText}>{student.student_id}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Enable and Disable Buttons */}
            <View style={styles.actionButtonsContainer}>
                <TouchableOpacity style={styles.enableButton} onPress={handleEnableForSelected}>
                    <Text style={styles.actionButtonText}>Enable for selected students</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.disableButton} onPress={handleDisableForSelected}>
                    <Text style={styles.actionButtonText}>Disable for selected students</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#0f1322',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    backButton: {
        padding: 10,
        backgroundColor: '#555',
        borderRadius: 20,
    },
    logoutButton: {
        padding: 10,
        backgroundColor: '#555',
        borderRadius: 20,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 20,
    },
    toggleButton: {
        padding: 15,
        borderRadius: 20,
        marginBottom: 16,
        alignItems: 'center',
    },
    toggleOn: {
        backgroundColor: 'red',
    },
    toggleOff: {
        backgroundColor: '#78afba',
    },
    toggleButtonText: {
        color: 'black',
        fontSize: 16,
    },
    searchContainer: {
        marginBottom: 16,
    },
    searchInput: {
        backgroundColor: '#555',
        color: '#FFF',
        padding: 10,
        borderRadius: 10,
    },
    studentList: {
        flex: 1,
        marginVertical: 10,
    },
    studentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        marginBottom: 8,
        backgroundColor: '#858585',
        borderRadius: 10,
    },
    checkbox: {
        width: 24,
        height: 24,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#FFF',
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkmark: {
        color: 'white',
        fontSize: 16,
    },
    studentText: {
        color: 'black',
        fontWeight: 'bold',
        marginRight: 10,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    enableButton: {
        flex: 1,
        padding: 15,
        backgroundColor: '#78afba',
        borderRadius: 20,
        alignItems: 'center',
        marginRight: 8,
    },
    disableButton: {
        flex: 1,
        padding: 15,
        backgroundColor: 'red',
        borderRadius: 20,
        alignItems: 'center',
        marginLeft: 8,
    },
    actionButtonText: {
        color: 'black',
        fontSize: 16,
    },
});

export default ManualAttendanceScreen;
