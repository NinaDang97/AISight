import Geolocation from '@react-native-community/geolocation';
import {logger} from '../../utils/logger';

export interface Position {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
}

export interface LocationError {
  code: number;
  message: string;
}

class LocationService {
  /**
   * Get current user position (optimized for speed)
   * Uses cached/network location first for instant response
   * @returns Promise with user position
   */
  getCurrentPosition(): Promise<Position> {
    return new Promise((resolve, reject) => {
      // Use low accuracy mode for FAST response
      // This uses cached location or network location (WiFi/Cell towers)
      // Much faster than GPS which can take 30+ seconds
      Geolocation.getCurrentPosition(
        position => {
          const userPosition: Position = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            heading: position.coords.heading,
            speed: position.coords.speed,
          };

          logger.info('User location obtained:', userPosition);
          resolve(userPosition);
        },
        error => {
          const locationError: LocationError = {
            code: error.code,
            message: error.message,
          };

          logger.error('Error getting location:', locationError);
          reject(locationError);
        },
        {
          enableHighAccuracy: false, // Fast network/cached location
          timeout: 5000, // Quick 5 second timeout
          maximumAge: 300000, // Accept cached location up to 5 minutes old
        },
      );
    });
  }

  /**
   * Get high accuracy GPS position (slower but more accurate)
   * Use this for navigation or tracking
   * @returns Promise with precise user position
   */
  getHighAccuracyPosition(): Promise<Position> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => {
          const userPosition: Position = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            heading: position.coords.heading,
            speed: position.coords.speed,
          };

          logger.info('High accuracy location obtained:', userPosition);
          resolve(userPosition);
        },
        error => {
          const locationError: LocationError = {
            code: error.code,
            message: error.message,
          };

          logger.error('Error getting high accuracy location:', locationError);
          reject(locationError);
        },
        {
          enableHighAccuracy: true, // Use GPS
          timeout: 30000, // 30 seconds for GPS lock
          maximumAge: 10000, // Fresh location only
        },
      );
    });
  }

  /**
   * Watch user position changes
   * @param callback - Function called when position changes
   * @param errorCallback - Function called on error
   * @returns Watch ID to clear later
   */
  watchPosition(
    callback: (position: Position) => void,
    errorCallback?: (error: LocationError) => void,
  ): number {
    return Geolocation.watchPosition(
      position => {
        const userPosition: Position = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
        };

        logger.info('Position update:', userPosition);
        callback(userPosition);
      },
      error => {
        const locationError: LocationError = {
          code: error.code,
          message: error.message,
        };

        logger.error('Error watching position:', locationError);
        if (errorCallback) {
          errorCallback(locationError);
        }
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10, // Update every 10 meters
        interval: 5000, // Update every 5 seconds
      },
    );
  }

  /**
   * Stop watching position
   * @param watchId - Watch ID returned from watchPosition
   */
  clearWatch(watchId: number): void {
    Geolocation.clearWatch(watchId);
    logger.info('Stopped watching position');
  }

  /**
   * Request location permission (for Android)
   * Note: iOS permissions are handled through Info.plist
   */
  async requestLocationPermission(): Promise<void> {
    // Android 6.0+ requires runtime permission
    // This is already handled by our PermissionService
    logger.info('Location permission should be requested via PermissionService');
  }
}

export default new LocationService();
