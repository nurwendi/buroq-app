import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { AlertProvider } from './src/context/AlertContext';
import Navigation from './src/navigation';
import { requestInitialPermissions } from './src/utils/permissions';
import { useAuth } from './src/context/AuthContext';
import { usePushNotifications } from './src/hooks/usePushNotifications';
import apiClient from './src/api/client';
import { registerBackgroundNotificationTask } from './src/utils/BackgroundService';

const PushTokenHandler = () => {
  const { user, token } = useAuth();
  const { expoPushToken } = usePushNotifications();

  useEffect(() => {
    if (user && token && expoPushToken?.data) {
      apiClient.post('/api/user/push-token', { expoPushToken: expoPushToken.data })
        .catch((err: any) => console.error('Failed to update push token', err));
    }
  }, [user, token, expoPushToken]);

  return null;
};

export default function App() {
  useEffect(() => {
    requestInitialPermissions();
    registerBackgroundNotificationTask(5); // 5 minutes interval approved by user
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <LanguageProvider>
            <AlertProvider>
              <PushTokenHandler />
              <NavigationContainer>
                <Navigation />
                <StatusBar style="auto" />
              </NavigationContainer>
            </AlertProvider>
          </LanguageProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
