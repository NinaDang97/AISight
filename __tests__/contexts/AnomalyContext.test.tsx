/**
 * AnomalyContext Tests
 * Tests for the GNSS anomaly detection context provider
 */

import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AnomalyProvider, useAnomaly } from '../../src/components/contexts/AnomalyContext';
import { GnssProvider, useGnss } from '../../src/components/contexts/GnssContext';
import { GnssLocation, GnssMeasurement } from '../../src/native/GnssModule';
import { AnomalyDetector } from '../../src/services/anomaly/AnomalyDetector';
import { AnomalyStorage } from '../../src/services/anomaly/AnomalyStorage';

// Mock useGnss
jest.mock('../../src/components/contexts/GnssContext', () => ({
  ...jest.requireActual('../../src/components/contexts/GnssContext'),
  useGnss: jest.fn(),
}));

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

// Mock the GnssModule
jest.mock('../../src/native/GnssModule', () => ({
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  removeListeners: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  isLogging: jest.fn(() => Promise.resolve(false)),
  startLogging: jest.fn(),
  stopLogging: jest.fn(),
  exportLogs: jest.fn(),
  exportGeoJSON: jest.fn(),
  clearLogs: jest.fn(),
  isGpsEnabled: jest.fn(() => Promise.resolve(true)),
}));

// Mock AnomalyStorage
jest.mock('../../src/services/anomaly/AnomalyStorage', () => ({
  AnomalyStorage: {
    loadAnomalies: jest.fn(() => Promise.resolve([])),
    saveAnomalies: jest.fn(() => Promise.resolve()),
    clearAll: jest.fn(() => Promise.resolve()),
    addAnomaly: jest.fn(() => Promise.resolve()),
  },
}));

// Mock AnomalyDetector
jest.mock('../../src/services/anomaly/AnomalyDetector');

// Mock Notifee
jest.mock('@notifee/react-native', () => ({
  createChannel: jest.fn(() => Promise.resolve('test-channel')),
  displayNotification: jest.fn(() => Promise.resolve()),
  cancelAllNotifications: jest.fn(() => Promise.resolve()),
  AndroidImportance: {
    HIGH: 4,
  },
}));

