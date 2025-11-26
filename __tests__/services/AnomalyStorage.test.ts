/**
 * AnomalyStorage Tests
 * Tests for persistent storage and export functionality of GNSS anomalies
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnomalyStorage } from '../../src/services/anomaly/AnomalyStorage';
import { GnssAnomalyEvent, GnssLocation } from '../../src/native/GnssModule';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('AnomalyStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset all mocks to successful defaults
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('saveAnomalies', () => {
    it('should save anomalies to AsyncStorage', async () => {
      const anomalies: GnssAnomalyEvent[] = [createMockAnomaly('JAMMING')];

      await AnomalyStorage.saveAnomalies(anomalies);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@aisight_anomalies',
        JSON.stringify(anomalies)
      );
    });

    it('should throw error if AsyncStorage fails', async () => {
      const error = new Error('Storage error');
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(error);

      await expect(AnomalyStorage.saveAnomalies([])).rejects.toThrow('Storage error');
    });
  });

  describe('loadAnomalies', () => {
    it('should load anomalies from AsyncStorage', async () => {
      const anomalies: GnssAnomalyEvent[] = [
        createMockAnomaly('JAMMING'),
        createMockAnomaly('SPOOFING'),
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(anomalies));

      const result = await AnomalyStorage.loadAnomalies();

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@aisight_anomalies');
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('JAMMING');
      expect(result[1].type).toBe('SPOOFING');
    });

    it('should return empty array if no data exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await AnomalyStorage.loadAnomalies();

      expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Read error'));

      const result = await AnomalyStorage.loadAnomalies();

      expect(result).toEqual([]);
    });

    it('should parse JSON correctly', async () => {
      const anomaly = createMockAnomaly('JAMMING');
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([anomaly]));

      const result = await AnomalyStorage.loadAnomalies();

      expect(result[0].id).toBe(anomaly.id);
      expect(result[0].type).toBe(anomaly.type);
      expect(result[0].severity).toBe(anomaly.severity);
    });
  });

  describe('addAnomaly', () => {
    it('should add anomaly to beginning of existing list', async () => {
      const existingAnomaly = createMockAnomaly('JAMMING');
      const newAnomaly = createMockAnomaly('SPOOFING');

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify([existingAnomaly])
      );

      await AnomalyStorage.addAnomaly(newAnomaly);

      const savedData = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
      const savedAnomalies = JSON.parse(savedData);

      expect(savedAnomalies).toHaveLength(2);
      expect(savedAnomalies[0].type).toBe('SPOOFING'); // New anomaly first
      expect(savedAnomalies[1].type).toBe('JAMMING');
    });

    it('should add anomaly to empty list', async () => {
      const newAnomaly = createMockAnomaly('JAMMING');
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      await AnomalyStorage.addAnomaly(newAnomaly);

      const savedData = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
      const savedAnomalies = JSON.parse(savedData);

      expect(savedAnomalies).toHaveLength(1);
      expect(savedAnomalies[0].type).toBe('JAMMING');
    });

    it('should throw error on failure', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Write error'));

      await expect(AnomalyStorage.addAnomaly(createMockAnomaly('JAMMING'))).rejects.toThrow();
    });
  });

  describe('deleteAnomaly', () => {
    it('should delete specific anomaly by ID', async () => {
      const anomaly1 = createMockAnomaly('JAMMING', 'anomaly_1');
      const anomaly2 = createMockAnomaly('SPOOFING', 'anomaly_2');
      const anomaly3 = createMockAnomaly('SIGNAL_DEGRADATION', 'anomaly_3');

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify([anomaly1, anomaly2, anomaly3])
      );

      await AnomalyStorage.deleteAnomaly('anomaly_2');

      const savedData = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
      const savedAnomalies = JSON.parse(savedData);

      expect(savedAnomalies).toHaveLength(2);
      expect(savedAnomalies.find((a: any) => a.id === 'anomaly_1')).toBeDefined();
      expect(savedAnomalies.find((a: any) => a.id === 'anomaly_2')).toBeUndefined();
      expect(savedAnomalies.find((a: any) => a.id === 'anomaly_3')).toBeDefined();
    });

    it('should handle deleting non-existent ID gracefully', async () => {
      const anomaly = createMockAnomaly('JAMMING', 'anomaly_1');
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([anomaly]));

      await AnomalyStorage.deleteAnomaly('non_existent_id');

      const savedData = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
      const savedAnomalies = JSON.parse(savedData);

      expect(savedAnomalies).toHaveLength(1); // Original anomaly still there
    });

    it('should throw error on failure', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([createMockAnomaly('JAMMING', 'anomaly_1')]));
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Write error'));

      await expect(AnomalyStorage.deleteAnomaly('anomaly_1')).rejects.toThrow('Write error');
    });
  });

  describe('clearAll', () => {
    it('should remove all anomalies from storage', async () => {
      await AnomalyStorage.clearAll();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@aisight_anomalies');
    });

    it('should throw error on failure', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(new Error('Remove error'));

      await expect(AnomalyStorage.clearAll()).rejects.toThrow();
    });
  });

  describe('getCount', () => {
    it('should return count of stored anomalies', async () => {
      const anomalies = [
        createMockAnomaly('JAMMING'),
        createMockAnomaly('SPOOFING'),
        createMockAnomaly('SIGNAL_DEGRADATION'),
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(anomalies));

      const count = await AnomalyStorage.getCount();

      expect(count).toBe(3);
    });

    it('should return 0 for empty storage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const count = await AnomalyStorage.getCount();

      expect(count).toBe(0);
    });

    it('should return 0 on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Read error'));

      const count = await AnomalyStorage.getCount();

      expect(count).toBe(0);
    });
  });

  describe('anomalyToGeoJSON', () => {
    it('should create GeoJSON FeatureCollection with start, end, and path', () => {
      const anomaly = createMockAnomalyWithPath();

      const geoJSON = AnomalyStorage.anomalyToGeoJSON(anomaly) as any;

      expect(geoJSON.type).toBe('FeatureCollection');
      expect(geoJSON.features).toHaveLength(3); // Start point, end point, path line
    });

    it('should create start point feature with correct properties', () => {
      const anomaly = createMockAnomalyWithPath();

      const geoJSON = AnomalyStorage.anomalyToGeoJSON(anomaly) as any;
      const startFeature = geoJSON.features.find((f: any) => f.properties.type === 'anomaly-start');

      expect(startFeature).toBeDefined();
      expect(startFeature.geometry.type).toBe('Point');
      expect(startFeature.geometry.coordinates).toEqual([19.93481, 60.09726]);
      expect(startFeature.properties.anomalyType).toBe('JAMMING');
      expect(startFeature.properties.severity).toBe('High');
      expect(startFeature.properties.timestamp).toBe(anomaly.startTime);
    });

    it('should create end point feature when anomaly is completed', () => {
      const anomaly = createMockAnomalyWithPath();

      const geoJSON = AnomalyStorage.anomalyToGeoJSON(anomaly) as any;
      const endFeature = geoJSON.features.find((f: any) => f.properties.type === 'anomaly-end');

      expect(endFeature).toBeDefined();
      expect(endFeature.geometry.type).toBe('Point');
      expect(endFeature.geometry.coordinates).toEqual([19.93500, 60.09750]);
      expect(endFeature.properties.timestamp).toBe(anomaly.endTime);
    });

    it('should not create end point for active anomaly', () => {
      const anomaly = createMockAnomaly('JAMMING');
      // Active anomaly has no endLocation or endTime

      const geoJSON = AnomalyStorage.anomalyToGeoJSON(anomaly) as any;
      const endFeature = geoJSON.features.find((f: any) => f.properties.type === 'anomaly-end');

      expect(endFeature).toBeUndefined();
    });

    it('should create LineString feature for path with multiple points', () => {
      const anomaly = createMockAnomalyWithPath();

      const geoJSON = AnomalyStorage.anomalyToGeoJSON(anomaly) as any;
      const pathFeature = geoJSON.features.find((f: any) => f.properties.type === 'anomaly-path');

      expect(pathFeature).toBeDefined();
      expect(pathFeature.geometry.type).toBe('LineString');
      expect(pathFeature.geometry.coordinates).toHaveLength(3);
      expect(pathFeature.properties.pathLength).toBe(3);
      expect(pathFeature.properties.cn0Drop).toBeDefined();
    });

    it('should not create LineString for single point path', () => {
      const anomaly = createMockAnomaly('JAMMING');
      // Default mock has single point path

      const geoJSON = AnomalyStorage.anomalyToGeoJSON(anomaly) as any;
      const pathFeature = geoJSON.features.find((f: any) => f.properties.type === 'anomaly-path');

      expect(pathFeature).toBeUndefined();
    });

    it('should format anomaly type in description', () => {
      const anomaly = createMockAnomaly('SIGNAL_DEGRADATION');

      const geoJSON = AnomalyStorage.anomalyToGeoJSON(anomaly) as any;
      const startFeature = geoJSON.features[0];

      expect(startFeature.properties.description).toContain('SIGNAL DEGRADATION');
    });

    it('should include all metrics in path properties', () => {
      const anomaly = createMockAnomalyWithPath();
      anomaly.metrics.agcDrop = -12.5;

      const geoJSON = AnomalyStorage.anomalyToGeoJSON(anomaly) as any;
      const pathFeature = geoJSON.features.find((f: any) => f.properties.type === 'anomaly-path');

      expect(pathFeature.properties.cn0Drop).toBe(anomaly.metrics.cn0Drop);
      expect(pathFeature.properties.agcDrop).toBe(-12.5);
      expect(pathFeature.properties.severity).toBe('High');
      expect(pathFeature.properties.status).toBe('completed');
    });
  });

  describe('exportToJSON', () => {
    it('should export anomaly as formatted JSON string', () => {
      const anomaly = createMockAnomaly('JAMMING');

      const json = AnomalyStorage.exportToJSON(anomaly);
      const parsed = JSON.parse(json);

      expect(parsed.id).toBe(anomaly.id);
      expect(parsed.type).toBe('JAMMING');
      expect(parsed.severity).toBe('High');
    });

    it('should use 2-space indentation', () => {
      const anomaly = createMockAnomaly('JAMMING');

      const json = AnomalyStorage.exportToJSON(anomaly);

      expect(json).toContain('  "id"');
      expect(json).toContain('  "type"');
    });

    it('should include all anomaly properties', () => {
      const anomaly = createMockAnomalyWithPath();

      const json = AnomalyStorage.exportToJSON(anomaly);
      const parsed = JSON.parse(json);

      expect(parsed.startLocation).toBeDefined();
      expect(parsed.endLocation).toBeDefined();
      expect(parsed.path).toHaveLength(3);
      expect(parsed.metrics).toBeDefined();
    });
  });

  describe('exportToCSV', () => {
    it('should export anomaly as CSV with headers', () => {
      const anomaly = createMockAnomalyWithPath();

      const csv = AnomalyStorage.exportToCSV(anomaly);
      const lines = csv.split('\n');

      expect(lines).toHaveLength(2); // Header + data row
      expect(lines[0]).toContain('Type,Severity,Status');
      expect(lines[0]).toContain('Start Lat,Start Lon');
      expect(lines[0]).toContain('C/N0 Drop (%),AGC Drop (%)');
    });

    it('should format data row correctly', () => {
      const anomaly = createMockAnomalyWithPath();
      anomaly.type = 'JAMMING';
      anomaly.severity = 'High';

      const csv = AnomalyStorage.exportToCSV(anomaly);
      const lines = csv.split('\n');
      const dataRow = lines[1];

      expect(dataRow).toContain('JAMMING');
      expect(dataRow).toContain('High');
      expect(dataRow).toContain('completed');
    });

    it('should format timestamps as ISO strings', () => {
      const anomaly = createMockAnomalyWithPath();
      const startDate = new Date(anomaly.startTime);
      const endDate = new Date(anomaly.endTime!);

      const csv = AnomalyStorage.exportToCSV(anomaly);
      const lines = csv.split('\n');
      const dataRow = lines[1];

      expect(dataRow).toContain(startDate.toISOString());
      expect(dataRow).toContain(endDate.toISOString());
    });

    it('should show "Ongoing" for active anomaly without end time', () => {
      const anomaly = createMockAnomaly('JAMMING');
      anomaly.endTime = undefined;

      const csv = AnomalyStorage.exportToCSV(anomaly);

      expect(csv).toContain('Ongoing');
    });

    it('should format coordinates to 6 decimal places', () => {
      const anomaly = createMockAnomalyWithPath();

      const csv = AnomalyStorage.exportToCSV(anomaly);

      expect(csv).toMatch(/60\.097260/); // Start latitude
      expect(csv).toMatch(/19\.934810/); // Start longitude
      expect(csv).toMatch(/60\.097500/); // End latitude
      expect(csv).toMatch(/19\.935000/); // End longitude
    });

    it('should calculate duration in seconds', () => {
      const anomaly = createMockAnomalyWithPath();
      const durationMs = anomaly.endTime! - anomaly.startTime;
      const durationSec = (durationMs / 1000).toFixed(1);

      const csv = AnomalyStorage.exportToCSV(anomaly);

      expect(csv).toContain(durationSec);
    });

    it('should format C/N0 drop to 2 decimal places', () => {
      const anomaly = createMockAnomalyWithPath();
      anomaly.metrics.cn0Drop = 15.456;

      const csv = AnomalyStorage.exportToCSV(anomaly);

      expect(csv).toContain('15.46');
    });

    it('should show "N/A" for missing AGC data', () => {
      const anomaly = createMockAnomalyWithPath();
      anomaly.metrics.agcDrop = undefined;

      const csv = AnomalyStorage.exportToCSV(anomaly);

      expect(csv).toContain('N/A');
    });

    it('should include path points count', () => {
      const anomaly = createMockAnomalyWithPath();

      const csv = AnomalyStorage.exportToCSV(anomaly);

      expect(csv).toContain(',3,'); // 3 path points
    });

    it('should quote description to handle special characters', () => {
      const anomaly = createMockAnomalyWithPath();
      anomaly.description = 'Test, with, commas';

      const csv = AnomalyStorage.exportToCSV(anomaly);

      expect(csv).toContain('"Test, with, commas"');
    });

    it('should handle missing start/end locations', () => {
      const anomaly = createMockAnomaly('JAMMING');
      anomaly.startLocation = null;
      anomaly.endLocation = null;

      const csv = AnomalyStorage.exportToCSV(anomaly);
      const lines = csv.split('\n');
      const dataRow = lines[1];
      const fields = dataRow.split(',');

      // Check that lat/lon fields are empty strings
      expect(fields[6]).toBe(''); // Start lat
      expect(fields[7]).toBe(''); // Start lon
      expect(fields[8]).toBe(''); // End lat
      expect(fields[9]).toBe(''); // End lon
    });
  });
});

// Helper functions

function createMockAnomaly(
  type: 'JAMMING' | 'SPOOFING' | 'SIGNAL_DEGRADATION',
  id?: string
): GnssAnomalyEvent {
  const now = Date.now();
  return {
    id: id || `anomaly_${now}_test`,
    type,
    severity: 'High',
    status: 'active',
    startTime: now - 10000,
    endTime: undefined,
    startLocation: {
      provider: 'gps',
      latitude: 60.09726,
      longitude: 19.93481,
      time: now - 10000,
    },
    endLocation: null,
    path: [{
      provider: 'gps',
      latitude: 60.09726,
      longitude: 19.93481,
      time: now - 10000,
    }],
    metrics: {
      cn0Drop: 15.5,
      agcDrop: -10.2,
      baselineCn0: 42.0,
      avgCn0: 35.5,
      baselineAgc: -8.0,
      avgAgc: -10.2,
    },
    description: `${type} detected with High severity`,
  };
}

function createMockAnomalyWithPath(): GnssAnomalyEvent {
  const startTime = Date.now() - 30000;
  const endTime = Date.now() - 10000;

  const path: GnssLocation[] = [
    { provider: 'gps', latitude: 60.09726, longitude: 19.93481, time: startTime },
    { provider: 'gps', latitude: 60.09738, longitude: 19.93490, time: startTime + 10000 },
    { provider: 'gps', latitude: 60.09750, longitude: 19.93500, time: endTime },
  ];

  return {
    id: 'anomaly_path_test',
    type: 'JAMMING',
    severity: 'High',
    status: 'completed',
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
