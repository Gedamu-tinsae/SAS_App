import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

const clientId = '559763986025-a0qm4brksijqjim9uv8dpkld3e4ufq6o.apps.googleusercontent.com';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [request, response, promptAsync] = AuthSession.useAuthRequest({
    clientId: clientId,
  });

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in both fields.');
      return;
    }
  
    setLoading(true);
    try {
      const response = await fetch('http://172.20.10.10:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        const userData = {
          userId: data.userId,
          role: data.userType,
          name: data.name,
          department: data.department,
          teacherId: data.teacherId,
          studentId: data.studentId,
          batch: data.batch,
          semester: data.semester,
        };
        
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        login(userData);
  
        if (data.userType === 'admin') navigation.navigate('AdminDashboard');
        else if (data.userType === 'teacher') navigation.navigate('TeacherDashboard');
        else if (data.userType === 'student') navigation.navigate('StudentDashboard');
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!request) {
      Alert.alert('Error', 'Google Sign-In is still loading, please try again.');
      return;
    }
    setGoogleLoading(true);
    try {
      const result = await promptAsync();
      if (result?.type === 'success') {
        const { access_token } = result.params;
        const response = await fetch('http://172.20.10.10:5000/google_login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token }),
        });
  
        const data = await response.json();
  
        if (response.ok) {
          const userData = {
            userId: data.userId,
            role: data.userType,
            name: data.name,
            department: data.department,
            teacherId: data.teacherId,
            studentId: data.studentId,
            batch: data.batch,
            semester: data.semester,
          };
  
          await AsyncStorage.setItem('user', JSON.stringify(userData));
          login(userData);
  
          if (data.userType === 'admin') navigation.navigate('AdminDashboard');
          else if (data.userType === 'teacher') navigation.navigate('TeacherDashboard');
          else if (data.userType === 'student') navigation.navigate('StudentDashboard');
        } else {
          Alert.alert('Error', data.message || 'Google login failed');
        }
      } else if (result?.type === 'error') {
        Alert.alert('Error', result.params?.error_description || 'Google login failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong with Google login');
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (response?.type === 'error') {
      console.error(response.params);
      Alert.alert('Google Sign-In Error', response.params?.error_description || 'Something went wrong');
    }
  }, [response]);

  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleLogin();
    }
  }, [response]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#B0B3B8"
        onChangeText={setEmail}
        value={email}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#B0B3B8"
        secureTextEntry
        onChangeText={setPassword}
        value={password}
      />

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.googleButton} onPress={() => promptAsync()}>
        {googleLoading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.buttonText}>Login with Google</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Registration')}>
      <View style={styles.container2}>
        <Text style={styles.noAccountText}> Don't have an account?</Text>
        <Text style={styles.linkText}>Sign Up</Text>
      </View>
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
  loginButton: {
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
    fontSize: 14,
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

export default LoginScreen;
