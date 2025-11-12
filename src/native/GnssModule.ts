import { NativeModules } from "react-native";

// ============================================================================
// Type Definitions for GNSS Data
// ============================================================================

/**
 * Location data from Android LocationManager
 */
export type GnssLocation = {
  provider: string;      // "gps" or "network"
  latitude: number;      // degrees
  longitude: number;     // degrees
  altitude?: number;     // meters above sea level
  accuracy?: number;     // horizontal accuracy in meters
  speed?: number;        // meters per second
  bearing?: number;      // degrees (0-360, 0=North)
  time: number;          // milliseconds since epoch
};

/**
 * GNSS satellite status data
 */
export type GnssStatus = {
  satellitesInView: number;              // total satellites visible
  satellitesUsed: number;                // satellites used for position fix
  avgCn0DbHz?: number;                   // average signal strength (dB-Hz)
  constellations?: Record<string, number>; // e.g., { GPS: 12, GALILEO: 8 }
};

/**
 * Raw GNSS measurement data (one per satellite)
 */
export type GnssMeasurement = {
  svid: number;              // satellite vehicle ID
  cn0DbHz?: number;          // signal strength for this satellite
  constellation?: string;    // GPS, GLONASS, GALILEO, etc.
  carrierFrequencyHz?: number; // radio frequency (Hz)
  timeNanos?: number;        // GNSS time (nanoseconds)
};

/**
 * Logging state information
 */
export type LoggingState = {
  isLogging: boolean;
  logFilePath?: string;  // absolute path to CSV log file
  linesWritten: number;  // number of rows written
};

/**
 * Log file information
 */
export type LogFileInfo = {
  name: string;          // filename (e.g., gnss_log_20251031_143022.csv)
  path: string;          // absolute path to file
  size: number;          // file size in bytes
  lastModified: number;  // timestamp in milliseconds
};

// ============================================================================
// Native Module Interfaces
// ============================================================================

/**
 * GnssModule - Core data collection and CSV logging
 */
type GnssModuleType = {
  start(): Promise<void>;
  stop(): Promise<void>;
  setRawLogging(enabled: boolean, fileName?: string | null): Promise<string | null>;
  getRawLogPath(): Promise<string | null>;
  getLoggingState(): Promise<LoggingState>;
  isGpsEnabled(): Promise<boolean>;
  listLogFiles(): Promise<LogFileInfo[]>;
  deleteLogFile(filePath: string): Promise<boolean>;
  // Polling methods for RN 0.76+ bridgeless mode workaround
  getLatestLocation(): Promise<GnssLocation | null>;
  getLatestStatus(): Promise<GnssStatus | null>;
  getLatestMeasurements(): Promise<GnssMeasurement[] | null>;
};

/**
 * GnssExportModule - Export CSV to Downloads folder
 */
type GnssExportModuleType = {
  exportCSV(logFilePath: string, displayName?: string | null): Promise<string>;
};

// ============================================================================
// Module Exports
// ============================================================================

export const GnssModule = NativeModules.GnssModule as GnssModuleType;
export const GnssExportModule = NativeModules.GnssExportModule as GnssExportModuleType;

export default GnssModule;
