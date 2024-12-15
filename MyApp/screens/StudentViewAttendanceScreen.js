import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

const StudentViewAttendanceScreen = () => {
    const [courses, setCourses] = useState([]);
    const [attendanceData, setAttendanceData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [calendarData, setCalendarData] = useState({});
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState('December'); // Default to December for current academic year
    const months = ['December', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November'];

    useEffect(() => {
        const fetchAttendanceData = async () => {
            try {
                const response = await fetch('http://172.20.10.10:5000/api/student/attendance');
                const data = await response.json();
                const courseNames = Object.keys(data);
                const attendanceDetails = courseNames.map(course => ({
                    name: course,
                    ...data[course]
                }));
                setCourses(courseNames);
                setAttendanceData(attendanceDetails);
                setFilteredData(attendanceDetails);
            } catch (error) {
                console.error('Error fetching attendance data:', error);
            }
        };

        const fetchCalendarData = async () => {
            try {
                const response = await fetch('http://172.20.10.10:5000/api/student/attendance_calendar');
                const data = await response.json();
                console.log("Calendar Data Received:", data); 
                setCalendarData(data);
            } catch (error) {
                console.error('Error fetching calendar data:', error);
            }
        };

        fetchAttendanceData();
        fetchCalendarData();
    }, []);

    const handleFilterSelect = (course) => {
        setSelectedCourse(course);
        setFilteredData(course ? attendanceData.filter(data => data.name === course) : attendanceData);
    };

    const handleMonthSelect = (month) => {
        setSelectedMonth(month);
    };

    const renderCalendarDays = () => {
        const daysInMonth = new Date(2024, months.indexOf(selectedMonth) + 1, 0).getDate();
        const monthIndex = months.indexOf(selectedMonth) ;
        
        return Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dateStr = `2024-${String(monthIndex).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const attended = calendarData[dateStr] === true;

            return (
                <View
                    key={day}
                    style={[
                        styles.dayBox,
                        attended ? styles.attendedDay : styles.absentDay
                    ]}
                >
                    <Text style={styles.dayText}>{day}</Text>
                </View>
            );
        });
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

            {/* Month Filter */}
            <View style={styles.scrollViewWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                    {months.map(month => (
                        <TouchableOpacity
                            key={month}
                            style={[styles.filterButton, selectedMonth === month && styles.filterButtonActive]}
                            onPress={() => handleMonthSelect(month)}
                        >
                            <Text style={styles.filterText}>{month}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Filter Buttons for Courses */}
            <View style={styles.scrollViewWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                    <TouchableOpacity
                        style={[styles.filterButton, !selectedCourse && styles.filterButtonActive]}
                        onPress={() => handleFilterSelect(null)}
                    >
                        <Text style={styles.filterText}>All Courses</Text>
                    </TouchableOpacity>
                    {courses.map(course => (
                        <TouchableOpacity
                            key={course}
                            style={[
                                styles.filterButton,
                                selectedCourse === course && styles.filterButtonActive
                            ]}
                            onPress={() => handleFilterSelect(course)}
                        >
                            <Text style={styles.filterText}>{course}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Attendance Summary */}
            {filteredData.map(course => (
                <View key={course.name} style={styles.summaryContainer}>
                    <Text style={styles.summaryText}>
                        {course.name} - Attended: {course.attended_classes}/{course.total_classes} ({course.attendance_percentage}%) - Batch: {course.batch}
                    </Text>
                </View>
            ))}

            {/* Calendar Grid */}
            <View style={styles.calendarContainer}>
                {/* Weekday Headers */}
                <View style={styles.weekdayRow}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <Text key={day} style={styles.weekdayText}>{day}</Text>
                    ))}
                </View>
                
                {/* Calendar Days */}
                <View style={styles.daysContainer}>
                    {renderCalendarDays()}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    scrollViewWrapper: {
        marginVertical: 5,
        paddingVertical: 5,
    },
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
    filterRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    filterButton: {
        padding: 8,
        backgroundColor: '#333',
        borderRadius: 20,
        marginHorizontal: 4,
    },
    filterButtonActive: {
        backgroundColor: '#888',
    },
    filterText: {
        color: '#FFF',
    },
    summaryContainer: {
        padding: 10,
        backgroundColor: '#858585',
        borderRadius: 10,
        marginTop: 20,
    },
    summaryText: {
        color: 'black',
        fontSize: 16,
        textAlign: 'center',
    },
    calendarContainer: {
        marginVertical: 20,
        padding: 10,
        backgroundColor: '#333',
        borderRadius: 10,
    },
    weekdayRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 8,
    },
    weekdayText: {
        color: '#FFF',
        fontSize: 12,
        textAlign: 'center',
        width: 40,
    },
    daysContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
    },
    dayBox: {
        width: 45,
        height: 40,
        margin: 2,
        borderRadius: 5,
    },
    attendedDay: {
        backgroundColor: 'green',
    },
    absentDay: {
        backgroundColor: '#ccc',
    },
    dayText: {
        color: '#333',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 40,
    },
});

export default StudentViewAttendanceScreen;
