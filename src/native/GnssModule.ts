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
  addListener: (eventName: string) => void;
  removeListeners: (count: number) => void;
};

/**
 * GnssExportModule - Export CSV to Downloads folder
 */
type GnssExportModuleType = {
  exportCSV(logFilePath: string, displayName?: string | null): Promise<string>;
  addListener: (eventName: string) => void;
  removeListeners: (count: number) => void;
};

// ============================================================================
// Module Exports
// ============================================================================

export const GnssModule = NativeModules.GnssModule as GnssModuleType;
export const GnssExportModule = NativeModules.GnssExportModule as GnssExportModuleType;

export default GnssModule;
