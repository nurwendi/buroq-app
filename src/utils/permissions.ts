import * as Contacts from 'expo-contacts';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

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
