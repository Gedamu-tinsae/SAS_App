import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Formik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; 

import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session/providers/google';
import AsyncStorage from '@react-native-async-storage/async-storage';


WebBrowser.maybeCompleteAuthSession();

const clientId = '559763986025-a0qm4brksijqjim9uv8dpkld3e4ufq6o.apps.googleusercontent.com';


const RegistrationScreen = ({ navigation }) => {
  const [userType, setUserType] = useState('');
  const { login } = useAuth(); // Access the login function from context


  // AuthSession hooks inside the component
  const [request, response, promptAsync] = AuthSession.useAuthRequest({
    clientId: clientId,
    
  });

  // Function to handle the token after successful authentication
  const handleToken = async () => {
    if (response?.type === 'success') {
      const { authentication } = response;
      const token = authentication?.accessToken;

      console.log('Access token:', token);

      // If the authentication is successful, fetch user info using the access token
      if (token) {
        try {
          const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const googleData = await userInfoResponse.json();

          // Save user data to AsyncStorage
          await AsyncStorage.setItem('user_data', JSON.stringify(googleData));

          // Call login to update the AuthContext
          login(googleData);

          
          // Navigate to the FinishRegistrationScreen with the Google data
          navigation.navigate('FinishRegistrationScreen', { googleData });
        } catch (error) {
          console.error('Error fetching user info:', error);
          Alert.alert('Error', 'Unable to fetch user info from Google');
        }
      }
    } else if (response?.type === 'error') {
      Alert.alert('Google Sign-In Error', response.params?.error_description || 'Something went wrong');
    }
  };

  // Effect hook to handle the token when the response changes
  useEffect(() => {
    handleToken();
  }, [response]);

  // Call the function to trigger Google login
  const SigninWithGoogle = async () => {
    if (!request) {
      // If request is not loaded, wait for it to finish loading
      console.log('Google Sign-In is still loading, please wait...');
      return;
    }

    try {
      await promptAsync();
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      Alert.alert('Google Sign-In Error', error.message || 'Something went wrong');
    }
  };




  
  const registrationSchema = Yup.object().shape({
    email: Yup.string().email('Invalid email').required('Required'),
    password: Yup.string().min(6, 'Password too short').required('Required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password')], 'Passwords must match')
      .required('Required'),
    name: Yup.string().when('userType', {
      is: (val) => val === 'student' || val === 'teacher',
      then: Yup.string().required('Name is required'),
    }),
    department: Yup.string().when('userType', {
      is: (val) => val === 'student' || val === 'teacher',
      then: Yup.string().required('Department is required'),
    }),
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

  const handleRegister = async (values) => {
    try {
      const response = await axios.post('http://172.20.10.10:5000/register', {
        email: values.email,
        password: values.password,
        userType: userType,
        ...(userType === 'student' && {
          studentId: values.studentId,
          name: values.name,
          department: values.department,
          semester: values.semester,
          batch: values.batch,
        }),
        ...(userType === 'teacher' && {
          teacherId: values.teacherId,
          name: values.name,
          department: values.department,
        }),
      });

      Alert.alert('Success', response.data.message);
      
      // Call login after successful registration
      login({ userId: response.data.userId, userType }); // Assuming userId is returned in response

      navigation.navigate('Login'); // Navigate to Login screen after successful registration
    } catch (error) {
      console.error("Registration Error:", error);
      Alert.alert('Error', error.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <Formik
      initialValues={{
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        department: '',
        studentId: '',
        teacherId: '',
        semester: '',
        batch: '',
      }}
      validationSchema={registrationSchema}
      onSubmit={handleRegister}
    >
      {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
        <View style={styles.container}>
          <Text style={styles.header}>Register</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            onChangeText={handleChange('email')}
            onBlur={handleBlur('email')}
            value={values.email}
          />
          {errors.email && touched.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry
            onChangeText={handleChange('password')}
            onBlur={handleBlur('password')}
            value={values.password}
          />
          {errors.password && touched.password && <Text style={styles.errorText}>{errors.password}</Text>}

          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#999"
            secureTextEntry
            onChangeText={handleChange('confirmPassword')}
            onBlur={handleBlur('confirmPassword')}
            value={values.confirmPassword}
          />
          {errors.confirmPassword && touched.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

          <Picker
            selectedValue={userType}
            onValueChange={(value) => setUserType(value)}
            style={styles.input}
          >
            <Picker.Item label="Select User Type" value="" />
            <Picker.Item label="Student" value="student" />
            <Picker.Item label="Teacher" value="teacher" />
            <Picker.Item label="Admin" value="admin" />
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
                placeholder="Name"
                placeholderTextColor="#999"
                onChangeText={handleChange('name')}
                onBlur={handleBlur('name')}
                value={values.name}
              />
              {errors.name && touched.name && <Text style={styles.errorText}>{errors.name}</Text>}

              <Picker
                selectedValue={values.department}
                style={styles.input}
                onValueChange={handleChange('department')}
                onBlur={handleBlur('department')}
              >
                <Picker.Item label="Select Department" value="" />
                <Picker.Item label="Civil" value="civil" />
                <Picker.Item label="Computer" value="computer" />
                <Picker.Item label="IT" value="it" />
                <Picker.Item label="Electrical" value="electrical" />
                <Picker.Item label="Electronics" value="electronics" />
                <Picker.Item label="Structural" value="structural" />
              </Picker>
              {errors.department && touched.department && <Text style={styles.errorText}>{errors.department}</Text>}

              <Picker
                selectedValue={values.semester}
                style={styles.input}
                onValueChange={handleChange('semester')}
                onBlur={handleBlur('semester')}
              >
                <Picker.Item label="Select Semester" value="" />
                {Array.from({ length: 8 }, (_, i) => (
                  <Picker.Item key={i + 1} label={`${i + 1}`} value={`${i + 1}`} />
                ))}
              </Picker>
              {errors.semester && touched.semester && <Text style={styles.errorText}>{errors.semester}</Text>}

              <Picker
                selectedValue={values.batch}
                style={styles.input}
                onValueChange={handleChange('batch')}
                onBlur={handleBlur('batch')}
              >
                <Picker.Item label="Select Batch" value="" />
                {['A', 'B', 'C', 'D', 'E', 'F'].map(batch => (
                  <Picker.Item key={batch} label={batch} value={batch} />
                ))}
              </Picker>
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

              <TextInput
                style={styles.input}
                placeholder="Name"
                placeholderTextColor="#999"
                onChangeText={handleChange('name')}
                onBlur={handleBlur('name')}
                value={values.name}
              />
              {errors.name && touched.name && <Text style={styles.errorText}>{errors.name}</Text>}

              <Picker
                selectedValue={values.department}
                style={styles.input}
                onValueChange={handleChange('department')}
                onBlur={handleBlur('department')}
              >
                <Picker.Item label="Select Department" value="" />
                <Picker.Item label="Civil" value="civil" />
                <Picker.Item label="Computer" value="computer" />
                <Picker.Item label="IT" value="it" />
                <Picker.Item label="Electrical" value="electrical" />
                <Picker.Item label="Electronics" value="electronics" />
                <Picker.Item label="Structural" value="structural" />
              </Picker>
              {errors.department && touched.department && <Text style={styles.errorText}>{errors.department}</Text>}
            </>
          )}

          <TouchableOpacity style={styles.signUpButton} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Register</Text>
          </TouchableOpacity>


          <TouchableOpacity style={styles.googleButton} onPress={SigninWithGoogle}>
            <Text style={styles.buttonText}>Sign up with Google</Text>
          </TouchableOpacity>

          <View style={styles.container2}>
            <Text style={styles.noAccountText}> Already have an account?</Text>
            <Text style={styles.linkText} onPress={() => navigation.navigate('Login')}>
              Login
            </Text>
          </View>
      
        </View>
      )}
    </Formik>
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
  signUpButton: {
    backgroundColor: 'green',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  linkText: {
    color: 'blue',
    marginTop: 15,
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
  },
  googleButton: { 
    backgroundColor: '#1C86EE', 
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 5,
  },
  container2: {
    flexDirection: 'row',  // This ensures the children are aligned in a row (on the same line)
    justifyContent: 'center',
    alignItems: 'center',
  },
  noAccountText: {
    color: '#fff',  
    fontSize: 14,
    marginRight: 5,  
    marginTop: 15,
  },
});

export default RegistrationScreen;
