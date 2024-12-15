import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import AppNavigator from './navigation/AppNavigator';

import LoadingScreen from './screens/LoadingScreen';

const App = () => {

  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    // Simulate any setup tasks
    const initializeApp = async () => {
      // Simulate loading time
      await new Promise(resolve => setTimeout(resolve, 4000));
      setIsLoading(false); // Once setup is done, stop loading
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return <LoadingScreen />; // Show loading screen while loading is true
  }


  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
};

export default App;
