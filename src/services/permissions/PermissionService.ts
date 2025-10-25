import {Platform, NativeModules} from 'react-native';
import {
  check,
  request,
  openSettings,
  PERMISSIONS,
  RESULTS,
} from 'react-native-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PermissionStatus,
  PermissionServiceInterface,
} from './types';
import {logger} from '../../utils/logger';

// Get Android API level
const getAndroidAPILevel = (): number => {
  if (Platform.OS === 'android') {
    return NativeModules.PlatformConstants?.Version || 0;
  }
  return 0;
};

const STORAGE_KEYS = {
  NOTIFICATION_ASKED: '@permission_notification_asked',
  LOCATION_ASKED: '@permission_location_asked',
};

class PermissionService implements PermissionServiceInterface {
  /**
   * Check notification permission status
   * Note: On Android < 13, notifications don't require runtime permission
   */
  async checkNotificationPermission(): Promise<PermissionStatus> {
    try {
      if (Platform.OS === 'ios') {
        // For iOS, notifications are not a standard permission in react-native-permissions
        // They are handled through push notification setup
        // We'll track this manually via AsyncStorage
        const asked = await this.wasNotificationAsked();
        if (asked) {
          // Assume granted if already asked (you can enhance this with actual notification status check)
          return RESULTS.GRANTED;
        }
        return RESULTS.DENIED;
      } else {
        // Android 13+ (API 33+) requires POST_NOTIFICATIONS permission
        const apiLevel = getAndroidAPILevel();
        if (apiLevel >= 33) {
          // For Android 13+, check POST_NOTIFICATIONS
          try {
            const result = await check('android.permission.POST_NOTIFICATIONS' as any);
            logger.info('Notification permission status (Android 13+):', result);
            return result;
          } catch (err) {
            logger.warn('POST_NOTIFICATIONS check failed, assuming granted for older API');
            return RESULTS.GRANTED;
          }
        } else {
          // For Android < 13, notifications are always granted
          logger.info('Notification permission status (Android < 13): granted by default');
          return RESULTS.GRANTED;
        }
      }
    } catch (error) {
      logger.error('Error checking notification permission:', error);
      // For Android, assume granted as fallback
      if (Platform.OS === 'android') {
        return RESULTS.GRANTED;
      }
      return RESULTS.UNAVAILABLE;
    }
  }

  /**
   * Check location permission status
   */
  async checkLocationPermission(): Promise<PermissionStatus> {
    try {
      const permission =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
          : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

      const result = await check(permission);
      logger.info('Location permission status:', result);
      return result;
    } catch (error) {
      logger.error('Error checking location permission:', error);
      return RESULTS.UNAVAILABLE;
    }
  }

  /**
   * Request notification permission
   * Note: On Android < 13, notifications don't require runtime permission
   */
  async requestNotificationPermission(): Promise<PermissionStatus> {
    try {
      // Mark as asked
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_ASKED, 'true');

      if (Platform.OS === 'ios') {
        // For iOS, we just mark it as granted after user interaction
        // In a real app, you'd set up push notifications here
        logger.info('Notification permission granted (iOS - manual tracking)');
        return RESULTS.GRANTED;
      } else {
        // Android 13+ (API 33+) requires POST_NOTIFICATIONS permission
        const apiLevel = getAndroidAPILevel();
        if (apiLevel >= 33) {
          try {
            const result = await request('android.permission.POST_NOTIFICATIONS' as any);
            logger.info('Notification permission request result (Android 13+):', result);
            return result;
          } catch (err) {
            logger.warn('POST_NOTIFICATIONS request failed, assuming granted');
            return RESULTS.GRANTED;
          }
        } else {
          // For Android < 13, notifications are always granted
          logger.info('Notification permission granted (Android < 13): no permission needed');
          return RESULTS.GRANTED;
        }
      }
    } catch (error) {
      logger.error('Error requesting notification permission:', error);
      // For Android, assume granted as fallback
      if (Platform.OS === 'android') {
        return RESULTS.GRANTED;
      }
      return RESULTS.UNAVAILABLE;
    }
  }

  /**
   * Request location permission
   */
  async requestLocationPermission(): Promise<PermissionStatus> {
    try {
      const permission =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
          : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

      const result = await request(permission);
      logger.info('Location permission request result:', result);

      // Mark as asked
      await AsyncStorage.setItem(STORAGE_KEYS.LOCATION_ASKED, 'true');

      return result;
    } catch (error) {
      logger.error('Error requesting location permission:', error);
      return RESULTS.UNAVAILABLE;
    }
  }

  /**
   * Open app settings
   */
  async openSettings(): Promise<void> {
    try {
      await openSettings();
    } catch (error) {
      logger.error('Error opening settings:', error);
    }
  }

  /**
   * Check if notification permission is granted
   */
  async hasNotificationPermission(): Promise<boolean> {
    const status = await this.checkNotificationPermission();
    return status === RESULTS.GRANTED || status === RESULTS.LIMITED;
  }

  /**
   * Check if location permission is granted
   */
  async hasLocationPermission(): Promise<boolean> {
    const status = await this.checkLocationPermission();
    return status === RESULTS.GRANTED || status === RESULTS.LIMITED;
  }

  /**
   * Check if notification permission was already asked
   */
  async wasNotificationAsked(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_ASKED);
      return value === 'true';
    } catch (error) {
      logger.error('Error checking notification asked status:', error);
      return false;
    }
  }

  /**
   * Check if location permission was already asked
   */
  async wasLocationAsked(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.LOCATION_ASKED);
      return value === 'true';
    } catch (error) {
      logger.error('Error checking location asked status:', error);
      return false;
    }
  }

  /**
   * Reset permission tracking (for testing)
   */
  async resetPermissionTracking(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.NOTIFICATION_ASKED,
        STORAGE_KEYS.LOCATION_ASKED,
      ]);
      logger.info('Permission tracking reset');
    } catch (error) {
      logger.error('Error resetting permission tracking:', error);
    }
  }
}

export default new PermissionService();
