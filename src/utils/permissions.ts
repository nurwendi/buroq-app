import * as Contacts from 'expo-contacts';
import * as Location from 'expo-location';

export const requestInitialPermissions = async () => {
  try {
    // Request contacts permission
    const { status: contactsStatus, canAskAgain: contactsCanAskAgain } = await Contacts.getPermissionsAsync();
    if (contactsStatus !== 'granted' && contactsCanAskAgain) {
      await Contacts.requestPermissionsAsync();
    }

    // Request location permission
    const { status: locationStatus, canAskAgain: locationCanAskAgain } = await Location.getForegroundPermissionsAsync();
    if (locationStatus !== 'granted' && locationCanAskAgain) {
      await Location.requestForegroundPermissionsAsync();
    }
  } catch (error) {
    console.error('Error requesting initial permissions:', error);
  }
};
