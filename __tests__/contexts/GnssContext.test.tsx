/**
 * GnssContext Tests
 * Tests for the GNSS context provider and hook
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { act } from 'react-test-renderer';
import { DeviceEventEmitter } from 'react-native';
import { GnssProvider, useGnss } from '../../src/components/contexts/GnssContext';
import GnssModule from '../../src/native/GnssModule';
import PermissionService from '../../src/services/permissions/PermissionService';

// Mock dependencies
jest.mock('react-native', () => ({
  DeviceEventEmitter: {
    addListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

jest.mock('../../src/native/GnssModule', () => ({
  __esModule: true,
  default: {
    start: jest.fn(),
    stop: jest.fn(),
    setRawLogging: jest.fn(),
    getLoggingState: jest.fn(),
    isGpsEnabled: jest.fn(),
  },
}));

jest.mock('../../src/services/permissions/PermissionService', () => ({
  __esModule: true,
  default: {
    hasLocationPermission: jest.fn(),
    requestLocationPermission: jest.fn(),
  },
}));

describe('GnssContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <GnssProvider>{children}</GnssProvider>
  );

  beforeEach(async () => {
    jest.clearAllMocks();
    (GnssModule.isGpsEnabled as jest.Mock).mockResolvedValue(true);
    (GnssModule.getLoggingState as jest.Mock).mockResolvedValue({
      isLogging: false,
      linesWritten: 0,
    });
    (PermissionService.hasLocationPermission as jest.Mock).mockResolvedValue(true);
  });

  describe('useGnss hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        renderHook(() => useGnss());
      }).toThrow('useGnss must be used within a GnssProvider');

      console.error = originalError;
    });

    it('should provide initial state', async () => {
      const { result } = renderHook(() => useGnss(), { wrapper });

      // Wait for initial async effects
      await waitFor(() => {
        expect(result.current.isGpsEnabled).toBe(true);
      });

      expect(result.current.isTracking).toBe(false);
      expect(result.current.isLogging).toBe(false);
      expect(result.current.location).toBeNull();
      expect(result.current.status).toBeNull();
      expect(result.current.measurements).toEqual([]);
    });
  });

  describe('startTracking', () => {
    it('should start tracking when GPS enabled and permissions granted', async () => {
      (GnssModule.start as jest.Mock).mockResolvedValue(undefined);
      (GnssModule.isGpsEnabled as jest.Mock).mockResolvedValue(true);
      (PermissionService.hasLocationPermission as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useGnss(), { wrapper });

      let success: boolean = false;
      await act(async () => {
        success = await result.current.startTracking();
      });

      expect(success).toBe(true);
      expect(result.current.isTracking).toBe(true);
      expect(GnssModule.start).toHaveBeenCalledTimes(1);
    });

    it('should fail when GPS is disabled', async () => {
      (GnssModule.isGpsEnabled as jest.Mock).mockResolvedValue(false);

      const { result } = renderHook(() => useGnss(), { wrapper });

      let success: boolean = true;
      await act(async () => {
        success = await result.current.startTracking();
      });

      expect(success).toBe(false);
      expect(result.current.isTracking).toBe(false);
      expect(GnssModule.start).not.toHaveBeenCalled();
    });

    it('should request permission when not granted', async () => {
      (PermissionService.hasLocationPermission as jest.Mock).mockResolvedValue(false);
      (PermissionService.requestLocationPermission as jest.Mock).mockResolvedValue('granted');
      (GnssModule.start as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useGnss(), { wrapper });

      await act(async () => {
        await result.current.startTracking();
      });

      expect(PermissionService.requestLocationPermission).toHaveBeenCalled();
    });

    it('should fail when permission denied', async () => {
      (PermissionService.hasLocationPermission as jest.Mock).mockResolvedValue(false);
      (PermissionService.requestLocationPermission as jest.Mock).mockResolvedValue('denied');

      const { result } = renderHook(() => useGnss(), { wrapper });

      let success: boolean = true;
      await act(async () => {
        success = await result.current.startTracking();
      });

      expect(success).toBe(false);
      expect(GnssModule.start).not.toHaveBeenCalled();
    });

    it('should set up event listeners', async () => {
      (GnssModule.start as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useGnss(), { wrapper });

      await act(async () => {
        await result.current.startTracking();
      });

      expect(DeviceEventEmitter.addListener).toHaveBeenCalledWith('gnssLocation', expect.any(Function));
      expect(DeviceEventEmitter.addListener).toHaveBeenCalledWith('gnssStatus', expect.any(Function));
      expect(DeviceEventEmitter.addListener).toHaveBeenCalledWith('gnssMeasurement', expect.any(Function));
      expect(DeviceEventEmitter.addListener).toHaveBeenCalledWith('gpsStateChanged', expect.any(Function));
    });

    it('should not start if already tracking', async () => {
      (GnssModule.start as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useGnss(), { wrapper });

      await act(async () => {
        await result.current.startTracking();
      });

      (GnssModule.start as jest.Mock).mockClear();

      await act(async () => {
        await result.current.startTracking();
      });

      expect(GnssModule.start).not.toHaveBeenCalled();
    });
  });

  describe('stopTracking', () => {
    it('should stop tracking and clean up listeners', async () => {
      (GnssModule.start as jest.Mock).mockResolvedValue(undefined);
      (GnssModule.stop as jest.Mock).mockResolvedValue(undefined);

      const mockListener = { remove: jest.fn() };
      (DeviceEventEmitter.addListener as jest.Mock).mockReturnValue(mockListener);

      const { result } = renderHook(() => useGnss(), { wrapper });

      await act(async () => {
        await result.current.startTracking();
      });

      await act(async () => {
        await result.current.stopTracking();
      });

      expect(result.current.isTracking).toBe(false);
      expect(GnssModule.stop).toHaveBeenCalledTimes(1);
      expect(mockListener.remove).toHaveBeenCalled();
    });

    it('should clear location and status data', async () => {
      (GnssModule.start as jest.Mock).mockResolvedValue(undefined);
      (GnssModule.stop as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useGnss(), { wrapper });

      await act(async () => {
        await result.current.startTracking();
      });

      await act(async () => {
        await result.current.stopTracking();
      });

      expect(result.current.location).toBeNull();
      expect(result.current.status).toBeNull();
      expect(result.current.measurements).toEqual([]);
    });
  });

  describe('startLogging', () => {
    it('should start logging with generated filename', async () => {
      const mockFilePath = '/data/gnss_log_2025-01-15.csv';
      (GnssModule.setRawLogging as jest.Mock).mockResolvedValue(mockFilePath);
      (GnssModule.getLoggingState as jest.Mock).mockResolvedValue({
        isLogging: true,
        logFilePath: mockFilePath,
        linesWritten: 0,
      });

      const { result } = renderHook(() => useGnss(), { wrapper });

      let filePath: string | null = null;
      await act(async () => {
        filePath = await result.current.startLogging();
      });

      expect(filePath).toBe(mockFilePath);
      expect(GnssModule.setRawLogging).toHaveBeenCalledWith(true, expect.stringContaining('gnss_log_'));
    });

    it('should start logging with custom filename', async () => {
      const customFileName = 'custom_log.csv';
      const mockFilePath = '/data/custom_log.csv';
      (GnssModule.setRawLogging as jest.Mock).mockResolvedValue(mockFilePath);

      const { result } = renderHook(() => useGnss(), { wrapper });

      await act(async () => {
        await result.current.startLogging(customFileName);
      });

      expect(GnssModule.setRawLogging).toHaveBeenCalledWith(true, customFileName);
    });

    it('should handle logging start errors', async () => {
      (GnssModule.setRawLogging as jest.Mock).mockRejectedValue(new Error('Logging failed'));

      const { result } = renderHook(() => useGnss(), { wrapper });

      let filePath: string | null = 'should be null';
      await act(async () => {
        filePath = await result.current.startLogging();
      });

      expect(filePath).toBeNull();
    });
  });

  describe('stopLogging', () => {
    it('should stop logging', async () => {
      (GnssModule.setRawLogging as jest.Mock).mockResolvedValue(null);
      (GnssModule.getLoggingState as jest.Mock).mockResolvedValue({
        isLogging: false,
        linesWritten: 150,
      });

      const { result } = renderHook(() => useGnss(), { wrapper });

      await act(async () => {
        await result.current.stopLogging();
      });

      expect(GnssModule.setRawLogging).toHaveBeenCalledWith(false, null);
    });

    it('should refresh logging state after stopping', async () => {
      (GnssModule.setRawLogging as jest.Mock).mockResolvedValue(null);
      (GnssModule.getLoggingState as jest.Mock).mockResolvedValue({
        isLogging: false,
        linesWritten: 150,
      });

      const { result } = renderHook(() => useGnss(), { wrapper });

      await act(async () => {
        await result.current.stopLogging();
      });

      expect(GnssModule.getLoggingState).toHaveBeenCalled();
    });
  });

  describe('checkGpsEnabled', () => {
    it('should check GPS status', async () => {
      (GnssModule.isGpsEnabled as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useGnss(), { wrapper });

      let enabled: boolean = false;
      await act(async () => {
        enabled = await result.current.checkGpsEnabled();
      });

      expect(enabled).toBe(true);
      expect(result.current.isGpsEnabled).toBe(true);
    });

    it('should update state when GPS disabled', async () => {
      (GnssModule.isGpsEnabled as jest.Mock).mockResolvedValue(false);

      const { result } = renderHook(() => useGnss(), { wrapper });

      await act(async () => {
        await result.current.checkGpsEnabled();
      });

      expect(result.current.isGpsEnabled).toBe(false);
    });
  });

  describe('refreshLoggingState', () => {
    it('should update logging state from native module', async () => {
      const mockState = {
        isLogging: true,
        logFilePath: '/data/test.csv',
        linesWritten: 100,
      };
      (GnssModule.getLoggingState as jest.Mock).mockResolvedValue(mockState);

      const { result } = renderHook(() => useGnss(), { wrapper });

      await act(async () => {
        await result.current.refreshLoggingState();
      });

      await waitFor(() => {
        expect(result.current.loggingState?.linesWritten).toBe(100);
        expect(result.current.isLogging).toBe(true);
      });
    });
  });

  describe('Event handling', () => {
    it('should update location when event received', async () => {
      let locationCallback: any;
      (DeviceEventEmitter.addListener as jest.Mock).mockImplementation((event, callback) => {
        if (event === 'gnssLocation') {
          locationCallback = callback;
        }
        return { remove: jest.fn() };
      });

      (GnssModule.start as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useGnss(), { wrapper });

      await act(async () => {
        await result.current.startTracking();
      });

      const mockLocation = {
        provider: 'gps',
        latitude: 60.1699,
        longitude: 24.9384,
        time: Date.now(),
      };

      act(() => {
        locationCallback(mockLocation);
      });

      expect(result.current.location).toEqual(mockLocation);
    });

    it('should update status when event received', async () => {
      let statusCallback: any;
      (DeviceEventEmitter.addListener as jest.Mock).mockImplementation((event, callback) => {
        if (event === 'gnssStatus') {
          statusCallback = callback;
        }
        return { remove: jest.fn() };
      });

      (GnssModule.start as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useGnss(), { wrapper });

      await act(async () => {
        await result.current.startTracking();
      });

      const mockStatus = {
        satellitesInView: 12,
        satellitesUsed: 8,
        avgCn0DbHz: 42.5,
      };

      act(() => {
        statusCallback(mockStatus);
      });

      expect(result.current.status).toEqual(mockStatus);
    });

    it('should update measurements when event received', async () => {
      let measurementsCallback: any;
      (DeviceEventEmitter.addListener as jest.Mock).mockImplementation((event, callback) => {
        if (event === 'gnssMeasurement') {
          measurementsCallback = callback;
        }
        return { remove: jest.fn() };
      });

      (GnssModule.start as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useGnss(), { wrapper });

      await act(async () => {
        await result.current.startTracking();
      });

      const mockMeasurements = [
        { svid: 17, cn0DbHz: 45.2, constellation: 'GPS' },
        { svid: 5, cn0DbHz: 38.1, constellation: 'GLONASS' },
      ];

      act(() => {
        measurementsCallback(mockMeasurements);
      });

      expect(result.current.measurements).toEqual(mockMeasurements);
    });
  });
});
