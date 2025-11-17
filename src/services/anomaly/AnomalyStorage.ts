import AsyncStorage from '@react-native-async-storage/async-storage';
import { GnssAnomalyEvent } from '../../native/GnssModule';

const STORAGE_KEY = '@aisight_anomalies';

/**
 * AnomalyStorage
 *
 * Handles persistent storage of detected GNSS anomalies using AsyncStorage.
 * Stores anomaly events with full path data, timestamps, and detection metrics.
 */
export class AnomalyStorage {
  /**
   * Save anomalies to persistent storage
   */
  static async saveAnomalies(anomalies: GnssAnomalyEvent[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(anomalies);
      await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    } catch (error) {
      console.error('[AnomalyStorage] Error saving anomalies:', error);
      throw error;
    }
  }

  /**
   * Load anomalies from persistent storage
   */
  static async loadAnomalies(): Promise<GnssAnomalyEvent[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (jsonValue === null) {
        return [];
      }
      return JSON.parse(jsonValue) as GnssAnomalyEvent[];
    } catch (error) {
      console.error('[AnomalyStorage] Error loading anomalies:', error);
      return [];
    }
  }

  /**
   * Add a single anomaly to storage
   */
  static async addAnomaly(anomaly: GnssAnomalyEvent): Promise<void> {
    try {
      const existingAnomalies = await this.loadAnomalies();
      const updatedAnomalies = [anomaly, ...existingAnomalies];
      await this.saveAnomalies(updatedAnomalies);
    } catch (error) {
      console.error('[AnomalyStorage] Error adding anomaly:', error);
      throw error;
    }
  }

  /**
   * Delete a specific anomaly by ID
   */
  static async deleteAnomaly(anomalyId: string): Promise<void> {
    try {
      const existingAnomalies = await this.loadAnomalies();
      const filteredAnomalies = existingAnomalies.filter(a => a.id !== anomalyId);
      await this.saveAnomalies(filteredAnomalies);
    } catch (error) {
      console.error('[AnomalyStorage] Error deleting anomaly:', error);
      throw error;
    }
  }

  /**
   * Clear all stored anomalies
   */
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('[AnomalyStorage] Error clearing anomalies:', error);
      throw error;
    }
  }

  /**
   * Get anomaly count
   */
  static async getCount(): Promise<number> {
    try {
      const anomalies = await this.loadAnomalies();
      return anomalies.length;
    } catch (error) {
      console.error('[AnomalyStorage] Error getting count:', error);
      return 0;
    }
  }

  /**
   * Convert anomaly to GeoJSON format for map display
   * Creates a FeatureCollection with start point, end point, and path line
   */
  static anomalyToGeoJSON(anomaly: GnssAnomalyEvent): object {
    const features: any[] = [];

    // Add start point
    if (anomaly.startLocation) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [anomaly.startLocation.longitude, anomaly.startLocation.latitude]
        },
        properties: {
          type: 'anomaly-start',
          anomalyId: anomaly.id,
          anomalyType: anomaly.type,
          severity: anomaly.severity,
          timestamp: anomaly.startTime,
          description: `Anomaly Start: ${anomaly.type.replace(/_/g, ' ')}`,
        }
      });
    }

    // Add end point (if anomaly is completed)
    if (anomaly.endLocation && anomaly.endTime) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [anomaly.endLocation.longitude, anomaly.endLocation.latitude]
        },
        properties: {
          type: 'anomaly-end',
          anomalyId: anomaly.id,
          anomalyType: anomaly.type,
          severity: anomaly.severity,
          timestamp: anomaly.endTime,
          description: `Anomaly End: ${anomaly.type.replace(/_/g, ' ')}`,
        }
      });
    }

    // Add path line (if there are multiple points)
    if (anomaly.path.length >= 2) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: anomaly.path.map(loc => [loc.longitude, loc.latitude])
        },
        properties: {
          type: 'anomaly-path',
          anomalyId: anomaly.id,
          anomalyType: anomaly.type,
          severity: anomaly.severity,
          status: anomaly.status,
          startTime: anomaly.startTime,
          endTime: anomaly.endTime,
          duration: (anomaly.endTime || Date.now()) - anomaly.startTime,
          pathLength: anomaly.path.length,
          description: anomaly.description,
          cn0Drop: anomaly.metrics.cn0Drop,
          agcDrop: anomaly.metrics.agcDrop,
        }
      });
    }

    return {
      type: 'FeatureCollection',
      features
    };
  }

  /**
   * Export anomaly data to JSON format
   */
  static exportToJSON(anomaly: GnssAnomalyEvent): string {
    return JSON.stringify(anomaly, null, 2);
  }

  /**
   * Export anomaly data to CSV format
   */
  static exportToCSV(anomaly: GnssAnomalyEvent): string {
    const headers = [
      'Type',
      'Severity',
      'Status',
      'Start Time',
      'End Time',
      'Duration (s)',
      'Start Lat',
      'Start Lon',
      'End Lat',
      'End Lon',
      'Path Points',
      'C/N0 Drop (%)',
      'AGC Drop (%)',
      'Description'
    ].join(',');

    const duration = ((anomaly.endTime || Date.now()) - anomaly.startTime) / 1000;

    const row = [
      anomaly.type,
      anomaly.severity,
      anomaly.status,
      new Date(anomaly.startTime).toISOString(),
      anomaly.endTime ? new Date(anomaly.endTime).toISOString() : 'Ongoing',
      duration.toFixed(1),
      anomaly.startLocation?.latitude.toFixed(6) || '',
      anomaly.startLocation?.longitude.toFixed(6) || '',
      anomaly.endLocation?.latitude.toFixed(6) || '',
      anomaly.endLocation?.longitude.toFixed(6) || '',
      anomaly.path.length,
      anomaly.metrics.cn0Drop.toFixed(2),
      anomaly.metrics.agcDrop?.toFixed(2) || 'N/A',
      `"${anomaly.description}"`
    ].join(',');

    return `${headers}\n${row}`;
  }
}
