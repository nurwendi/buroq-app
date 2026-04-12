import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK';
const LAST_NOTIFICATION_ID_KEY = 'last_notification_id';

// Define the task
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) return BackgroundFetch.BackgroundFetchResult.NoData;

    // Check latest notifications
    const response = await apiClient.get('/api/notifications?limit=1');
    const notifications = response.data;
    
    if (notifications && Array.isArray(notifications) && notifications.length > 0) {
      const topNotification = notifications[0].notification;
      const lastId = await AsyncStorage.getItem(LAST_NOTIFICATION_ID_KEY);

      if (topNotification.id !== lastId) {
        // We have a new notification!
        await Notifications.scheduleNotificationAsync({
          content: {
            title: topNotification.title || 'Notifikasi Baru',
            body: topNotification.message || 'Anda mendapatkan pesan baru.',
            data: { id: topNotification.id, type: topNotification.type },
            sound: 'default',
          },
          trigger: null, // show immediately
        });

        // Save last seen ID
        await AsyncStorage.setItem(LAST_NOTIFICATION_ID_KEY, topNotification.id);
        return BackgroundFetch.BackgroundFetchResult.NewData;
      }
    }

    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('[Background Task] Error checking notifications:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Register and configure the task
export async function registerBackgroundNotificationTask(intervalMinutes = 5) {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK);
    
    if (isRegistered) {
      console.log(`[Background Task] ${BACKGROUND_NOTIFICATION_TASK} is already registered.`);
    }

    await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
      minimumInterval: 60 * intervalMinutes, // interval in seconds
      stopOnTerminate: false, // continue after app is closed
      startOnBoot: true, // start after device reboot
    });
    
    console.log(`[Background Task] ${BACKGROUND_NOTIFICATION_TASK} registered with ${intervalMinutes}m interval.`);
  } catch (err) {
    console.error('[Background Task] Registration failed:', err);
  }
}

export async function unregisterBackgroundNotificationTask() {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK);
    console.log(`[Background Task] ${BACKGROUND_NOTIFICATION_TASK} unregistered.`);
  } catch (err) {
    console.error('[Background Task] Unregistration failed:', err);
  }
}
