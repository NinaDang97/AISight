import type {
  Feature,
  FeatureCollection,
  LineString,
  Point,
  Position as GeoJSONPosition,
} from 'geojson';
import rawGnssLog from './gnss_raw.json';

type ConstellationName =
  | 'GPS'
  | 'GLONASS'
  | 'GALILEO'
  | 'BEIDOU'
  | 'QZSS'
  | 'NAVIC'
  | 'SBAS'
  | 'UNKNOWN';

type RawMeasurementEntry = {
  type: 'measurement';
  svid: number;
  timeNanos: number;
  constellation: ConstellationName;
  cn0DbHz: number;
  carrierFrequencyHz: number;
};

type RawLocationEntry = {
  type: 'location';
  provider: string;
  latitude: number;
  longitude: number;
  time: number;
  altitude: number;
  accuracy: number;
  speed: number;
};

type RawEntry = RawMeasurementEntry | RawLocationEntry;

const rawData = rawGnssLog as RawEntry[];

export interface SatelliteInfo {
  svid: number;
  timeNanos: number;
  constellationType: number;
  constellationName: ConstellationName;
  cn0DbHz?: number;
  elevation?: number;
  azimuth?: number;
  hasEphemeris: boolean;
  hasAlmanac: boolean;
  usedInFix: boolean;
  carrierFrequencyHz?: number;
}

export interface FrequencyBandInfo {
  frequency: number;
  constellation: ConstellationName;
  band: string;
  isDualFrequency: boolean;
}

export interface GnssStatusResult {
  isGNSSSupported: boolean;
  isDualFrequencySupported: boolean;
  isNavICSupported: boolean;
  satellitesVisible: number;
  satellitesUsedInFix: number;
  averageSignalToNoiseRatio: number;
  supportedConstellations: ConstellationName[];
  carrierFrequencies: number[];
  frequencyBands: FrequencyBandInfo[];
  satellites: SatelliteInfo[];
  apiLevel?: number;
  supportsCn0?: boolean;
  supportsCarrierFreq?: boolean;
}

const CONSTELLATION_TYPE_MAP: Record<ConstellationName, number> = {
  UNKNOWN: 0,
  GPS: 1,
  SBAS: 2,
  GLONASS: 3,
  QZSS: 4,
  BEIDOU: 5,
  GALILEO: 6,
  NAVIC: 7,
};

const CARRIER_FREQUENCIES_MHZ = {
  GPS_L1: 1575.42,
  GPS_L2: 1227.6,
  GPS_L5: 1176.45,
  GLONASS_L1_CENTER: 1602.0,
  GLONASS_L2_CENTER: 1246.0,
  GLONASS_L5: 1176.45,
  GALILEO_E1: 1575.42,
  GALILEO_E5a: 1176.45,
  GALILEO_E5b: 1207.14,
  BEIDOU_B1: 1561.098,
  BEIDOU_B2: 1207.14,
  BEIDOU_B3: 1268.52,
  SBAS_L1: 1575.42,
  SBAS_L5: 1176.45,
} as const;

const identifyFrequencyBand = (
  frequencyMHz: number,
  tolerance: number = 1.0,
): FrequencyBandInfo => {
  const freq = frequencyMHz;

  if (Math.abs(freq - CARRIER_FREQUENCIES_MHZ.GPS_L1) <= tolerance) {
    return { frequency: freq, constellation: 'GPS', band: 'L1', isDualFrequency: false };
  }
  if (Math.abs(freq - CARRIER_FREQUENCIES_MHZ.GPS_L2) <= tolerance) {
    return { frequency: freq, constellation: 'GPS', band: 'L2', isDualFrequency: true };
  }
  if (Math.abs(freq - CARRIER_FREQUENCIES_MHZ.GPS_L5) <= tolerance) {
    return { frequency: freq, constellation: 'GPS', band: 'L5', isDualFrequency: true };
  }

  if (Math.abs(freq - CARRIER_FREQUENCIES_MHZ.GLONASS_L1_CENTER) <= tolerance) {
    return { frequency: freq, constellation: 'GLONASS', band: 'L1', isDualFrequency: false };
  }
  if (Math.abs(freq - CARRIER_FREQUENCIES_MHZ.GLONASS_L2_CENTER) <= tolerance) {
    return { frequency: freq, constellation: 'GLONASS', band: 'L2', isDualFrequency: true };
  }
  if (Math.abs(freq - CARRIER_FREQUENCIES_MHZ.GLONASS_L5) <= tolerance) {
    return { frequency: freq, constellation: 'GLONASS', band: 'L5', isDualFrequency: true };
  }

  if (Math.abs(freq - CARRIER_FREQUENCIES_MHZ.GALILEO_E1) <= tolerance) {
    return { frequency: freq, constellation: 'GALILEO', band: 'E1', isDualFrequency: false };
  }
  if (Math.abs(freq - CARRIER_FREQUENCIES_MHZ.GALILEO_E5a) <= tolerance) {
    return { frequency: freq, constellation: 'GALILEO', band: 'E5a', isDualFrequency: true };
  }
  if (Math.abs(freq - CARRIER_FREQUENCIES_MHZ.GALILEO_E5b) <= tolerance) {
    return { frequency: freq, constellation: 'GALILEO', band: 'E5b', isDualFrequency: true };
  }

  if (Math.abs(freq - CARRIER_FREQUENCIES_MHZ.BEIDOU_B1) <= tolerance) {
    return { frequency: freq, constellation: 'BEIDOU', band: 'B1', isDualFrequency: false };
  }
  if (Math.abs(freq - CARRIER_FREQUENCIES_MHZ.BEIDOU_B2) <= tolerance) {
    return { frequency: freq, constellation: 'BEIDOU', band: 'B2', isDualFrequency: true };
  }
  if (Math.abs(freq - CARRIER_FREQUENCIES_MHZ.BEIDOU_B3) <= tolerance) {
    return { frequency: freq, constellation: 'BEIDOU', band: 'B3', isDualFrequency: true };
  }

  if (Math.abs(freq - CARRIER_FREQUENCIES_MHZ.SBAS_L1) <= tolerance) {
    return { frequency: freq, constellation: 'SBAS', band: 'L1', isDualFrequency: false };
  }
  if (Math.abs(freq - CARRIER_FREQUENCIES_MHZ.SBAS_L5) <= tolerance) {
    return { frequency: freq, constellation: 'SBAS', band: 'L5', isDualFrequency: true };
  }

  return { frequency: freq, constellation: 'UNKNOWN', band: 'UNKNOWN', isDualFrequency: false };
};

