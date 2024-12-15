import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, TextInput, Dimensions, Platform } from 'react-native';
import { Camera, CameraType } from 'expo-camera/legacy';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import * as ImageManipulator from 'expo-image-manipulator';

const CameraScreen = ({ navigation }) => {
  const { logout } = useAuth();
  const [hasPermission, setHasPermission] = useState(null);
  const cameraRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [studentId, setStudentId] = useState('');
  const [cameraType, setCameraType] = useState(CameraType.back);
  const [imagePadding, setImagePadding] = useState(0);
  const [ratio, setRatio] = useState('4:3'); // Default ratio
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
      try {
        const options = { quality: 0.5, base64: true };
        const photo = await cameraRef.current.takePictureAsync(options);
        console.log('Captured image URI:', photo.uri);

        // Fix the image orientation
        const fixedImage = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ rotate: 0 }], // Adjusts orientation automatically
          { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
        );

        setCapturedImage(fixedImage.uri);
      } catch (error) {
        console.error('Error capturing image:', error);
      }
    } else {
      console.log("Camera reference is not set");
    }
  };

  const handleUploadImage = async () => {
    if (!capturedImage || !studentId) {
      Alert.alert('Error', 'Please capture an image and enter Student ID.');
      return;
    }

    const formData = new FormData();
    formData.append('studentId', studentId);
    formData.append('imageData', {
      uri: capturedImage,
      name: `photo.jpg`,
      type: 'image/jpeg',
    });

    try {
      const response = await fetch('http://172.20.10.10:5000/api/facial-recognition/test', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('Upload response:', data);

      if (response.ok) {
        Alert.alert('Success', data.message);
      } else {
        Alert.alert('Error', data.message);
      }
      // Reset the captured image and student ID
      setCapturedImage(null);
      //setStudentId('');

    } catch (error) {
      Alert.alert('Error', 'An error occurred while testing the image.');
      console.error('Upload error:', error);
    }
  };

  if (hasPermission === null) {
    return <View style={styles.container}><Text>Requesting camera permissions...</Text></View>;
  }
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text>No access to camera</Text>
        <TouchableOpacity onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraType = () => {
    setCameraType((current) =>
      current === CameraType.back ? CameraType.front : CameraType.back
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.cameraContainer, { marginTop: imagePadding, marginBottom: imagePadding }]}>
        <Camera 
          style={styles.camera} 
          ref={cameraRef} 
          type={cameraType} 
          ratio={ratio} // Apply the calculated ratio
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

      <TouchableOpacity style={styles.button} onPress={handleUploadImage}>
        <Text style={styles.buttonText}>Upload and Test</Text>
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

export default CameraScreen;
