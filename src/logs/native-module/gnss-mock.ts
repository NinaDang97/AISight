import type {
  Feature,
  FeatureCollection,
  LineString,
  Point,
  Position as GeoJSONPosition,
} from 'geojson';
import rawGnssLog from './gnss_raw.json';
import { CARRIER_FREQUENCIES_BAND, CONSTELLATION_TYPE_MAP, ConstellationName, FrequencyBandInfo } from '../../constants/Constellations';

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
  cn0DbHz: number;
  carrierFrequencyHz: number;
  // Calculated fields below
  hasEphemeris: boolean;
  hasAlmanac: boolean;
  usedInFix: boolean;
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

const identifyFrequencyBand = (
  frequencyMHz: number,
  tolerance: number = 1.0,
): FrequencyBandInfo => {
  const freq = frequencyMHz;
  if (Math.abs(freq - CARRIER_FREQUENCIES_BAND.GPS_L1.frequency) <= tolerance) {
    return CARRIER_FREQUENCIES_BAND.GPS_L1;
  }
  if (Math.abs(freq - CARRIER_FREQUENCIES_BAND.GPS_L2.frequency) <= tolerance) {
    return CARRIER_FREQUENCIES_BAND.GPS_L2;
  }
  if (Math.abs(freq - CARRIER_FREQUENCIES_BAND.GPS_L5.frequency) <= tolerance) {
    return CARRIER_FREQUENCIES_BAND.GPS_L5;
  }

  if (Math.abs(freq - CARRIER_FREQUENCIES_BAND.GLONASS_L1_CENTER.frequency) <= tolerance) {
    return CARRIER_FREQUENCIES_BAND.GLONASS_L1_CENTER;
  }
  if (Math.abs(freq - CARRIER_FREQUENCIES_BAND.GLONASS_L2_CENTER.frequency) <= tolerance) {
    return CARRIER_FREQUENCIES_BAND.GLONASS_L2_CENTER;
  }
  if (Math.abs(freq - CARRIER_FREQUENCIES_BAND.GLONASS_L5.frequency) <= tolerance) {
    return CARRIER_FREQUENCIES_BAND.GLONASS_L5;
  }

  if (Math.abs(freq - CARRIER_FREQUENCIES_BAND.GALILEO_E1.frequency) <= tolerance) {
    return CARRIER_FREQUENCIES_BAND.GALILEO_E1;
  }
  if (Math.abs(freq - CARRIER_FREQUENCIES_BAND.GALILEO_E5a.frequency) <= tolerance) {
    return CARRIER_FREQUENCIES_BAND.GALILEO_E5a;
  }
  if (Math.abs(freq - CARRIER_FREQUENCIES_BAND.GALILEO_E5b.frequency) <= tolerance) {
    return CARRIER_FREQUENCIES_BAND.GALILEO_E5b;
  }

  if (Math.abs(freq - CARRIER_FREQUENCIES_BAND.BEIDOU_B1.frequency) <= tolerance) {
    return CARRIER_FREQUENCIES_BAND.BEIDOU_B1;
  }
  if (Math.abs(freq - CARRIER_FREQUENCIES_BAND.BEIDOU_B2.frequency) <= tolerance) {
    return CARRIER_FREQUENCIES_BAND.BEIDOU_B2;
  }
  if (Math.abs(freq - CARRIER_FREQUENCIES_BAND.BEIDOU_B3.frequency) <= tolerance) {
    return CARRIER_FREQUENCIES_BAND.BEIDOU_B3;
  }

  return CARRIER_FREQUENCIES_BAND.UNKNOWN;
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
  const { svid, constellation, timeNanos, cn0DbHz, carrierFrequencyHz } = measurement;

  return {
    svid: svid,
    timeNanos: timeNanos,
    constellationType: CONSTELLATION_TYPE_MAP[constellation ?? 0],
    constellationName: constellation ?? 'UNKNOWN',
    cn0DbHz: cn0DbHz,
    carrierFrequencyHz: carrierFrequencyHz,
    hasEphemeris: cn0DbHz >= 20,
    hasAlmanac: true,
    usedInFix: cn0DbHz >= 30,
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
