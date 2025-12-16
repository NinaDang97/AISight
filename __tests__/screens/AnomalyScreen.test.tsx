/**
 * AnomalyScreen Tests
 * Tests for the Anomaly Detection screen UI component
 */

import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { AnomalyScreen } from '../../src/screens/AnomalyScreen/AnomalyScreen';
import { useAnomaly } from '../../src/components/contexts/AnomalyContext';
import { useGnss } from '../../src/components/contexts/GnssContext';
import { GnssAnomalyEvent, GnssLocation } from '../../src/native/GnssModule';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock react-native-permissions
jest.mock('react-native-permissions', () => ({
  check: jest.fn(),
  request: jest.fn(),
  PERMISSIONS: {
    ANDROID: {
      ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
    },
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
  },
}));

// Mock the contexts
jest.mock('../../src/components/contexts/AnomalyContext');
jest.mock('../../src/components/contexts/GnssContext');

// Mock Notifee
jest.mock('@notifee/react-native', () => ({
  createChannel: jest.fn(() => Promise.resolve('test-channel')),
  displayNotification: jest.fn(() => Promise.resolve()),
  cancelAllNotifications: jest.fn(() => Promise.resolve()),
  AndroidImportance: {
    HIGH: 4,
  },
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('AnomalyScreen', () => {
  const mockStartDetection = jest.fn();
  const mockStopDetection = jest.fn();
  const mockClearAnomalies = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Default GNSS context
    (useGnss as jest.Mock).mockReturnValue({
      isTracking: true,
      isGpsEnabled: true,
      location: null,
      measurements: [],
    });

    // Default Anomaly context
    (useAnomaly as jest.Mock).mockReturnValue({
      isDetecting: false,
      activeAnomaly: null,
      detectedAnomalies: [],
      currentEpoch: null,
      detectorReady: false,
      calibrationProgress: 0,
      remainingEpochs: 60,
      baselineStats: null,
      isBaselineFrozen: false,
      startDetection: mockStartDetection,
      stopDetection: mockStopDetection,
      clearAnomalies: mockClearAnomalies,
      recalibrate: jest.fn(),
    });
  });

  describe('rendering', () => {
    it('should render screen title and subtitle', () => {
      const { getByText } = render(<AnomalyScreen />);

      expect(getByText('Anomaly Detection')).toBeTruthy();
      expect(getByText('Monitor navigation anomalies')).toBeTruthy();
    });

    it('should display "Start Detection" button when not detecting', () => {
      const { getByText } = render(<AnomalyScreen />);

      expect(getByText('Start Detection')).toBeTruthy();
    });

    it('should display "Stop Detection" button when detecting', () => {
      (useAnomaly as jest.Mock).mockReturnValue({
        isDetecting: true,
        activeAnomaly: null,
        detectedAnomalies: [],
        currentEpoch: null,
        detectorReady: false,
        startDetection: mockStartDetection,
        stopDetection: mockStopDetection,
        clearAnomalies: mockClearAnomalies,
      });

      const { getByText } = render(<AnomalyScreen />);

      expect(getByText('Stop Detection')).toBeTruthy();
    });

    it('should display "Clear Data" button', () => {
      const { getByText } = render(<AnomalyScreen />);

      expect(getByText('Clear Data')).toBeTruthy();
    });

    it('should show GPS disabled warning when GPS is off', () => {
      (useGnss as jest.Mock).mockReturnValue({
        isTracking: false,
        isGpsEnabled: false,
        location: null,
        measurements: [],
      });

      const { getByText } = render(<AnomalyScreen />);

      expect(getByText(/GPS is disabled/)).toBeTruthy();
    });

    it('should show baseline collection message when detector not ready', () => {
      (useAnomaly as jest.Mock).mockReturnValue({
        isDetecting: true,
        activeAnomaly: null,
        detectedAnomalies: [],
        currentEpoch: null,
        detectorReady: false,
        calibrationProgress: 50,
        remainingEpochs: 30,
        baselineStats: null,
        isBaselineFrozen: false,
        startDetection: mockStartDetection,
        stopDetection: mockStopDetection,
        clearAnomalies: mockClearAnomalies,
        recalibrate: jest.fn(),
      });

      const { getByText } = render(<AnomalyScreen />);

      expect(getByText(/Calibrating baseline/)).toBeTruthy();
      expect(getByText(/30 epochs remaining/)).toBeTruthy();
    });
  });

  describe('statistics', () => {
    it('should display correct statistics with no anomalies', () => {
      const { getByText, getAllByText } = render(<AnomalyScreen />);

      expect(getByText('1')).toBeTruthy(); // Total vessels (device)
      expect(getAllByText('0').length).toBeGreaterThan(0); // Active now and total anomalies
    });

    it('should show active anomaly count', () => {
      (useAnomaly as jest.Mock).mockReturnValue({
        isDetecting: true,
        activeAnomaly: createMockAnomaly('Both C/N0 and AGC dropped', 'Active'),
        detectedAnomalies: [],
        currentEpoch: null,
        detectorReady: true,
        startDetection: mockStartDetection,
        stopDetection: mockStopDetection,
        clearAnomalies: mockClearAnomalies,
      });

      const { getAllByText } = render(<AnomalyScreen />);

      const activeNowElements = getAllByText('1');
      expect(activeNowElements.length).toBeGreaterThan(0);
    });

    it('should display total anomalies count', () => {
      (useAnomaly as jest.Mock).mockReturnValue({
        isDetecting: false,
        activeAnomaly: null,
        detectedAnomalies: [
          createMockAnomaly('Both C/N0 and AGC dropped', 'Completed'),
          createMockAnomaly('C/N0 dropped but AGC increased', 'Completed'),
        ],
        currentEpoch: null,
        detectorReady: false,
        startDetection: mockStartDetection,
        stopDetection: mockStopDetection,
        clearAnomalies: mockClearAnomalies,
      });

      const { getByText } = render(<AnomalyScreen />);

      expect(getByText('2')).toBeTruthy();
    });
  });

  describe('filtering', () => {
    it('should display filter buttons', () => {
      const { getByText } = render(<AnomalyScreen />);

      expect(getByText('All')).toBeTruthy();
      expect(getByText(/High/)).toBeTruthy();
      expect(getByText(/Medium/)).toBeTruthy();
      expect(getByText(/Low/)).toBeTruthy();
    });

    it('should filter anomalies by severity when High is selected', () => {
      const highAnomaly = createMockAnomaly('Both C/N0 and AGC dropped', 'Completed');
      highAnomaly.severity = 'High';

      const mediumAnomaly = createMockAnomaly('C/N0 dropped but AGC increased', 'Completed');
      mediumAnomaly.severity = 'Medium';

      (useAnomaly as jest.Mock).mockReturnValue({
        isDetecting: false,
        activeAnomaly: null,
        detectedAnomalies: [highAnomaly, mediumAnomaly],
        currentEpoch: null,
        detectorReady: false,
        startDetection: mockStartDetection,
        stopDetection: mockStopDetection,
        clearAnomalies: mockClearAnomalies,
      });

      const { getByText, queryByText } = render(<AnomalyScreen />);

      // Click High filter
      const highButton = getByText(/High \(1\)/);
      fireEvent.press(highButton);

      // Should show high severity anomaly
      expect(getByText('Possible Anomaly Detected')).toBeTruthy();

      // Should show filtered count
      expect(getByText(/Detected Anomalies \(1\)/)).toBeTruthy();
    });

    it('should show all anomalies when All filter is selected', () => {
      const anomalies = [
        createMockAnomaly('Both C/N0 and AGC dropped', 'Completed'),
        createMockAnomaly('C/N0 dropped but AGC increased', 'Completed'),
      ];

      (useAnomaly as jest.Mock).mockReturnValue({
        isDetecting: false,
        activeAnomaly: null,
        detectedAnomalies: anomalies,
        currentEpoch: null,
        detectorReady: false,
        startDetection: mockStartDetection,
        stopDetection: mockStopDetection,
        clearAnomalies: mockClearAnomalies,
      });

      const { getAllByText, getByText } = render(<AnomalyScreen />);

      expect(getAllByText('Possible Anomaly Detected')).toHaveLength(2);
      expect(getByText(/Reason: Both C\/N0 and AGC dropped/)).toBeTruthy();
      expect(getByText(/Detected Anomalies \(2\)/)).toBeTruthy();
    });
  });

  describe('anomaly display', () => {
    it('should display anomaly details', () => {
      const anomaly = createMockAnomaly('Both C/N0 and AGC dropped', 'Completed');

      (useAnomaly as jest.Mock).mockReturnValue({
        isDetecting: false,
        activeAnomaly: null,
        detectedAnomalies: [anomaly],
        currentEpoch: null,
        detectorReady: false,
        startDetection: mockStartDetection,
        stopDetection: mockStopDetection,
        clearAnomalies: mockClearAnomalies,
      });

      const { getByText } = render(<AnomalyScreen />);

      expect(getByText('Possible Anomaly Detected')).toBeTruthy();
      expect(getByText('High')).toBeTruthy();
      expect(getByText('Completed')).toBeTruthy();
      expect(getByText('Possible anomaly detected: Both C/N0 and AGC dropped')).toBeTruthy();
    });

    it('should display start and end locations', () => {
      const anomaly = createMockAnomalyWithLocations();

      (useAnomaly as jest.Mock).mockReturnValue({
        isDetecting: false,
        activeAnomaly: null,
        detectedAnomalies: [anomaly],
        currentEpoch: null,
        detectorReady: false,
        startDetection: mockStartDetection,
        stopDetection: mockStopDetection,
        clearAnomalies: mockClearAnomalies,
      });

      const { getByText } = render(<AnomalyScreen />);

      expect(getByText(/Start: 60.097260, 19.934810/)).toBeTruthy();
      expect(getByText(/End: 60.097500, 19.935000/)).toBeTruthy();
    });

    it('should display path metrics', () => {
      const anomaly = createMockAnomalyWithLocations();

      (useAnomaly as jest.Mock).mockReturnValue({
        isDetecting: false,
        activeAnomaly: null,
        detectedAnomalies: [anomaly],
        currentEpoch: null,
        detectorReady: false,
        startDetection: mockStartDetection,
        stopDetection: mockStopDetection,
        clearAnomalies: mockClearAnomalies,
      });

      const { getByText } = render(<AnomalyScreen />);

      expect(getByText(/Path: 3 points/)).toBeTruthy();
    });

    it('should show "no anomalies" message when none detected', () => {
      const { getByText } = render(<AnomalyScreen />);

      expect(getByText(/No anomalies detected/)).toBeTruthy();
    });

    it('should include active anomaly in the list', () => {
      const activeAnomaly = createMockAnomaly('Both C/N0 and AGC dropped', 'Active');
      const completedAnomaly = createMockAnomaly('C/N0 dropped but AGC increased', 'Completed');

      (useAnomaly as jest.Mock).mockReturnValue({
        isDetecting: true,
        activeAnomaly: activeAnomaly,
        detectedAnomalies: [completedAnomaly],
        currentEpoch: null,
        detectorReady: true,
        startDetection: mockStartDetection,
        stopDetection: mockStopDetection,
        clearAnomalies: mockClearAnomalies,
      });

      const { getAllByText, getByText } = render(<AnomalyScreen />);

      expect(getAllByText('Possible Anomaly Detected')).toHaveLength(2);
      expect(getByText(/Reason: Both C\/N0 and AGC dropped/)).toBeTruthy();
      expect(getByText('Active')).toBeTruthy();
    });
  });

  describe('detection controls', () => {
    it('should call startDetection when Start button pressed', () => {
      (useAnomaly as jest.Mock).mockReturnValue({
        isDetecting: false,
        activeAnomaly: null,
        detectedAnomalies: [],
        currentEpoch: {
          timestamp: Date.now(),
          avgCn0DbHz: 40.0,
          satelliteCount: 8,
          location: null,
        },
        detectorReady: false,
        calibrationProgress: 0,
        remainingEpochs: 60,
        baselineStats: null,
        isBaselineFrozen: false,
        startDetection: mockStartDetection,
        stopDetection: mockStopDetection,
        clearAnomalies: mockClearAnomalies,
        recalibrate: jest.fn(),
      });

      const { getByText } = render(<AnomalyScreen />);

      const startButton = getByText('Start Detection');
      fireEvent.press(startButton);

      expect(mockStartDetection).toHaveBeenCalled();
    });

    it('should call stopDetection when Stop button pressed', () => {
      (useAnomaly as jest.Mock).mockReturnValue({
        isDetecting: true,
        activeAnomaly: null,
        detectedAnomalies: [],
        currentEpoch: null,
        detectorReady: false,
        startDetection: mockStartDetection,
        stopDetection: mockStopDetection,
        clearAnomalies: mockClearAnomalies,
      });

      const { getByText } = render(<AnomalyScreen />);

      const stopButton = getByText('Stop Detection');
      fireEvent.press(stopButton);

      expect(mockStopDetection).toHaveBeenCalled();
    });

    it('should show alert when starting without GNSS tracking', () => {
      (useGnss as jest.Mock).mockReturnValue({
        isTracking: false,
        isGpsEnabled: true,
        location: null,
        measurements: [],
      });

      const { getByText } = render(<AnomalyScreen />);

      const startButton = getByText('Start Detection');
      fireEvent.press(startButton);

      expect(Alert.alert).toHaveBeenCalledWith('Start GNSS Tracking First', expect.any(String));
      expect(mockStartDetection).not.toHaveBeenCalled();
    });

    it('should disable Start button when GPS is disabled', () => {
      (useGnss as jest.Mock).mockReturnValue({
        isTracking: false,
        isGpsEnabled: false,
        location: null,
        measurements: [],
      });

      const { getByText } = render(<AnomalyScreen />);

      const startButton = getByText('Start Detection');

      // Button should be rendered but disabled
      expect(startButton).toBeTruthy();

      // Pressing disabled button shouldn't call startDetection
      fireEvent.press(startButton);
      expect(mockStartDetection).not.toHaveBeenCalled();
    });
  });

  describe('clear data functionality', () => {
    it('should show confirmation alert when Clear Data pressed', () => {
      const anomaly = createMockAnomaly('Both C/N0 and AGC dropped', 'Completed');

      (useAnomaly as jest.Mock).mockReturnValue({
        isDetecting: false,
        activeAnomaly: null,
        detectedAnomalies: [anomaly],
        currentEpoch: null,
        detectorReady: false,
        startDetection: mockStartDetection,
        stopDetection: mockStopDetection,
        clearAnomalies: mockClearAnomalies,
      });

      const { getByText } = render(<AnomalyScreen />);

      const clearButton = getByText('Clear Data');
      fireEvent.press(clearButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Clear Anomalies',
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel' }),
          expect.objectContaining({ text: 'Clear' }),
        ]),
      );
    });

    it('should disable Clear Data button when no anomalies exist', () => {
      const { getByText } = render(<AnomalyScreen />);

      const clearButton = getByText('Clear Data');

      // Button should be rendered but disabled (pressing shouldn't show alert)
      expect(clearButton).toBeTruthy();

      // Pressing disabled button shouldn't trigger confirmation
      fireEvent.press(clearButton);
      expect(Alert.alert).not.toHaveBeenCalled();
    });
  });

  describe('current measurements display', () => {
    it('should show current epoch info when detecting', () => {
      (useAnomaly as jest.Mock).mockReturnValue({
        isDetecting: true,
        activeAnomaly: null,
        detectedAnomalies: [],
        currentEpoch: {
          timestamp: Date.now(),
          avgCn0DbHz: 42.5,
          avgAgcLevelDb: -8.2,
          satelliteCount: 12,
          location: null,
        },
        detectorReady: true,
        startDetection: mockStartDetection,
        stopDetection: mockStopDetection,
        clearAnomalies: mockClearAnomalies,
      });

      const { getByText } = render(<AnomalyScreen />);

      expect(getByText('Current Measurements')).toBeTruthy();
      expect(getByText('Satellites: 12')).toBeTruthy();
      expect(getByText(/Avg C\/N0: 42.5 dB-Hz/)).toBeTruthy();
      expect(getByText(/Avg AGC: -8.2 dB/)).toBeTruthy();
      expect(getByText(/Detector Status: Ready/)).toBeTruthy();
    });

    it('should not show current epoch when not detecting', () => {
      const { queryByText } = render(<AnomalyScreen />);

      expect(queryByText('Current Measurements')).toBeNull();
    });

    it('should show "Collecting baseline..." when detector not ready', () => {
      (useAnomaly as jest.Mock).mockReturnValue({
        isDetecting: true,
        activeAnomaly: null,
        detectedAnomalies: [],
        currentEpoch: {
          timestamp: Date.now(),
          avgCn0DbHz: 40.0,
          satelliteCount: 10,
          location: null,
        },
        detectorReady: false,
        startDetection: mockStartDetection,
        stopDetection: mockStopDetection,
        clearAnomalies: mockClearAnomalies,
      });

      const { getByText } = render(<AnomalyScreen />);

      expect(getByText(/Detector Status: Collecting baseline.../)).toBeTruthy();
    });
  });

  describe('subtitle text', () => {
    it('should show "Monitoring" when detecting', () => {
      (useAnomaly as jest.Mock).mockReturnValue({
        isDetecting: true,
        activeAnomaly: null,
        detectedAnomalies: [],
        currentEpoch: null,
        detectorReady: false,
        startDetection: mockStartDetection,
        stopDetection: mockStopDetection,
        clearAnomalies: mockClearAnomalies,
      });

      const { getByText } = render(<AnomalyScreen />);

      expect(getByText('Monitoring GNSS signals for anomalies')).toBeTruthy();
    });

    it('should show default subtitle when not detecting', () => {
      const { getByText } = render(<AnomalyScreen />);

      expect(getByText('Monitor navigation anomalies')).toBeTruthy();
    });
  });
});

