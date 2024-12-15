import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import axios from 'axios';

const AdminViewAttendanceScreen = () => {
    const [selectedFilters, setSelectedFilters] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredData, setFilteredData] = useState([]); // Initialize as an empty array

    useEffect(() => {
        fetchAttendanceData();
    }, [selectedFilters, searchQuery]);

    const fetchAttendanceData = async () => {
        try {
            const response = await axios.get('http://172.20.10.10:5000/admin/view_all_student_attendance', {
                params: {
                    semester: selectedFilters.sem,
                    batch: selectedFilters.batch,
                    department: selectedFilters.department,
                    student_id: searchQuery || undefined
                }
            });
            setFilteredData(response.data);
        } catch (error) {
            console.error('Error fetching attendance data:', error);
        }
    };

    const calculatePercentage = (attended, total) => (total > 0 ? (attended / total) * 100 : 0);

    const getPercentageColor = (percentage) => {
        if (percentage >= 70) return 'green';
        if (percentage >= 45) return 'yellow';
        return 'red';
    };

    const handleFilterToggle = (type, value) => {
        setSelectedFilters(prevFilters => ({
            ...prevFilters,
            [type]: prevFilters[type] === value ? null : value,
        }));
    };

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

            {/* Semester Filter Buttons */}
            <View style={styles.scrollViewWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                {['1', '2', '3', '4', '5', '6', '7', '8'].map(sem => (
                    <TouchableOpacity
                        key={sem}
                        style={[styles.filterButton, selectedFilters.sem === sem && styles.filterButtonActive]}
                        onPress={() => handleFilterToggle('sem', sem)}
                    >
                        <Text style={styles.filterText}>{`Semester ${sem}`}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
            </View>

            {/* Batch Filter Buttons */}
            <View style={styles.scrollViewWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                {['A', 'B', 'C', 'D', 'E', 'F'].map(batch => (
                    <TouchableOpacity
                        key={batch}
                        style={[styles.filterButton, selectedFilters.batch === batch && styles.filterButtonActive]}
                        onPress={() => handleFilterToggle('batch', batch)}
                    >
                        <Text style={styles.filterText}>{`Batch ${batch}`}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
            </View>

            {/* Department Filter Buttons */}
            {/* Semester Filter Buttons */}
            <View style={styles.scrollViewWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                {['civil', 'computer', 'IT', 'Electrical', 'Electronics', 'Structural'].map(department => (
                    <TouchableOpacity
                        key={department}
                        style={[styles.filterButton, selectedFilters.department === department && styles.filterButtonActive]}
                        onPress={() => handleFilterToggle('department', department)}
                    >
                        <Text style={styles.filterText}>{department}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
            </View>

            {/* Search Input */}
            <TextInput
                style={styles.searchInput}
                placeholder="Search for student by ID"
                placeholderTextColor="#aaa"
                value={searchQuery}
                onChangeText={setSearchQuery}
            />

            {/* List of Students */}
            <ScrollView>
                {filteredData && filteredData.length > 0 ? (
                    filteredData.map((student, index) => {
                        const percentage = calculatePercentage(student.attended, student.total);
                        const percentageColor = getPercentageColor(percentage);

                        return (
                            <View key={student.id || index} style={styles.studentContainer}>
                                <Text style={styles.studentName}>
                                    {student.name} - ID: {student.student_id}
                                </Text>
                                <View style={styles.attendanceContainer}>
                                    <View style={styles.attended}>
                                        <Text style={styles.attendedText}>Attended {student.attended}/{student.total}</Text>
                                    </View>
                                    <View style={[styles.percentage, { backgroundColor: percentageColor }]}>
                                        <Text style={styles.percentageText}>Percentage {Math.round(percentage)}%</Text>
                                    </View>
                                </View>
                            </View>
                        );
                    })
                ) : (
                    <Text style={{ color: '#FFF', textAlign: 'center', marginTop: 20 }}>No attendance data available.</Text>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    scrollViewWrapper: {
        marginVertical: 5, // Remove margin around the wrapper
        paddingVertical: 5, // Remove padding around the wrapper
    },
    
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#0f1322',
        margin:0,
        padding: 0, 
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
    
    filterRow: {
        flexDirection: 'row',
        height: 'auto',
        //backgroundColor: '#666',
        marginVertical: 1,
        
        
    },
    filterButton: {
        paddingVertical: 5,  // Reduced vertical padding
        paddingHorizontal: 10,
        backgroundColor: '#333',
        borderRadius: 15,
        marginHorizontal: 3,
        marginVertical: 1,
        borderWidth: 1,
        width: 100, 
        height: 30,
    },
    filterButtonActive: {
        backgroundColor: '#888',
    },
    filterText: {
        color: '#FFF',
        fontSize: 13, 
    },
    searchInput: {
        padding: 10,
        backgroundColor: '#444',
        color: '#fff',
        borderRadius: 20,
        marginVertical: 10,
    },
    studentContainer: {
        padding: 10,
        backgroundColor: '#858585',
        borderRadius: 10,
        marginVertical: 5,
    },
    studentName: {
        color: 'black',
        fontSize: 16,
        fontWeight: 'bold',
    },
    attendanceContainer: {
        flexDirection: 'row',
        marginTop: 5,
    },
    attended: {
        padding: 5,
        backgroundColor: '#88FF88',
        borderRadius: 10,
        marginRight: 10,
    },
    attendedText: {
        color: 'black',
        fontWeight: 'bold',
    },
    percentage: {
        padding: 5,
        borderRadius: 10,
    },
    percentageText: {
        color: 'black',
        fontWeight: 'bold',
    },
});

export default AdminViewAttendanceScreen;
