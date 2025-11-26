import { GnssMeasurement, GnssLocation, GnssEpoch } from '../../native/GnssModule';

/**
 * Create an epoch from current GNSS measurements and location
 */
export function createEpoch(
  measurements: GnssMeasurement[],
  location: GnssLocation | null
): GnssEpoch {
  const timestamp = Date.now();

  // Filter measurements with valid C/N0
  const validMeasurements = measurements.filter(
    m => m.cn0DbHz !== undefined && m.cn0DbHz > 0
  );

  // Calculate average C/N0
  const avgCn0DbHz = validMeasurements.length > 0
    ? validMeasurements.reduce((sum, m) => sum + (m.cn0DbHz || 0), 0) / validMeasurements.length
    : 0;

  // Calculate average AGC if available
  const measurementsWithAgc = validMeasurements.filter(m => m.agcLevelDb !== undefined);
  const avgAgcLevelDb = measurementsWithAgc.length > 0
    ? measurementsWithAgc.reduce((sum, m) => sum + (m.agcLevelDb || 0), 0) / measurementsWithAgc.length
    : undefined;

  return {
    timestamp,
    avgCn0DbHz,
    avgAgcLevelDb,
    satelliteCount: validMeasurements.length,
    location,
  };
}

/**
 * Calculate distance between two lat/lon points using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate total path distance from array of locations
 */
export function calculatePathDistance(path: GnssLocation[]): number {
  if (path.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 1; i < path.length; i++) {
    totalDistance += calculateDistance(
      path[i - 1].latitude,
      path[i - 1].longitude,
      path[i].latitude,
      path[i].longitude
    );
  }

  return totalDistance;
}

/**
 * Format duration in milliseconds to human readable string
 */
export function formatDuration(durationMs: number): string {
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Format location to readable string
 */
export function formatLocation(location: GnssLocation | null | undefined): string {
  if (!location) return 'Unknown';
  return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
}

/**
 * Generate unique ID for anomaly
 */
export function generateAnomalyId(): string {
  return `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