type Fix = {
  location: RawLocationEntry;
  measurements: RawMeasurementEntry[];
};

const groupFixes = (): Fix[] => {
  const fixes: Fix[] = [];
  let currentMeasurements: RawMeasurementEntry[] = [];

  rawData.forEach((entry) => {
    if (entry.type === 'measurement') {
      currentMeasurements.push(entry);
    } else {
      fixes.push({
        location: entry,
        measurements: currentMeasurements,
      });
      currentMeasurements = [];
    }
  });

  return fixes.filter((fix) => fix.measurements.length > 0);
};

const toSatelliteInfo = (measurement: RawMeasurementEntry): SatelliteInfo => {
  const constellation = measurement.constellation ?? 'UNKNOWN';
  const cn0 = measurement.cn0DbHz;

  return {
    svid: measurement.svid,
    timeNanos: measurement.timeNanos,
    constellationType: CONSTELLATION_TYPE_MAP[constellation] ?? 0,
    constellationName: constellation,
    cn0DbHz: cn0,
    hasEphemeris: cn0 >= 20,
    hasAlmanac: true,
    usedInFix: cn0 >= 30,
    carrierFrequencyHz: measurement.carrierFrequencyHz,
  };
};

const createGnssStatus = (satellites: SatelliteInfo[]): GnssStatusResult => {
  const cn0Samples = satellites
    .map((sat) => sat.cn0DbHz)
    .filter((value): value is number => typeof value === 'number');

  const averageSignalToNoiseRatio =
    cn0Samples.length > 0
      ? Number((cn0Samples.reduce((sum, value) => sum + value, 0) / cn0Samples.length).toFixed(1))
      : 0;

  const supportedConstellations = Array.from(
    new Set(satellites.map((sat) => sat.constellationName)),
  );

  const carrierFrequenciesMHz = Array.from(
    new Set(
      satellites
        .map((sat) =>
          typeof sat.carrierFrequencyHz === 'number'
            ? Number((sat.carrierFrequencyHz / 1_000_000).toFixed(3))
            : undefined,
        )
        .filter((value): value is number => typeof value === 'number'),
    ),
  ).sort((a, b) => a - b);

  const frequencyBands = carrierFrequenciesMHz.map((freq) => identifyFrequencyBand(freq));
  const satellitesUsedInFix = satellites.filter((sat) => sat.usedInFix).length;

  return {
    isGNSSSupported: satellites.length > 0,
    isDualFrequencySupported: frequencyBands.some((band) => band.isDualFrequency),
    isNavICSupported: supportedConstellations.includes('NAVIC'),
    satellitesVisible: satellites.length,
    satellitesUsedInFix,
    averageSignalToNoiseRatio,
    supportedConstellations,
    carrierFrequencies: carrierFrequenciesMHz,
    frequencyBands,
    satellites,
    apiLevel: 33,
    supportsCn0: cn0Samples.length > 0,
    supportsCarrierFreq: carrierFrequenciesMHz.length > 0,
  };
};

const metresPerSecondToKnots = (speedMps: number): number =>
  Number((speedMps * 1.94384).toFixed(2));

const formatTimestamp = (epochMillis: number): string => new Date(epochMillis).toISOString();

const determineNavStatus = (speedMps: number): 'underway' | 'anchored' | 'moored' => {
  if (speedMps <= 0.3) {
    return 'anchored';
  }
  if (speedMps <= 1.0) {
    return 'moored';
  }
  return 'underway';
};

