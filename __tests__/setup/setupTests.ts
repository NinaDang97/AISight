/**
 * Global test setup
 * This file runs before all tests
 */

// Note: Animated mock is handled by React Native's jest preset
// @testing-library/react-native is configured in jest.config.js

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-permissions
jest.mock('react-native-permissions', () => {
  const RESULTS = {
    UNAVAILABLE: 'unavailable',
    BLOCKED: 'blocked',
    DENIED: 'denied',
    GRANTED: 'granted',
    LIMITED: 'limited',
  };

  const PERMISSIONS = {
    IOS: {
      LOCATION_WHEN_IN_USE: 'ios.permission.LOCATION_WHEN_IN_USE',
    },
    ANDROID: {
      ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
      POST_NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS',
    },
  };

  return {
    RESULTS,
    PERMISSIONS,
    check: jest.fn(() => Promise.resolve(RESULTS.GRANTED)),
    request: jest.fn(() => Promise.resolve(RESULTS.GRANTED)),
    openSettings: jest.fn(() => Promise.resolve()),
    checkNotifications: jest.fn(() =>
      Promise.resolve({ status: RESULTS.GRANTED, settings: {} })
    ),
    requestNotifications: jest.fn(() =>
      Promise.resolve({ status: RESULTS.GRANTED, settings: {} })
    ),
  };
});

// Mock react-native-geolocation
jest.mock('@react-native-community/geolocation', () => ({
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
}));

// Mock MapLibre
jest.mock('@maplibre/maplibre-react-native', () => {
  const React = require('react');
  return {
    MapView: jest.fn(({ children }) => React.createElement('MapView', null, children)),
    Camera: jest.fn(() => React.createElement('Camera')),
    ShapeSource: jest.fn(() => React.createElement('ShapeSource')),
    UserLocation: jest.fn(() => React.createElement('UserLocation')),
  };
});

// Mock MQTT
jest.mock('mqtt', () => ({
  connect: jest.fn(() => ({
    on: jest.fn(),
    subscribe: jest.fn(),
    end: jest.fn(),
    removeAllListeners: jest.fn(),
  })),
}));

// Mock Native Modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');

  RN.NativeModules.GnssModule = {
    start: jest.fn(() => Promise.resolve()),
    stop: jest.fn(() => Promise.resolve()),
    setRawLogging: jest.fn(() => Promise.resolve('/path/to/log.csv')),
    getRawLogPath: jest.fn(() => Promise.resolve('/path/to/log.csv')),
    getLoggingState: jest.fn(() =>
      Promise.resolve({
        isLogging: false,
        logFilePath: null,
        linesWritten: 0,
      })
    ),
    isGpsEnabled: jest.fn(() => Promise.resolve(true)),
    listLogFiles: jest.fn(() => Promise.resolve([])),
    deleteLogFile: jest.fn(() => Promise.resolve(true)),
    getLatestLocation: jest.fn(() => Promise.resolve(null)),
    getLatestStatus: jest.fn(() => Promise.resolve(null)),
    getLatestMeasurements: jest.fn(() => Promise.resolve(null)),
  };

  RN.NativeModules.GnssExportModule = {
    exportCSV: jest.fn(() => Promise.resolve('/path/to/exported.csv')),
  };

  return RN;
});

// Suppress console warnings in tests (optional)
global.console = {
  ...console,
  // Uncomment to suppress console.log in tests
  // log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set up global test timeout
jest.setTimeout(10000);
