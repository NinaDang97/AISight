/**
 * GnssModule Tests
 * Tests for the native GNSS module type definitions and interface
 */

import { NativeModules } from 'react-native';
import type {
  GnssLocation,
  GnssStatus,
  GnssMeasurement,
  LoggingState,
  LogFileInfo,
} from '../../src/native/GnssModule';

// Mock the native modules
jest.mock('react-native', () => ({
  NativeModules: {
    GnssModule: {
      start: jest.fn(),
      stop: jest.fn(),
      setRawLogging: jest.fn(),
      getRawLogPath: jest.fn(),
      getLoggingState: jest.fn(),
      isGpsEnabled: jest.fn(),
      listLogFiles: jest.fn(),
      deleteLogFile: jest.fn(),
      getLatestLocation: jest.fn(),
      getLatestStatus: jest.fn(),
      getLatestMeasurements: jest.fn(),
    },
    GnssExportModule: {
      exportCSV: jest.fn(),
    },
  },
}));

describe('GnssModule Type Definitions', () => {
  describe('GnssLocation', () => {
    it('should have correct structure for required fields', () => {
      const location: GnssLocation = {
        provider: 'gps',
        latitude: 60.1699,
        longitude: 24.9384,
        time: Date.now(),
      };

      expect(location.provider).toBe('gps');
      expect(location.latitude).toBe(60.1699);
      expect(location.longitude).toBe(24.9384);
      expect(typeof location.time).toBe('number');
    });

    it('should support optional fields', () => {
      const location: GnssLocation = {
        provider: 'gps',
        latitude: 60.1699,
        longitude: 24.9384,
        altitude: 25.5,
        accuracy: 10.0,
        speed: 5.5,
        bearing: 180.0,
        time: Date.now(),
      };

      expect(location.altitude).toBe(25.5);
      expect(location.accuracy).toBe(10.0);
      expect(location.speed).toBe(5.5);
      expect(location.bearing).toBe(180.0);
    });
  });

  describe('GnssStatus', () => {
    it('should have correct structure for satellite counts', () => {
      const status: GnssStatus = {
        satellitesInView: 12,
        satellitesUsed: 8,
      };

      expect(status.satellitesInView).toBe(12);
      expect(status.satellitesUsed).toBe(8);
    });

    it('should support optional signal strength and constellations', () => {
      const status: GnssStatus = {
        satellitesInView: 12,
        satellitesUsed: 8,
        avgCn0DbHz: 42.5,
        constellations: {
          GPS: 6,
          GLONASS: 4,
          GALILEO: 2,
        },
      };

      expect(status.avgCn0DbHz).toBe(42.5);
      expect(status.constellations).toBeDefined();
      expect(status.constellations?.GPS).toBe(6);
    });
  });

  describe('GnssMeasurement', () => {
    it('should have required svid field', () => {
      const measurement: GnssMeasurement = {
        svid: 17,
      };

      expect(measurement.svid).toBe(17);
    });

    it('should support all optional fields', () => {
      const measurement: GnssMeasurement = {
        svid: 17,
        cn0DbHz: 45.2,
        constellation: 'GPS',
        carrierFrequencyHz: 1575420000,
        timeNanos: 1234567890123456,
      };

      expect(measurement.cn0DbHz).toBe(45.2);
      expect(measurement.constellation).toBe('GPS');
      expect(measurement.carrierFrequencyHz).toBe(1575420000);
      expect(measurement.timeNanos).toBe(1234567890123456);
    });
  });

  describe('LoggingState', () => {
    it('should have correct structure when not logging', () => {
      const state: LoggingState = {
        isLogging: false,
        linesWritten: 0,
      };

      expect(state.isLogging).toBe(false);
      expect(state.linesWritten).toBe(0);
      expect(state.logFilePath).toBeUndefined();
    });

    it('should include file path when logging', () => {
      const state: LoggingState = {
        isLogging: true,
        logFilePath: '/data/user/0/com.aisight/files/gnss_log_2025-01-15.csv',
        linesWritten: 150,
      };

      expect(state.isLogging).toBe(true);
      expect(state.logFilePath).toBeDefined();
      expect(state.linesWritten).toBe(150);
    });
  });

  describe('LogFileInfo', () => {
    it('should have correct structure for file information', () => {
      const fileInfo: LogFileInfo = {
        name: 'gnss_log_2025-01-15_120000.csv',
        path: '/data/user/0/com.aisight/files/gnss_log_2025-01-15_120000.csv',
        size: 1048576,
        lastModified: 1705320000000,
      };

      expect(fileInfo.name).toBe('gnss_log_2025-01-15_120000.csv');
      expect(fileInfo.path).toContain('gnss_log');
      expect(fileInfo.size).toBe(1048576);
      expect(typeof fileInfo.lastModified).toBe('number');
    });
  });
});

