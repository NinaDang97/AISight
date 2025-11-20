/**
 * GnssContext
 *
 * React Context for managing GNSS data collection and state across the application.
 * This context provides centralized management of the GnssModule,
 * allowing multiple screens to access GNSS data simultaneously.
 *
 * @module GnssContext
 *
 * State managed:
 * - isTracking: Whether GNSS tracking is currently active
 * - isLogging: Whether raw data logging is enabled
 * - location: Current GPS location data
 * - status: Satellite status information
 * - measurements: Raw GNSS measurements array
 * - isGpsEnabled: Whether GPS is enabled on the device
 * - loggingState: Current logging state and file info
 *
 * Usage:
 * 1. Wrap your app with GnssProvider (typically in App.tsx or navigation root)
 * 2. Use useGnss() hook to access GNSS data and control functions
 *
 * @example
 * ```tsx
 * // In App.tsx or navigation root
 * <GnssProvider>
 *   <Navigation />
 * </GnssProvider>
 *
 * // In any screen
 * const { location, status, startTracking, stopTracking } = useGnss();
 * ```
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { DeviceEventEmitter } from 'react-native';
import GnssModule, { GnssLocation, GnssStatus, GnssMeasurement, LoggingState } from '../../native/GnssModule';
import PermissionService from '../../services/permissions/PermissionService';


type GnssContextType = {
  // State
  isTracking: boolean;
  isLogging: boolean;
  location: GnssLocation | null;
  status: GnssStatus | null;
  measurements: GnssMeasurement[];
  isGpsEnabled: boolean;
  loggingState: LoggingState | null;

  // Control functions
  startTracking: () => Promise<boolean>;
  stopTracking: () => Promise<void>;
  startLogging: (fileName?: string) => Promise<string | null>;
  stopLogging: () => Promise<void>;
  checkGpsEnabled: () => Promise<boolean>;
  refreshLoggingState: () => Promise<void>;
};

/**
 * React Context instance for GNSS state
 * Initialized with undefined to enforce provider usage
 */
const GnssContext = createContext<GnssContextType | undefined>(undefined);

/**
 * Custom hook to access GnssContext
 *
 * This hook provides type-safe access to the GNSS context.
 * It must be used within a GnssProvider, otherwise it will throw an error.
 *
 * @throws {Error} If used outside of GnssProvider
 * @returns {GnssContextType} The context value containing state and control functions
 *
 * @example
 * ```tsx
 * const { location, status, startTracking, stopTracking } = useGnss();
 *
 * // Start tracking
 * const success = await startTracking();
 *
 * // Access current location
 * if (location) {
 *   console.log(`Lat: ${location.latitude}, Lon: ${location.longitude}`);
 * }
 * ```
 */
export const useGnss = (): GnssContextType => {
  const context = useContext(GnssContext);
  if (!context) {
    throw new Error('useGnss must be used within a GnssProvider');
  }
  return context;
};

/**
 * GnssProvider Component
 *
 * Context provider that manages GNSS module lifecycle and state.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components that will have access to the context
 *
 * @example
 * ```tsx
 * <GnssProvider>
 *   <GnssScreen />
 *   <MapScreen />
 *   <AnomalyScreen />
 * </GnssProvider>
 * ```
 */
