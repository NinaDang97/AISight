import {useState, useEffect, useCallback} from 'react';
import {RESULTS} from 'react-native-permissions';
import {PermissionService} from '../services/permissions';
import {PermissionState, PermissionStatus} from '../services/permissions/types';

export const usePermissions = () => {
  const [permissionState, setPermissionState] = useState<PermissionState>({
    notification: null,
    location: null,
    notificationAsked: false,
    locationAsked: false,
  });

  const [loading, setLoading] = useState(true);

  // Initialize permission states
  const checkPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const [
        notificationStatus,
        locationStatus,
        notificationAsked,
        locationAsked,
      ] = await Promise.all([
        PermissionService.checkNotificationPermission(),
        PermissionService.checkLocationPermission(),
        PermissionService.wasNotificationAsked(),
        PermissionService.wasLocationAsked(),
      ]);

      setPermissionState({
        notification: notificationStatus,
        location: locationStatus,
        notificationAsked,
        locationAsked,
      });
    } catch (error) {
      console.error('Error checking permissions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  // Request notification permission
  const requestNotification = useCallback(async (): Promise<PermissionStatus> => {
    const status = await PermissionService.requestNotificationPermission();
    setPermissionState(prev => ({
      ...prev,
      notification: status,
      notificationAsked: true,
    }));
    return status;
  }, []);

  // Request location permission
  const requestLocation = useCallback(async (): Promise<PermissionStatus> => {
    const status = await PermissionService.requestLocationPermission();
    setPermissionState(prev => ({
      ...prev,
      location: status,
      locationAsked: true,
    }));
    return status;
  }, []);

  // Open settings
  const openSettings = useCallback(async () => {
    await PermissionService.openSettings();
  }, []);

  // Computed values
  const hasNotificationPermission =
    permissionState.notification === RESULTS.GRANTED ||
    permissionState.notification === RESULTS.LIMITED;

  const hasLocationPermission =
    permissionState.location === RESULTS.GRANTED ||
    permissionState.location === RESULTS.LIMITED;

  const isNotificationBlocked = permissionState.notification === RESULTS.BLOCKED;
  const isLocationBlocked = permissionState.location === RESULTS.BLOCKED;

  const shouldShowNotificationPrompt =
    !permissionState.notificationAsked && !hasNotificationPermission;

  const shouldShowLocationPrompt =
    !permissionState.locationAsked && !hasLocationPermission;

  return {
    // State
    permissionState,
    loading,

    // Actions
    requestNotification,
    requestLocation,
    openSettings,
    checkPermissions,

    // Computed
    hasNotificationPermission,
    hasLocationPermission,
    isNotificationBlocked,
    isLocationBlocked,
    shouldShowNotificationPrompt,
    shouldShowLocationPrompt,
  };
};
