import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, TextInput, Dimensions, Platform } from 'react-native';
import { Camera, CameraType } from 'expo-camera/legacy';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import * as ImageManipulator from 'expo-image-manipulator';

const GiveAttendanceScreen = ({ route, navigation }) => {
  const { courseName, studentId: passedStudentId } = route.params; // Get student ID from params
  const { logout } = useAuth();
  const [hasPermission, setHasPermission] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [studentId, setStudentId] = useState(passedStudentId || ''); // Set the state to the passed student ID
  const cameraRef = useRef(null);
  const [cameraType, setCameraType] = useState(CameraType.back);
  const [imagePadding, setImagePadding] = useState(0);
  const [ratio, setRatio] = useState('4:3');
  const [isRatioSet, setIsRatioSet] = useState(false);

  const { height, width } = Dimensions.get('window');
  const screenRatio = height / width;

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    const prepareRatio = async () => {
      if (cameraRef.current && Platform.OS === 'android') {
        const ratios = await cameraRef.current.getSupportedRatiosAsync();
        let closestRatio = '4:3';
        let minDistance = Infinity;

        ratios.forEach((ratio) => {
          const [w, h] = ratio.split(':').map(Number);
          const realRatio = w / h;
          const distance = Math.abs(screenRatio - realRatio);

          if (distance < minDistance) {
            minDistance = distance;
            closestRatio = ratio;
          }
        });

        const [bestWidth, bestHeight] = closestRatio.split(':').map(Number);
        const realBestRatio = bestHeight / bestWidth;
        const remainder = (height - realBestRatio * width) / 2;
        setImagePadding(remainder);
        setRatio(closestRatio);
        setIsRatioSet(true);
      }
    };

    prepareRatio();
  }, [cameraRef.current]);

  const handleCapture = async () => {
    if (cameraRef.current) {
      const options = { quality: 0.5, base64: true };
      const photo = await cameraRef.current.takePictureAsync(options);

      const fixedImage = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ rotate: 0 }],
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
      );

      setCapturedImage(fixedImage.uri);
    }
  };

  const handleSubmitAttendance = async () => {
    if (!capturedImage || !studentId) {
      Alert.alert('Error', 'Please capture an image and ensure Student ID is provided.');
      return;
    }

    const formData = new FormData();
    formData.append('image_data', { uri: capturedImage, name: 'attendance.jpg', type: 'image/jpeg' });
    formData.append('student_id', studentId);
    formData.append('course_name', courseName);

    try {
      const response = await fetch('http://172.20.10.10:5000/process_attendance', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Attendance Recorded', `Welcome, ${data.student_name}!`);
        navigation.goBack();
      } else {
        Alert.alert('Error', data.error || 'Attendance failed.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not record attendance.');
    }
  };

  const toggleCameraType = () => {
    setCameraType((current) =>
      current === CameraType.back ? CameraType.front : CameraType.back
    );
  };

  if (hasPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.cameraContainer, { marginTop: imagePadding, marginBottom: imagePadding }]}>
        <Camera
          style={styles.camera}
          ref={cameraRef}
          type={cameraType}
          ratio={ratio}
        >
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
              <FontAwesome name="camera" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toggleButton} onPress={toggleCameraType}>
              <Text style={styles.buttonText}>Flip Camera</Text>
            </TouchableOpacity>
          </View>
        </Camera>
      </View>

      {capturedImage && <Image source={{ uri: capturedImage }} style={styles.preview} />}

      <TextInput
        style={styles.input}
        placeholder="Enter Student ID"
        value={studentId}
        onChangeText={setStudentId}
        keyboardType="default"
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmitAttendance}>
        <Text style={styles.buttonText}>Submit Attendance</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={() => {
        logout(); 
        navigation.navigate('Login'); 
      }}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  cameraContainer: {
    flex: 1,
    width: '100%',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  captureButton: {
    backgroundColor: '#78afba',
    padding: 15,
    borderRadius: 50,
    marginBottom: 10,
  },
  toggleButton: {
    backgroundColor: '#78afba',
    padding: 10,
    borderRadius: 10,
  },
  preview: {
    width: '100%',
    height: 300,
    marginVertical: 10,
    borderRadius: 10,
  },
  input: {
    backgroundColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    width: '80%',
  },
  button: {
    backgroundColor: '#78afba',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    width: '80%',
  },
  buttonText: {
    color: 'black',
    fontWeight: 'bold',
  },
  logoutButton: {
    marginTop: 20,
  },
});

export default GiveAttendanceScreen;