describe('AnomalyContext', () => {
  let mockDetectorInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock detector instance
    mockDetectorInstance = {
      addEpoch: jest.fn(() => null),
      isReady: jest.fn(() => false),
      reset: jest.fn(),
      recalibrate: jest.fn(),
      getBufferSize: jest.fn(() => 0),
      getCalibrationProgress: jest.fn(() => 0),
      getRemainingEpochs: jest.fn(() => 60),
      getBaselineStats: jest.fn(() => null),
      isBaselineFrozen: jest.fn(() => false),
    };

    // Mock the AnomalyDetector constructor
    (AnomalyDetector as jest.Mock).mockImplementation(() => mockDetectorInstance);

    // Mock useGnss return value
    (useGnss as jest.Mock).mockReturnValue({
      isTracking: true,
      isGpsEnabled: true,
      location: null,
      measurements: [],
    });
  });

  describe('useAnomaly hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        renderHook(() => useAnomaly());
      }).toThrow('useAnomaly must be used within an AnomalyProvider');

      consoleSpy.mockRestore();
    });

    it('should return context value when used inside provider', () => {
      const wrapper = ({ children }: any) => <AnomalyProvider>{children}</AnomalyProvider>;

      const { result } = renderHook(() => useAnomaly(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.isDetecting).toBe(false);
      expect(result.current.activeAnomaly).toBeNull();
      expect(result.current.detectedAnomalies).toEqual([]);
    });
  });

  describe('initialization', () => {
    it('should start with detection disabled', () => {
      const wrapper = ({ children }: any) => <AnomalyProvider>{children}</AnomalyProvider>;

      const { result } = renderHook(() => useAnomaly(), { wrapper });

      expect(result.current.isDetecting).toBe(false);
      expect(result.current.detectorReady).toBe(false);
    });

    it('should start with no active anomaly', () => {
      const wrapper = ({ children }: any) => <AnomalyProvider>{children}</AnomalyProvider>;

      const { result } = renderHook(() => useAnomaly(), { wrapper });

      expect(result.current.activeAnomaly).toBeNull();
    });

    it('should load persisted anomalies on mount', async () => {
      const mockAnomalies = [createMockAnomalyEvent('Both C/N0 and AGC dropped')];
      (AnomalyStorage.loadAnomalies as jest.Mock).mockResolvedValue(mockAnomalies);

      const wrapper = ({ children }: any) => <AnomalyProvider>{children}</AnomalyProvider>;

      const { result } = renderHook(() => useAnomaly(), { wrapper });

      await waitFor(() => {
        expect(result.current.detectedAnomalies).toHaveLength(1);
      });

      expect(result.current.detectedAnomalies[0].type).toBe('ANOMALY');
      expect(result.current.detectedAnomalies[0].reason).toBe('Both C/N0 and AGC dropped');
    });

    it('should handle loading errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (AnomalyStorage.loadAnomalies as jest.Mock).mockRejectedValue(new Error('Load failed'));

      const wrapper = ({ children }: any) => <AnomalyProvider>{children}</AnomalyProvider>;

      const { result } = renderHook(() => useAnomaly(), { wrapper });

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      expect(result.current.detectedAnomalies).toEqual([]);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('startDetection', () => {
    it('should enable detection when GNSS is tracking', () => {
      const wrapper = ({ children }: any) => <AnomalyProvider>{children}</AnomalyProvider>;

      const { result } = renderHook(() => useAnomaly(), { wrapper });

      act(() => {
        result.current.startDetection();
      });

      expect(result.current.isDetecting).toBe(true);
    });

    it('should reset detector when starting', () => {
      const wrapper = ({ children }: any) => <AnomalyProvider>{children}</AnomalyProvider>;

      const { result } = renderHook(() => useAnomaly(), { wrapper });

      act(() => {
        result.current.startDetection();
      });

      expect(mockDetectorInstance.reset).toHaveBeenCalled();
    });

    it('should set detectorReady to false on start', () => {
      const wrapper = ({ children }: any) => <AnomalyProvider>{children}</AnomalyProvider>;

      const { result } = renderHook(() => useAnomaly(), { wrapper });

      act(() => {
        result.current.startDetection();
      });

      expect(result.current.detectorReady).toBe(false);
    });
  });

  describe('stopDetection', () => {
    it('should disable detection', () => {
      const wrapper = ({ children }: any) => <AnomalyProvider>{children}</AnomalyProvider>;

      const { result } = renderHook(() => useAnomaly(), { wrapper });

      act(() => {
        result.current.startDetection();
      });

      act(() => {
        result.current.stopDetection();
      });

      expect(result.current.isDetecting).toBe(false);
    });

    it('should complete active anomaly when stopped', () => {
      const wrapper = ({ children }: any) => <AnomalyProvider>{children}</AnomalyProvider>;

      const { result } = renderHook(() => useAnomaly(), { wrapper });

      // Manually set an active anomaly for testing
      act(() => {
        result.current.startDetection();
      });

      // Simulate active anomaly by having detector return anomaly result
      mockDetectorInstance.addEpoch.mockReturnValue({
        isAnomaly: true,
        type: 'ANOMALY',
        reason: 'Both C/N0 and AGC dropped',
        severity: 'High',
        metrics: {
          cn0Drop: 15.0,
          baselineCn0: 42.0,
          avgCn0: 35.0,
        },
        description: 'Possible anomaly detected: Both C/N0 and AGC dropped',
      });

      act(() => {
        result.current.stopDetection();
      });

      expect(result.current.activeAnomaly).toBeNull();
    });
  });

  describe('clearAnomalies', () => {
    it('should clear all detected anomalies', async () => {
      const mockAnomalies = [
        createMockAnomalyEvent('Both C/N0 and AGC dropped'),
        createMockAnomalyEvent('C/N0 dropped but AGC increased'),
      ];
      (AnomalyStorage.loadAnomalies as jest.Mock).mockResolvedValue(mockAnomalies);

      const wrapper = ({ children }: any) => <AnomalyProvider>{children}</AnomalyProvider>;

      const { result } = renderHook(() => useAnomaly(), { wrapper });

      await waitFor(() => {
        expect(result.current.detectedAnomalies).toHaveLength(2);
      });

      await act(async () => {
        await result.current.clearAnomalies();
      });

      expect(result.current.detectedAnomalies).toEqual([]);
      expect(AnomalyStorage.clearAll).toHaveBeenCalled();
    });

    it('should clear active anomaly', async () => {
      const wrapper = ({ children }: any) => <AnomalyProvider>{children}</AnomalyProvider>;

      const { result } = renderHook(() => useAnomaly(), { wrapper });

      await act(async () => {
        await result.current.clearAnomalies();
      });

      expect(result.current.activeAnomaly).toBeNull();
    });
  });

  describe('detector ready state', () => {
    it('should update detectorReady when detector becomes ready', () => {
      mockDetectorInstance.isReady.mockReturnValue(true);

      const wrapper = ({ children }: any) => <AnomalyProvider>{children}</AnomalyProvider>;

      const { result } = renderHook(() => useAnomaly(), { wrapper });

      act(() => {
        result.current.startDetection();
      });

      expect(result.current.detectorReady).toBe(false);
    });
  });

  describe('anomaly persistence', () => {
    it('should save anomalies when they are added', async () => {
      const wrapper = ({ children }: any) => <AnomalyProvider>{children}</AnomalyProvider>;

      renderHook(() => useAnomaly(), { wrapper });

      await waitFor(() => {
        expect(AnomalyStorage.loadAnomalies).toHaveBeenCalled();
      });
    });

    it('should handle save errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (AnomalyStorage.saveAnomalies as jest.Mock).mockRejectedValue(new Error('Save failed'));

      const mockAnomalies = [createMockAnomalyEvent('Both C/N0 and AGC dropped')];
      (AnomalyStorage.loadAnomalies as jest.Mock).mockResolvedValue(mockAnomalies);

      const wrapper = ({ children }: any) => <AnomalyProvider>{children}</AnomalyProvider>;

      renderHook(() => useAnomaly(), { wrapper });

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('[AnomalyContext] Error saving anomalies:'),
          expect.any(Error),
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('context value', () => {
    it('should provide all required properties', () => {
      const wrapper = ({ children }: any) => <AnomalyProvider>{children}</AnomalyProvider>;

      const { result } = renderHook(() => useAnomaly(), { wrapper });

      expect(result.current).toHaveProperty('isDetecting');
      expect(result.current).toHaveProperty('activeAnomaly');
      expect(result.current).toHaveProperty('detectedAnomalies');
      expect(result.current).toHaveProperty('currentEpoch');
      expect(result.current).toHaveProperty('detectorReady');
      expect(result.current).toHaveProperty('calibrationProgress');
      expect(result.current).toHaveProperty('remainingEpochs');
      expect(result.current).toHaveProperty('baselineStats');
      expect(result.current).toHaveProperty('isBaselineFrozen');
      expect(result.current).toHaveProperty('startDetection');
      expect(result.current).toHaveProperty('stopDetection');
      expect(result.current).toHaveProperty('clearAnomalies');
      expect(result.current).toHaveProperty('recalibrate');
    });

    it('should provide functions that can be called', () => {
      const wrapper = ({ children }: any) => <AnomalyProvider>{children}</AnomalyProvider>;

      const { result } = renderHook(() => useAnomaly(), { wrapper });

      expect(typeof result.current.startDetection).toBe('function');
      expect(typeof result.current.stopDetection).toBe('function');
      expect(typeof result.current.clearAnomalies).toBe('function');
      expect(typeof result.current.recalibrate).toBe('function');
    });

    it('should initialize calibration progress to 0', () => {
      const wrapper = ({ children }: any) => <AnomalyProvider>{children}</AnomalyProvider>;

      const { result } = renderHook(() => useAnomaly(), { wrapper });

      expect(result.current.calibrationProgress).toBe(0);
      expect(result.current.remainingEpochs).toBe(60);
      expect(result.current.baselineStats).toBeNull();
      expect(result.current.isBaselineFrozen).toBe(false);
    });
  });

  describe('calibration progress tracking', () => {
    it('should update calibration progress as epochs are added', () => {
      mockDetectorInstance.getCalibrationProgress.mockReturnValue(50);
      mockDetectorInstance.getRemainingEpochs.mockReturnValue(30);

      const wrapper = ({ children }: any) => <AnomalyProvider>{children}</AnomalyProvider>;

      const { result } = renderHook(() => useAnomaly(), { wrapper });

      act(() => {
        result.current.startDetection();
      });

      expect(result.current.calibrationProgress).toBe(0);
      expect(result.current.remainingEpochs).toBe(60);
    });

    it('should reset calibration progress when starting detection', () => {
      const wrapper = ({ children }: any) => <AnomalyProvider>{children}</AnomalyProvider>;

      const { result } = renderHook(() => useAnomaly(), { wrapper });

      act(() => {
        result.current.startDetection();
      });

      expect(result.current.calibrationProgress).toBe(0);
      expect(result.current.remainingEpochs).toBe(60);
      expect(result.current.baselineStats).toBeNull();
      expect(result.current.isBaselineFrozen).toBe(false);
    });
  });

  describe('recalibration', () => {
    it('should call detector recalibrate when recalibrating', () => {
      const wrapper = ({ children }: any) => <AnomalyProvider>{children}</AnomalyProvider>;

      const { result } = renderHook(() => useAnomaly(), { wrapper });

      act(() => {
        result.current.startDetection();
      });

      act(() => {
        result.current.recalibrate();
      });

      expect(mockDetectorInstance.recalibrate).toHaveBeenCalled();
    });

    it('should not recalibrate if detection is not active', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const wrapper = ({ children }: any) => <AnomalyProvider>{children}</AnomalyProvider>;

      const { result } = renderHook(() => useAnomaly(), { wrapper });

      act(() => {
        result.current.recalibrate();
      });

      expect(mockDetectorInstance.recalibrate).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[AnomalyContext] Cannot recalibrate: Detection not active',
      );

      consoleWarnSpy.mockRestore();
    });

    it('should reset calibration progress on recalibrate', () => {
      const wrapper = ({ children }: any) => <AnomalyProvider>{children}</AnomalyProvider>;

      const { result } = renderHook(() => useAnomaly(), { wrapper });

      act(() => {
        result.current.startDetection();
      });

      act(() => {
        result.current.recalibrate();
      });

      expect(result.current.calibrationProgress).toBe(0);
      expect(result.current.remainingEpochs).toBe(60);
      expect(result.current.baselineStats).toBeNull();
      expect(result.current.isBaselineFrozen).toBe(false);
    });

    it('should mark detector as not ready after recalibrate', () => {
      mockDetectorInstance.isReady.mockReturnValue(true);

      const wrapper = ({ children }: any) => <AnomalyProvider>{children}</AnomalyProvider>;

      const { result } = renderHook(() => useAnomaly(), { wrapper });

      act(() => {
        result.current.startDetection();
      });

      mockDetectorInstance.isReady.mockReturnValue(false);

      act(() => {
        result.current.recalibrate();
      });

      expect(result.current.detectorReady).toBe(false);
    });

    it('should complete active anomaly when recalibrating', () => {
      const wrapper = ({ children }: any) => <AnomalyProvider>{children}</AnomalyProvider>;

      const { result } = renderHook(() => useAnomaly(), { wrapper });

      act(() => {
        result.current.startDetection();
      });

      // Simulate active anomaly
      mockDetectorInstance.addEpoch.mockReturnValue({
        isAnomaly: true,
        type: 'ANOMALY',
        reason: 'Both C/N0 and AGC dropped',
        severity: 'High',
        metrics: {
          cn0Drop: 15.0,
          baselineCn0: 42.0,
          avgCn0: 35.0,
        },
        description: 'Possible anomaly detected: Both C/N0 and AGC dropped',
      });

      act(() => {
        result.current.recalibrate();
      });

      // Active anomaly should be completed and moved to history
      expect(result.current.activeAnomaly).toBeNull();
    });

    it('should add completed anomaly to detected anomalies list', () => {
      const wrapper = ({ children }: any) => <AnomalyProvider>{children}</AnomalyProvider>;

      const { result } = renderHook(() => useAnomaly(), { wrapper });

      act(() => {
        result.current.startDetection();
      });

      // Simulate active anomaly
      mockDetectorInstance.addEpoch.mockReturnValue({
        isAnomaly: true,
        type: 'ANOMALY',
        reason: 'Both C/N0 and AGC dropped',
        severity: 'High',
        metrics: {
          cn0Drop: 15.0,
          baselineCn0: 42.0,
          avgCn0: 35.0,
        },
        description: 'Possible anomaly detected: Both C/N0 and AGC dropped',
      });

      const initialAnomalyCount = result.current.detectedAnomalies.length;

      act(() => {
        result.current.recalibrate();
      });

      // Should have one more anomaly in the list
      expect(result.current.detectedAnomalies.length).toBe(initialAnomalyCount);
    });
  });

  describe('edge cases', () => {
    it('should handle missing location gracefully', () => {
      const wrapper = ({ children }: any) => <AnomalyProvider>{children}</AnomalyProvider>;

      const { result } = renderHook(() => useAnomaly(), { wrapper });

      act(() => {
        result.current.startDetection();
      });

      // Should not crash when location is null
      expect(result.current.activeAnomaly).toBeNull();
    });

    it('should handle empty measurements array', () => {
      const wrapper = ({ children }: any) => <AnomalyProvider>{children}</AnomalyProvider>;

      const { result } = renderHook(() => useAnomaly(), { wrapper });

      act(() => {
        result.current.startDetection();
      });

      // Should not crash with empty measurements
      expect(result.current.currentEpoch).toBeNull();
    });

    it('should handle detector returning null result', () => {
      mockDetectorInstance.addEpoch.mockReturnValue(null);

      const wrapper = ({ children }: any) => <AnomalyProvider>{children}</AnomalyProvider>;

      const { result } = renderHook(() => useAnomaly(), { wrapper });

      act(() => {
        result.current.startDetection();
      });

      expect(result.current.activeAnomaly).toBeNull();
    });
  });
});

// Helper functions

function createMockAnomalyEvent(
  reason:
    | 'Both C/N0 and AGC dropped'
    | 'C/N0 dropped but AGC increased'
    | 'C/N0 dropped but AGC stable/unavailable',
) {
  const now = Date.now();
  const location: GnssLocation = {
    provider: 'gps',
    latitude: 60.09726,
    longitude: 19.93481,
    time: now,
  };

  return {
    id: `anomaly_${now}_test`,
    type: 'ANOMALY',
    reason,
    severity: 'High',
    status: 'completed',
    startTime: now - 30000,
    endTime: now,
    startLocation: location,
    endLocation: location,
    path: [location],
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
