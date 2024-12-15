import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ImageBackground } from 'react-native';

const LoadingScreen = () => {
    return (
        <ImageBackground 
            source={require('../assets/home_screen.png')}
            style={styles.background}
        >
            {/* Centered Content */}
            <View style={styles.content}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.7)', // translucent background for better readability
        padding: 20,
        borderRadius: 10,
    },
    loadingText: {
        marginTop: 20,
        fontSize: 18,
        color: '#333',
    },
});

export default LoadingScreen;