export const GnssProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [location, setLocation] = useState<GnssLocation | null>(null);
  const [status, setStatus] = useState<GnssStatus | null>(null);
  const [measurements, setMeasurements] = useState<GnssMeasurement[]>([]);
  const [isGpsEnabled, setIsGpsEnabled] = useState(false);
  const [loggingState, setLoggingState] = useState<LoggingState | null>(null);

  /**
   * Check if GPS is enabled on the device
   */
  const checkGpsEnabled = useCallback(async (): Promise<boolean> => {
    try {
      const enabled = await GnssModule.isGpsEnabled();
      setIsGpsEnabled(enabled);
      return enabled;
    } catch (error) {
      console.error('Error checking GPS status:', error);
      return false;
    }
  }, []);

  /**
   * Refresh logging state from native module
   */
  const refreshLoggingState = useCallback(async () => {
    try {
      const state = await GnssModule.getLoggingState();
      setLoggingState(state);
      setIsLogging(state.isLogging);
    } catch (error) {
      console.error('Error refreshing logging state:', error);
    }
  }, []);

  /**
   * Request location permissions from user
   */
  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      const hasPermission = await PermissionService.hasLocationPermission();

      if (!hasPermission) {
        const status = await PermissionService.requestLocationPermission();
        if (status !== 'granted' && status !== 'limited') {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('[GnssContext] Error requesting location permission:', error);
      return false;
    }
  };

  const listenersRef = useRef<Array<{ remove: () => void }>>([]);
  const isTrackingRef = useRef(false);

  /**
   * Start GNSS tracking
   * Checks permissions and GPS status before starting
   */
  const startTracking = useCallback(async (): Promise<boolean> => {
    if (isTracking) {
      return true;
    }

    const gpsEnabled = await checkGpsEnabled();
    if (!gpsEnabled) {
      return false;
    }

    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      return false;
    }

    try {
      await GnssModule.start();
      setIsTracking(true);
      isTrackingRef.current = true;

      // Set up DeviceEventEmitter listeners
      const locationListener = DeviceEventEmitter.addListener(
        'gnssLocation',
        (data: GnssLocation) => {
          setLocation(data);
        }
      );
      listenersRef.current.push(locationListener);

      const statusListener = DeviceEventEmitter.addListener(
        'gnssStatus',
        (data: GnssStatus) => {
          setStatus(data);
        }
      );
      listenersRef.current.push(statusListener);

      const measurementsListener = DeviceEventEmitter.addListener(
        'gnssMeasurement',
        (data: GnssMeasurement[]) => {
          setMeasurements(data);
        }
      );
      listenersRef.current.push(measurementsListener);

      const gpsStateListener = DeviceEventEmitter.addListener(
        'gpsStateChanged',
        async (data: { enabled: boolean }) => {
          setIsGpsEnabled(data.enabled);

          // If GPS is disabled while tracking, stop tracking and save log
          if (!data.enabled && isTrackingRef.current) {
            console.warn('[GnssContext] GPS disabled - stopping tracking and saving log');
            await stopTracking();
          }
        }
      );
      listenersRef.current.push(gpsStateListener);

      // Refresh logging state
      await refreshLoggingState();

      return true;
    } catch (error) {
      console.error('[GnssContext] Error starting GNSS tracking:', error);
      return false;
    }
  }, [isTracking, checkGpsEnabled, refreshLoggingState]);

  /**
   * Stop GNSS tracking and clean up listeners
   * Automatically saves log file if logging is active
   */
  const stopTracking = useCallback(async (): Promise<void> => {
    if (!isTracking) {
      return;
    }

    try {
      listenersRef.current.forEach((listener) => {
        try {
          listener.remove();
        } catch (e) {
          console.error('[GnssContext] Error removing listener:', e);
        }
      });
      listenersRef.current = [];

      await GnssModule.stop();
      setIsTracking(false);
      isTrackingRef.current = false;

      // Clear state
      setLocation(null);
      setStatus(null);
      setMeasurements([]);
    } catch (error) {
      console.error('[GnssContext] Error stopping GNSS tracking:', error);
    }
  }, [isTracking]);

  /**
   * Start logging GNSS data to file
   * Automatically generates timestamp-based filename if not provided
   */
  const startLogging = useCallback(async (fileName?: string): Promise<string | null> => {
    try {
      // Generate timestamp-based filename if not provided
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('Z')[0];
      const logFileName = fileName || `gnss_log_${timestamp}.csv`;

      const filePath = await GnssModule.setRawLogging(true, logFileName);
      await refreshLoggingState();
      return filePath;
    } catch (error) {
      console.error('[GnssContext] Error starting logging:', error);
      return null;
    }
  }, [refreshLoggingState]);

  /**
   * Stop logging GNSS data and close the file
   */
  const stopLogging = useCallback(async (): Promise<void> => {
    try {
      await GnssModule.setRawLogging(false, null);
      await refreshLoggingState();
    } catch (error) {
      console.error('[GnssContext] Error stopping logging:', error);
    }
  }, [refreshLoggingState]);

  /**
   * Check GPS status on mount and periodically
   * This ensures GPS status stays up-to-date even when not tracking
   */
  useEffect(() => {
    // Check immediately on mount
    checkGpsEnabled();

    // Check every 5 seconds
    const interval = setInterval(() => {
      checkGpsEnabled();
    }, 5000);

    return () => clearInterval(interval);
  }, [checkGpsEnabled]);

  /**
   * Cleanup on unmount only
   */
  useEffect(() => {
    return () => {
      // Remove event listeners
      listenersRef.current.forEach((listener) => {
        try {
          listener.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
      });
      listenersRef.current = [];

      // Stop tracking if active
      GnssModule.stop().catch(console.error);
    };
  }, []); // Empty deps - only run on mount/unmount

  const value: GnssContextType = {
    // State
    isTracking,
    isLogging,
    location,
    status,
    measurements,
    isGpsEnabled,
    loggingState,

    // Control functions
    startTracking,
    stopTracking,
    startLogging,
    stopLogging,
    checkGpsEnabled,
    refreshLoggingState,
  };

  return <GnssContext.Provider value={value}>{children}</GnssContext.Provider>;
};