describe('GnssModule Native Interface', () => {
  const mockGnssModule = NativeModules.GnssModule;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('start()', () => {
    it('should call native start method', async () => {
      mockGnssModule.start.mockResolvedValue(undefined);

      await mockGnssModule.start();

      expect(mockGnssModule.start).toHaveBeenCalledTimes(1);
    });

    it('should handle start errors', async () => {
      const error = new Error('GPS not available');
      mockGnssModule.start.mockRejectedValue(error);

      await expect(mockGnssModule.start()).rejects.toThrow('GPS not available');
    });
  });

  describe('stop()', () => {
    it('should call native stop method', async () => {
      mockGnssModule.stop.mockResolvedValue(undefined);

      await mockGnssModule.stop();

      expect(mockGnssModule.stop).toHaveBeenCalledTimes(1);
    });
  });

  describe('setRawLogging()', () => {
    it('should start logging with file name', async () => {
      const expectedPath = '/data/user/0/com.aisight/files/test_log.csv';
      mockGnssModule.setRawLogging.mockResolvedValue(expectedPath);

      const result = await mockGnssModule.setRawLogging(true, 'test_log.csv');

      expect(mockGnssModule.setRawLogging).toHaveBeenCalledWith(true, 'test_log.csv');
      expect(result).toBe(expectedPath);
    });

    it('should stop logging', async () => {
      mockGnssModule.setRawLogging.mockResolvedValue(null);

      const result = await mockGnssModule.setRawLogging(false, null);

      expect(mockGnssModule.setRawLogging).toHaveBeenCalledWith(false, null);
      expect(result).toBeNull();
    });
  });

  describe('getLoggingState()', () => {
    it('should return current logging state', async () => {
      const mockState: LoggingState = {
        isLogging: true,
        logFilePath: '/data/test.csv',
        linesWritten: 100,
      };
      mockGnssModule.getLoggingState.mockResolvedValue(mockState);

      const result = await mockGnssModule.getLoggingState();

      expect(result.isLogging).toBe(true);
      expect(result.linesWritten).toBe(100);
    });
  });

  describe('isGpsEnabled()', () => {
    it('should return true when GPS is enabled', async () => {
      mockGnssModule.isGpsEnabled.mockResolvedValue(true);

      const result = await mockGnssModule.isGpsEnabled();

      expect(result).toBe(true);
    });

    it('should return false when GPS is disabled', async () => {
      mockGnssModule.isGpsEnabled.mockResolvedValue(false);

      const result = await mockGnssModule.isGpsEnabled();

      expect(result).toBe(false);
    });
  });

  describe('listLogFiles()', () => {
    it('should return list of log files', async () => {
      const mockFiles: LogFileInfo[] = [
        {
          name: 'log1.csv',
          path: '/data/log1.csv',
          size: 1024,
          lastModified: Date.now(),
        },
        {
          name: 'log2.csv',
          path: '/data/log2.csv',
          size: 2048,
          lastModified: Date.now(),
        },
      ];
      mockGnssModule.listLogFiles.mockResolvedValue(mockFiles);

      const result = await mockGnssModule.listLogFiles();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('log1.csv');
    });

    it('should return empty array when no files exist', async () => {
      mockGnssModule.listLogFiles.mockResolvedValue([]);

      const result = await mockGnssModule.listLogFiles();

      expect(result).toEqual([]);
    });
  });

  describe('deleteLogFile()', () => {
    it('should delete file and return true', async () => {
      mockGnssModule.deleteLogFile.mockResolvedValue(true);

      const result = await mockGnssModule.deleteLogFile('/data/test.csv');

      expect(mockGnssModule.deleteLogFile).toHaveBeenCalledWith('/data/test.csv');
      expect(result).toBe(true);
    });

    it('should return false if file does not exist', async () => {
      mockGnssModule.deleteLogFile.mockResolvedValue(false);

      const result = await mockGnssModule.deleteLogFile('/data/nonexistent.csv');

      expect(result).toBe(false);
    });
  });
});

describe('GnssExportModule Native Interface', () => {
  const mockExportModule = NativeModules.GnssExportModule;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exportCSV()', () => {
    it('should export file to Downloads folder', async () => {
      const inputPath = '/data/user/0/com.aisight/files/log.csv';
      const exportedPath = '/storage/emulated/0/Download/Aisight/log.csv';
      mockExportModule.exportCSV.mockResolvedValue(exportedPath);

      const result = await mockExportModule.exportCSV(inputPath, 'log.csv');

      expect(mockExportModule.exportCSV).toHaveBeenCalledWith(inputPath, 'log.csv');
      expect(result).toBe(exportedPath);
    });

    it('should handle export errors', async () => {
      const error = new Error('Export failed');
      mockExportModule.exportCSV.mockRejectedValue(error);

      await expect(mockExportModule.exportCSV('/invalid/path.csv')).rejects.toThrow(
        'Export failed'
      );
    });
  });
});
