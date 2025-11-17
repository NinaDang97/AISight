/**
 * Anomaly Utils Tests
 * Tests for anomaly detection utility functions
 */

import {
  createEpoch,
  calculateDistance,
  calculatePathDistance,
  formatDuration,
  formatLocation,
  generateAnomalyId,
} from '../../src/services/anomaly/utils';
import { GnssMeasurement, GnssLocation } from '../../src/native/GnssModule';

describe('Anomaly Utils', () => {
  describe('createEpoch', () => {
    it('should create epoch from measurements and location', () => {
      const measurements: GnssMeasurement[] = [
        { svid: 1, cn0DbHz: 42.0, constellation: 'GPS', timeNanos: 1000 },
        { svid: 2, cn0DbHz: 38.0, constellation: 'GPS', timeNanos: 1000 },
        { svid: 3, cn0DbHz: 40.0, constellation: 'GALILEO', timeNanos: 1000 },
      ];

      const location: GnssLocation = {
        provider: 'gps',
        latitude: 60.09726,
        longitude: 19.93481,
        time: Date.now(),
      };

      const epoch = createEpoch(measurements, location);

      expect(epoch.avgCn0DbHz).toBeCloseTo(40.0, 1); // (42+38+40)/3
      expect(epoch.satelliteCount).toBe(3);
      expect(epoch.location).toBe(location);
      expect(epoch.timestamp).toBeDefined();
    });

    it('should calculate average C/N0 correctly', () => {
      const measurements: GnssMeasurement[] = [
        { svid: 1, cn0DbHz: 30.0, constellation: 'GPS', timeNanos: 1000 },
        { svid: 2, cn0DbHz: 40.0, constellation: 'GPS', timeNanos: 1000 },
        { svid: 3, cn0DbHz: 50.0, constellation: 'GPS', timeNanos: 1000 },
      ];

      const epoch = createEpoch(measurements, null);

      expect(epoch.avgCn0DbHz).toBeCloseTo(40.0, 1);
    });

    it('should calculate average AGC when available', () => {
      const measurements: GnssMeasurement[] = [
        { svid: 1, cn0DbHz: 40.0, agcLevelDb: -8.0, constellation: 'GPS', timeNanos: 1000 },
        { svid: 2, cn0DbHz: 40.0, agcLevelDb: -10.0, constellation: 'GPS', timeNanos: 1000 },
      ];

      const epoch = createEpoch(measurements, null);

      expect(epoch.avgAgcLevelDb).toBeCloseTo(-9.0, 1); // (-8 + -10)/2
    });

    it('should handle measurements without AGC data', () => {
      const measurements: GnssMeasurement[] = [
        { svid: 1, cn0DbHz: 40.0, constellation: 'GPS', timeNanos: 1000 },
        { svid: 2, cn0DbHz: 42.0, constellation: 'GPS', timeNanos: 1000 },
      ];

      const epoch = createEpoch(measurements, null);

      expect(epoch.avgAgcLevelDb).toBeUndefined();
    });

    it('should filter out invalid measurements (no C/N0 or zero C/N0)', () => {
      const measurements: GnssMeasurement[] = [
        { svid: 1, cn0DbHz: 40.0, constellation: 'GPS', timeNanos: 1000 },
        { svid: 2, cn0DbHz: 0, constellation: 'GPS', timeNanos: 1000 }, // Zero
        { svid: 3, constellation: 'GPS', timeNanos: 1000 }, // Missing cn0DbHz
        { svid: 4, cn0DbHz: 42.0, constellation: 'GPS', timeNanos: 1000 },
      ];

      const epoch = createEpoch(measurements, null);

      expect(epoch.satelliteCount).toBe(2); // Only satellites 1 and 4
      expect(epoch.avgCn0DbHz).toBeCloseTo(41.0, 1); // (40+42)/2
    });

    it('should handle empty measurements array', () => {
      const epoch = createEpoch([], null);

      expect(epoch.satelliteCount).toBe(0);
      expect(epoch.avgCn0DbHz).toBe(0);
      expect(epoch.avgAgcLevelDb).toBeUndefined();
    });

    it('should handle null location', () => {
      const measurements: GnssMeasurement[] = [
        { svid: 1, cn0DbHz: 40.0, constellation: 'GPS', timeNanos: 1000 },
      ];

      const epoch = createEpoch(measurements, null);

      expect(epoch.location).toBeNull();
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      // Helsinki to Turku (approximately 150 km)
      const lat1 = 60.1699; // Helsinki
      const lon1 = 24.9384;
      const lat2 = 60.4518; // Turku
      const lon2 = 22.2666;

      const distance = calculateDistance(lat1, lon1, lat2, lon2);

      // Should be approximately 150,000 meters (allow 10% margin)
      expect(distance).toBeGreaterThan(135000);
      expect(distance).toBeLessThan(165000);
    });

    it('should return 0 for same location', () => {
      const lat = 60.09726;
      const lon = 19.93481;

      const distance = calculateDistance(lat, lon, lat, lon);

      expect(distance).toBeCloseTo(0, 0);
    });

    it('should calculate short distances accurately', () => {
      // Two points 100 meters apart (approximately)
      const lat1 = 60.09726;
      const lon1 = 19.93481;
      const lat2 = 60.09816; // ~100m north
      const lon2 = 19.93481;

      const distance = calculateDistance(lat1, lon1, lat2, lon2);

      expect(distance).toBeGreaterThan(90);
      expect(distance).toBeLessThan(110);
    });
  });

  describe('calculatePathDistance', () => {
    it('should calculate total distance along a path', () => {
      const path: GnssLocation[] = [
        { provider: 'gps', latitude: 60.0, longitude: 20.0, time: 1000 },
        { provider: 'gps', latitude: 60.1, longitude: 20.0, time: 2000 },
        { provider: 'gps', latitude: 60.1, longitude: 20.1, time: 3000 },
      ];

      const distance = calculatePathDistance(path);

      expect(distance).toBeGreaterThan(0);
    });

    it('should return 0 for empty path', () => {
      const distance = calculatePathDistance([]);
      expect(distance).toBe(0);
    });

    it('should return 0 for single point path', () => {
      const path: GnssLocation[] = [
        { provider: 'gps', latitude: 60.0, longitude: 20.0, time: 1000 },
      ];

      const distance = calculatePathDistance(path);
      expect(distance).toBe(0);
    });

    it('should handle stationary path (same location repeated)', () => {
      const path: GnssLocation[] = [
        { provider: 'gps', latitude: 60.09726, longitude: 19.93481, time: 1000 },
        { provider: 'gps', latitude: 60.09726, longitude: 19.93481, time: 2000 },
        { provider: 'gps', latitude: 60.09726, longitude: 19.93481, time: 3000 },
      ];

      const distance = calculatePathDistance(path);
      expect(distance).toBeCloseTo(0, 0);
    });
  });

  describe('formatDuration', () => {
    it('should format seconds only', () => {
      expect(formatDuration(30000)).toBe('30s'); // 30 seconds
      expect(formatDuration(1000)).toBe('1s');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(90000)).toBe('1m 30s'); // 1 min 30 sec
      expect(formatDuration(125000)).toBe('2m 5s'); // 2 min 5 sec
    });

    it('should format hours, minutes, and seconds', () => {
      expect(formatDuration(3665000)).toBe('1h 1m 5s'); // 1h 1m 5s
      expect(formatDuration(7200000)).toBe('2h 0m 0s'); // 2 hours
    });

    it('should handle zero duration', () => {
      expect(formatDuration(0)).toBe('0s');
    });

    it('should handle milliseconds below 1 second', () => {
      expect(formatDuration(500)).toBe('0s');
    });
  });

  describe('formatLocation', () => {
    it('should format location to 6 decimal places', () => {
      const location: GnssLocation = {
        provider: 'gps',
        latitude: 60.097261234,
        longitude: 19.934812345,
        time: Date.now(),
      };

      const formatted = formatLocation(location);
      expect(formatted).toBe('60.097261, 19.934812'); // toFixed rounds
    });

    it('should return "Unknown" for null location', () => {
      expect(formatLocation(null)).toBe('Unknown');
    });

    it('should return "Unknown" for undefined location', () => {
      expect(formatLocation(undefined)).toBe('Unknown');
    });

    it('should handle negative coordinates', () => {
      const location: GnssLocation = {
        provider: 'gps',
        latitude: -33.8688,
        longitude: -151.2093,
        time: Date.now(),
      };

      const formatted = formatLocation(location);
      expect(formatted).toContain('-33.868800');
      expect(formatted).toContain('-151.209300');
    });
  });

  describe('generateAnomalyId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateAnomalyId();
      const id2 = generateAnomalyId();

      expect(id1).not.toBe(id2);
    });

    it('should start with "anomaly_" prefix', () => {
      const id = generateAnomalyId();
      expect(id).toMatch(/^anomaly_/);
    });

    it('should include timestamp', () => {
      const id = generateAnomalyId();
      expect(id).toMatch(/^anomaly_\d+_/);
    });

    it('should include random component', () => {
      const id = generateAnomalyId();
      const parts = id.split('_');
      expect(parts.length).toBe(3); // anomaly, timestamp, random
      expect(parts[2]).toBeTruthy();
    });
  });
});