const determineSeaState = (speedMps: number): 'calm' | 'moderate' | 'rough' => {
  if (speedMps <= 0.5) {
    return 'calm';
  }
  if (speedMps <= 3.0) {
    return 'moderate';
  }
  return 'rough';
};

const fixes = groupFixes();

const routeCoordinates: GeoJSONPosition[] = fixes.map((fix) => [
  fix.location.longitude,
  fix.location.latitude,
]);

const speedKnotsValues = fixes.map((fix) => metresPerSecondToKnots(fix.location.speed));
const avgSpeedKts =
  speedKnotsValues.length > 0
    ? Number(
        (
          speedKnotsValues.reduce((sum, value) => sum + value, 0) / speedKnotsValues.length
        ).toFixed(2),
      )
    : 0;
const maxSpeedKts =
  speedKnotsValues.length > 0 ? Math.max(...speedKnotsValues) : 0;

const firstFixTime = fixes[0]?.location.time;
const lastFixTime = fixes[fixes.length - 1]?.location.time;

const overallSatellites = fixes.flatMap((fix) => fix.measurements.map(toSatelliteInfo));
const overallStatus = createGnssStatus(overallSatellites);

export interface GnssFixDetail {
  fixIndex: number;
  timestamp: string;
  coordinate: GeoJSONPosition;
  speedMps: number;
  speedKts: number;
  accuracyM: number;
  altitudeM: number;
  seaState: 'calm' | 'moderate' | 'rough';
  navStatus: 'underway' | 'anchored' | 'moored';
  status: GnssStatusResult;
}

export type GnssFeatureProperties = {
  trackId: string;
  vesselName: string;
  vesselType: 'research';
  legName: string;
  startTime: string;
  endTime: string;
  avgSpeedKts: number;
  maxSpeedKts: number;
  fixIndex?: number;
  timestamp?: string;
  speedMps?: number;
  speedKts?: number;
  accuracyM?: number;
  altitudeM?: number;
  seaState?: 'calm' | 'moderate' | 'rough';
  navStatus?: 'underway' | 'anchored' | 'moored';
  gnssAvgCn0?: number;
  gnssSatVisible?: number;
  gnssSatUsed?: number;
  gnssConstellationCount?: number;
};

const fixDetails: GnssFixDetail[] = fixes.map((fix, index) => {
  const satellites = fix.measurements.map(toSatelliteInfo);
  const status = createGnssStatus(satellites);
  const speedMps = Number(fix.location.speed.toFixed(2));
  const speedKts = metresPerSecondToKnots(fix.location.speed);

  return {
    fixIndex: index,
    timestamp: formatTimestamp(fix.location.time),
    coordinate: [fix.location.longitude, fix.location.latitude],
    speedMps,
    speedKts,
    accuracyM: Number(fix.location.accuracy.toFixed(2)),
    altitudeM: Number(fix.location.altitude.toFixed(2)),
    seaState: determineSeaState(fix.location.speed),
    navStatus: determineNavStatus(fix.location.speed),
    status,
  };
});

const baseProperties = {
  trackId: 'native-module-log-track',
  vesselName: 'Logged GNSS Device',
  vesselType: 'research',
  legName: 'Onboard GNSS Capture',
  startTime: firstFixTime ? formatTimestamp(firstFixTime) : '',
  endTime: lastFixTime ? formatTimestamp(lastFixTime) : '',
  avgSpeedKts,
  maxSpeedKts,
} as const;

const lineFeature: Feature<LineString, GnssFeatureProperties> = {
  type: 'Feature',
  geometry: {
    type: 'LineString',
    coordinates: routeCoordinates,
  },
  properties: {
    ...baseProperties,
    gnssAvgCn0: overallStatus.averageSignalToNoiseRatio,
    gnssSatVisible: overallStatus.satellitesVisible,
    gnssSatUsed: overallStatus.satellitesUsedInFix,
    gnssConstellationCount: overallStatus.supportedConstellations.length,
  },
};

const pointFeatures: Array<Feature<Point, GnssFeatureProperties>> = fixDetails.map((detail) => ({
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: detail.coordinate,
  },
  properties: {
    ...baseProperties,
    fixIndex: detail.fixIndex,
    timestamp: detail.timestamp,
    speedMps: detail.speedMps,
    speedKts: detail.speedKts,
    accuracyM: detail.accuracyM,
    altitudeM: detail.altitudeM,
    seaState: detail.seaState,
    navStatus: detail.navStatus,
    gnssAvgCn0: detail.status.averageSignalToNoiseRatio,
    gnssSatVisible: detail.status.satellitesVisible,
    gnssSatUsed: detail.status.satellitesUsedInFix,
    gnssConstellationCount: detail.status.supportedConstellations.length,
  },
}));

export const gnssMockFixes: FeatureCollection<LineString | Point, GnssFeatureProperties> = {
  type: 'FeatureCollection',
  features: [lineFeature, ...pointFeatures],
};

export const gnssFixDetails: GnssFixDetail[] = fixDetails;