// Helper functions

function createMockAnomaly(
  reason:
    | 'Both C/N0 and AGC dropped'
    | 'C/N0 dropped but AGC increased'
    | 'C/N0 dropped but AGC stable/unavailable',
  status: string,
): GnssAnomalyEvent {
  const now = Date.now();
  return {
    id: `anomaly_${now}_${reason}`,
    type: 'ANOMALY',
    reason,
    severity: 'High',
    status,
    startTime: now - 30000,
    endTime: status === 'Completed' ? now : undefined,
    startLocation: {
      provider: 'gps',
      latitude: 60.09726,
      longitude: 19.93481,
      time: now - 30000,
    },
    endLocation:
      status === 'Completed'
        ? {
            provider: 'gps',
            latitude: 60.0975,
            longitude: 19.935,
            time: now,
          }
        : null,
    path: [
      {
        provider: 'gps',
        latitude: 60.09726,
        longitude: 19.93481,
        time: now - 30000,
      },
    ],
    metrics: {
      cn0Drop: 15.5,
      agcDrop: -10.2,
      baselineCn0: 42.0,
      avgCn0: 35.5,
      baselineAgc: -8.0,
      avgAgc: -10.2,
    },
    description: `Possible anomaly detected: ${reason}`,
  };
}

function createMockAnomalyWithLocations(): GnssAnomalyEvent {
  const startTime = Date.now() - 30000;
  const endTime = Date.now();

  const path: GnssLocation[] = [
    { provider: 'gps', latitude: 60.09726, longitude: 19.93481, time: startTime },
    { provider: 'gps', latitude: 60.09738, longitude: 19.9349, time: startTime + 10000 },
    { provider: 'gps', latitude: 60.0975, longitude: 19.935, time: endTime },
  ];

  return {
    id: 'anomaly_with_path',
    type: 'ANOMALY',
    reason: 'Both C/N0 and AGC dropped',
    severity: 'High',
    status: 'Completed',
    startTime,
    endTime,
    startLocation: path[0],
    endLocation: path[2],
    path,
    metrics: {
      cn0Drop: 16.8,
      agcDrop: -12.5,
      baselineCn0: 42.0,
      avgCn0: 35.0,
      baselineAgc: -8.0,
      avgAgc: -12.5,
    },
    description: 'JAMMING detected with High severity',
  };
}
