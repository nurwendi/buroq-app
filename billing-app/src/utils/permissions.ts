import * as Contacts from 'expo-contacts';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { PermissionsAndroid, Platform } from 'react-native';

export const requestInitialPermissions = async () => {
  try {
    // Request notification permissions
    const { status: notificationStatus } = await Notifications.getPermissionsAsync();
    if (notificationStatus !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }

    // Request contacts permission
    const { status: contactsStatus, canAskAgain: contactsCanAskAgain } = await Contacts.getPermissionsAsync();
    if (contactsStatus === 'undetermined' && contactsCanAskAgain) {
      await Contacts.requestPermissionsAsync();
    }

    // Request location permission
    const { status: locationStatus, canAskAgain: locationCanAskAgain } = await Location.getForegroundPermissionsAsync();
    if (locationStatus === 'undetermined' && locationCanAskAgain) {
      await Location.requestForegroundPermissionsAsync();
    }
  } catch (error) {
    console.error('Error requesting initial permissions:', error);
  }
};

export const requestBluetoothPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    if (Platform.Version >= 31) {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]);
        return (
          granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
          granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (err) {
        console.warn('Bluetooth permission error:', err);
        return false;
      }
    } else {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Location permission error:', err);
        return false;
      }
    }
  }
  return true;
};
