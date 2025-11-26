import React, { createContext, useCallback, useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RESULTS } from 'react-native-permissions';
import { PermissionService } from '../services/permissions';
import { LocationService } from '../services/location';
import type { Position } from '../services/location';
import { PermissionState, PermissionStatus } from '../services/permissions/types';
import { logger } from '../utils/logger';

export interface AppSettings {
  mapStyle: 'default' | 'satellite' | 'terrain';
  showVesselLabels: boolean;
  autoCenter: boolean;
  notificationsEnabled: boolean;
  darkMode: boolean;
}

export interface LocationState {
  current: Position | null;
  tracking: boolean;
  watchId: number | null;
  error: string | null;
}

export interface AppContextState {
  permissions: PermissionState;
  permissionsLoading: boolean;
  location: LocationState;
  settings: AppSettings;
  settingsLoading: boolean;
  appState: AppStateStatus;
}

export interface AppContextActions {
  checkPermissions: () => Promise<void>;
  openSettings: () => Promise<void>;
  getCurrentLocation: () => Promise<void>;
  startLocationTracking: () => void;
  stopLocationTracking: () => void;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

export interface AppContextValue extends AppContextState, AppContextActions {
  hasNotificationPermission: boolean;
  hasLocationPermission: boolean;
  isNotificationBlocked: boolean;
  isLocationBlocked: boolean;
  shouldShowNotificationPrompt: boolean;
  shouldShowLocationPrompt: boolean;
}

const STORAGE_KEYS = {
  SETTINGS: '@app_settings',
};

const DEFAULT_SETTINGS: AppSettings = {
  mapStyle: 'default',
  showVesselLabels: true,
  autoCenter: true,
  notificationsEnabled: true,
  darkMode: false,
};

const DEFAULT_PERMISSION_STATE: PermissionState = {
  notification: null,
  location: null,
  notificationAsked: false,
  locationAsked: false,
};

const DEFAULT_LOCATION_STATE: LocationState = {
  current: null,
  tracking: false,
  watchId: null,
  error: null,
};

export const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permissions, setPermissions] = useState<PermissionState>(DEFAULT_PERMISSION_STATE);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [location, setLocation] = useState<LocationState>(DEFAULT_LOCATION_STATE);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const appStateRef = useRef(AppState.currentState);
  const previousPermissionsRef = useRef<PermissionState>(DEFAULT_PERMISSION_STATE);
  const locationWatchIdRef = useRef<number | null>(null);

  const checkPermissions = useCallback(async () => {
    setPermissionsLoading(true);
    try {
      // Check each permission individually with error handling
      let notificationStatus: PermissionStatus = RESULTS.UNAVAILABLE;
      let locationStatus: PermissionStatus = RESULTS.UNAVAILABLE;
      let notificationAsked = false;
      let locationAsked = false;

      try {
        notificationStatus = await PermissionService.checkNotificationPermission();
      } catch (err) {
        logger.error('Failed to check notification permission:', err);
      }

      try {
        locationStatus = await PermissionService.checkLocationPermission();
      } catch (err) {
        logger.error('Failed to check location permission:', err);
      }

      try {
        notificationAsked = await PermissionService.wasNotificationAsked();
      } catch (err) {
        logger.error('Failed to check notification asked status:', err);
      }

      try {
        locationAsked = await PermissionService.wasLocationAsked();
      } catch (err) {
        logger.error('Failed to check location asked status:', err);
      }

      const newPermissions = {
        notification: notificationStatus,
        location: locationStatus,
        notificationAsked,
        locationAsked,
      };

      // Detect permission changes (revoked by user in system settings)
      const prevPerms = previousPermissionsRef.current;
      
      // Check if location was granted and now is denied/blocked
      if (
        (prevPerms.location === RESULTS.GRANTED || prevPerms.location === RESULTS.LIMITED) &&
        (locationStatus === RESULTS.DENIED || locationStatus === RESULTS.BLOCKED)
      ) {
        logger.warn('Location permission was revoked by user');
        // Stop location tracking if it's active
        if (locationWatchIdRef.current !== null) {
          try {
            LocationService.clearWatch(locationWatchIdRef.current);
            locationWatchIdRef.current = null;
            setLocation(prev => ({
              ...prev,
              tracking: false,
              watchId: null,
              error: 'Location permission was revoked',
            }));
            logger.info('Location tracking stopped due to permission revocation');
          } catch (err) {
            logger.error('Error stopping location tracking:', err);
          }
        }
      }

      // Check if notification was granted and now is denied/blocked
      if (
        (prevPerms.notification === RESULTS.GRANTED || prevPerms.notification === RESULTS.LIMITED) &&
        (notificationStatus === RESULTS.DENIED || notificationStatus === RESULTS.BLOCKED)
      ) {
        logger.warn('Notification permission was revoked by user');
      }

      // Update refs and state
      previousPermissionsRef.current = newPermissions;
      setPermissions(newPermissions);

      logger.info('Permissions checked:', {
        notification: notificationStatus,
        location: locationStatus,
      });
    } catch (error) {
      logger.error('Error checking permissions:', error);
    } finally {
      setPermissionsLoading(false);
    }
  }, []);

  const openSettings = useCallback(async () => {
    await PermissionService.openSettings();
  }, []);

  const getCurrentLocation = useCallback(async () => {
    try {
      setLocation(prev => ({ ...prev, error: null }));
      const position = await LocationService.getCurrentPosition();
      setLocation(prev => ({ ...prev, current: position }));
      logger.info('Current location obtained:', position);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get location';
      setLocation(prev => ({ ...prev, error: errorMessage }));
      logger.error('Error getting current location:', error);
    }
  }, []);

  const startLocationTracking = useCallback(() => {
    if (location.tracking) {
      logger.warn('Location tracking already active');
      return;
    }

    // Check if we have location permission before starting
    if (permissions.location !== RESULTS.GRANTED && permissions.location !== RESULTS.LIMITED) {
      logger.warn('Cannot start location tracking: permission not granted');
      setLocation(prev => ({
        ...prev,
        error: 'Location permission not granted',
      }));
      return;
    }

    const watchId = LocationService.watchPosition(
      (position) => {
        setLocation(prev => ({
          ...prev,
          current: position,
          error: null,
        }));
      },
      (error) => {
        setLocation(prev => ({
          ...prev,
          error: error.message,
        }));
      },
    );

    locationWatchIdRef.current = watchId;
    setLocation(prev => ({
      ...prev,
      tracking: true,
      watchId,
    }));

    logger.info('Location tracking started');
  }, [location.tracking]);

  const stopLocationTracking = useCallback(() => {
    if (locationWatchIdRef.current !== null) {
      try {
        LocationService.clearWatch(locationWatchIdRef.current);
        locationWatchIdRef.current = null;
        setLocation(prev => ({
          ...prev,
          tracking: false,
          watchId: null,
        }));
        logger.info('Location tracking stopped');
      } catch (error) {
        logger.error('Error stopping location tracking:', error);
        // Force reset tracking state even if clearWatch fails
        locationWatchIdRef.current = null;
        setLocation(prev => ({
          ...prev,
          tracking: false,
          watchId: null,
        }));
      }
    }
  }, []);

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        logger.info('Settings loaded from storage');
      }
    } catch (error) {
      logger.error('Error loading settings:', error);
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    try {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      logger.info('Settings updated:', newSettings);
    } catch (error) {
      logger.error('Error updating settings:', error);
    }
  }, [settings]);

  const resetSettings = useCallback(async () => {
    try {
      setSettings(DEFAULT_SETTINGS);
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      logger.info('Settings reset to defaults');
    } catch (error) {
      logger.error('Error resetting settings:', error);
    }
  }, []);

  const hasNotificationPermission =
    permissions.notification === RESULTS.GRANTED ||
    permissions.notification === RESULTS.LIMITED;

  const hasLocationPermission =
    permissions.location === RESULTS.GRANTED ||
    permissions.location === RESULTS.LIMITED;

  const isNotificationBlocked = permissions.notification === RESULTS.BLOCKED;
  const isLocationBlocked = permissions.location === RESULTS.BLOCKED;

  const shouldShowNotificationPrompt =
    !permissions.notificationAsked && !hasNotificationPermission;

  const shouldShowLocationPrompt =
    !permissions.locationAsked && !hasLocationPermission;

  useEffect(() => {
    const initialize = async () => {
      await Promise.all([
        checkPermissions(),
        loadSettings(),
      ]);
    };

    initialize();
  }, [checkPermissions, loadSettings]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        logger.info('App came to foreground, refreshing permissions');
        await checkPermissions();
      }

      appStateRef.current = nextAppState;
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, [checkPermissions]);

  // Cleanup: Stop location tracking when component unmounts
  useEffect(() => {
    return () => {
      if (locationWatchIdRef.current !== null) {
        LocationService.clearWatch(locationWatchIdRef.current);
      }
    };
  }, []);

  const value: AppContextValue = {
    permissions,
    permissionsLoading,
    location,
    settings,
    settingsLoading,
    appState,
    checkPermissions,
    openSettings,
    getCurrentLocation,
    startLocationTracking,
    stopLocationTracking,
    updateSettings,
    resetSettings,
    hasNotificationPermission,
    hasLocationPermission,
    isNotificationBlocked,
    isLocationBlocked,
    shouldShowNotificationPrompt,
    shouldShowLocationPrompt,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};