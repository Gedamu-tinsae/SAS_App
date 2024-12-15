import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext'; 
import * as DocumentPicker from 'expo-document-picker'; 
import * as FileSystem from 'expo-file-system'; // New import for file system

const UploadAndTuneScreen = ({ navigation }) => {
  const { logout } = useAuth(); 
  const [studentId, setStudentId] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleFileUpload = async () => {
    const result = await DocumentPicker.getDocumentAsync({ multiple: true });
    console.log("Document picker result:", result); // Log the result
  
    if (result.canceled) { // Check if the operation was canceled
      Alert.alert('File upload cancelled');
    } else if (result.assets) { // Check if there are assets in the result
      setSelectedFiles(prevFiles => [...prevFiles, ...result.assets]); // Update state with selected files
    } else {
      Alert.alert('Error', 'An error occurred while picking the file.'); // Handle unexpected errors
    }
  };

  const handleUploadAndTune = async () => {
    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('images', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream', // Set type based on the file
      });
    });
    formData.append('studentId', studentId);

    try {
      const response = await fetch('http://172.20.10.10:5000/api/facial-recognition/upload', { // Replace with your server URL
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', data.message);
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while uploading the images.');
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Settings and Logout Icons */}
      {/* <View style={styles.topIconsContainer}>
        <TouchableOpacity style={styles.iconButton}>
          <FontAwesome name="cog" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => {
          logout(); 
          navigation.navigate('Login'); 
        }}>
          <FontAwesome name="sign-out" size={24} color="white" />
        </TouchableOpacity>
      </View> */}

      {/* Information Square */}
      <View style={styles.infoSquare}>
        <Text style={styles.infoText1}>Important Reminder:</Text>
        <Text style={styles.infoText}>- Take pictures in slightly different angles, lighting and cameras</Text>
        <Text style={styles.infoText}>- Upload atleast 35 pictures.</Text>
        <Text style={styles.infoText}>- It takes about 5 minute to finish tuning the model.</Text>
      </View>

      {/* Choose File Button */}
      <TouchableOpacity style={styles.uploadButton} onPress={handleFileUpload}>
        <Text style={styles.uploadButtonText}>Choose File to Upload</Text>
      </TouchableOpacity>

      {/* Student ID Input */}
      <TextInput
        style={styles.input}
        placeholder="Enter Student ID"
        value={studentId}
        onChangeText={setStudentId}
        keyboardType="default"
      />

      {/* Upload and Tune Button */}
      <TouchableOpacity style={styles.button} onPress={handleUploadAndTune}>
        <Text style={styles.buttonText}>Upload and Tune</Text>
      </TouchableOpacity>

      {/* Test Model Icon */}
      <TouchableOpacity style={styles.testModelButton} onPress={() => navigation.navigate('CameraScreen')}>
        <FontAwesome name="camera" size={50} color="white" />
        <Text style={[styles.buttonText, {color:"white"}]}>Test Model</Text>
      </TouchableOpacity>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1322',
    padding: 20,
  },
  topIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  iconButton: {
    backgroundColor: '#444',
    padding: 10,
    borderRadius: 50,
  },
  infoSquare: {
    backgroundColor: '#666',
    padding: 20,
    borderRadius: 10,
    alignItems: 'left',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 15,
    color: 'black',
    textAlign: 'left',
    fontWeight:'bold',
  },
  infoText1: {
    fontSize: 18,
    color: 'orange',
    textAlign: 'center',
  },
  uploadButton: {
    backgroundColor: '#78afba',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadButtonText: {
    color: 'black',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#78afba',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'black',
    fontWeight: 'bold',
  },
  testModelButton: {
    alignItems: 'center',
    marginTop: 20,
  },
});

export default UploadAndTuneScreen;
