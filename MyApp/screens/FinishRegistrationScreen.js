import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';

const FinishRegistrationScreen = ({ navigation }) => {
  const route = useRoute();
  const { googleData } = route.params; // Access the Google sign-in data
  const [userType, setUserType] = useState('');

  const registrationSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    department: Yup.string().required('Department is required'),
    studentId: Yup.string().when('userType', {
      is: 'student',
      then: Yup.string().required('Student ID is required'),
    }),
    teacherId: Yup.string().when('userType', {
      is: 'teacher',
      then: Yup.string().required('Teacher ID is required'),
    }),
    semester: Yup.string().when('userType', {
      is: 'student',
      then: Yup.string().required('Semester is required'),
    }),
    batch: Yup.string().when('userType', {
      is: 'student',
      then: Yup.string().required('Batch is required'),
    }),
  });

  const handleFinishRegistration = async (values) => {
    try {
      const response = await axios.post('http://172.20.10.10:5000/complete_registration', {
        email: googleData.email,
        name: values.name,
        userType,
        ...(userType === 'student' && {
          studentId: values.studentId,
          department: values.department,
          semester: values.semester,
          batch: values.batch,
        }),
        ...(userType === 'teacher' && {
          teacherId: values.teacherId,
          department: values.department,
        }),
      });

      Alert.alert('Success', response.data.message);
      navigation.navigate('Login'); // Navigate to the Login screen after registration
    } catch (error) {
      console.error("Registration Error:", error);
      Alert.alert('Error', error.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <Formik
      initialValues={{
        name: googleData.name,
        department: '',
        studentId: '',
        teacherId: '',
        semester: '',
        batch: '',
      }}
      validationSchema={registrationSchema}
      onSubmit={handleFinishRegistration}
    >
      {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
        <View style={styles.container}>
          <Text style={styles.header}>Complete Your Registration</Text>
          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor="#999"
            value={values.name}
            onChangeText={handleChange('name')}
            onBlur={handleBlur('name')}
          />
          {errors.name && touched.name && <Text style={styles.errorText}>{errors.name}</Text>}

          {/* User Type Picker */}
          <Picker
            selectedValue={userType}
            onValueChange={(value) => setUserType(value)}
            style={styles.input}
          >
            <Picker.Item label="Select User Type" value="" />
            <Picker.Item label="Student" value="student" />
            <Picker.Item label="Teacher" value="teacher" />
          </Picker>

          {userType === 'student' && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Student ID"
                placeholderTextColor="#999"
                onChangeText={handleChange('studentId')}
                onBlur={handleBlur('studentId')}
                value={values.studentId}
              />
              {errors.studentId && touched.studentId && <Text style={styles.errorText}>{errors.studentId}</Text>}

              <TextInput
                style={styles.input}
                placeholder="Semester"
                placeholderTextColor="#999"
                onChangeText={handleChange('semester')}
                onBlur={handleBlur('semester')}
                value={values.semester}
              />
              {errors.semester && touched.semester && <Text style={styles.errorText}>{errors.semester}</Text>}

              <TextInput
                style={styles.input}
                placeholder="Batch"
                placeholderTextColor="#999"
                onChangeText={handleChange('batch')}
                onBlur={handleBlur('batch')}
                value={values.batch}
              />
              {errors.batch && touched.batch && <Text style={styles.errorText}>{errors.batch}</Text>}
            </>
          )}

          {userType === 'teacher' && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Teacher ID"
                placeholderTextColor="#999"
                onChangeText={handleChange('teacherId')}
                onBlur={handleBlur('teacherId')}
                value={values.teacherId}
              />
              {errors.teacherId && touched.teacherId && <Text style={styles.errorText}>{errors.teacherId}</Text>}
            </>
          )}

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Complete Registration</Text>
          </TouchableOpacity>
        </View>
      )}
    </Formik>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1F2223',
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
  submitButton: {
    backgroundColor: 'green',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
  },
});

export default FinishRegistrationScreen;
