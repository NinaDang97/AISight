export type ConstellationName =
  | 'GPS'
  | 'GLONASS'
  | 'GALILEO'
  | 'BEIDOU'
  | 'QZSS'
  | 'NAVIC'
  | 'SBAS'
  | 'UNKNOWN';

export interface FrequencyBandInfo {
  frequency: number;
  constellation: ConstellationName;
  band: string;
  isDualFrequency: boolean;
}

export const CONSTELLATION_TYPE_MAP: Record<ConstellationName, number> = {
  UNKNOWN: 0,
  GPS: 1,
  SBAS: 2,
  GLONASS: 3,
  QZSS: 4,
  BEIDOU: 5,
  GALILEO: 6,
  NAVIC: 7,
};

export const CARRIER_FREQUENCIES_BAND: Record<string, FrequencyBandInfo> = {
  GPS_L1: {
    constellation: 'GPS',
    frequency: 1575.42,
    band: 'L1',
    isDualFrequency: false
  },
  GPS_L2: {
    constellation: 'GPS',
    frequency: 1227.6,
    band: 'L2',
    isDualFrequency: true
  },
  GPS_L5: {
    constellation: 'GPS',
    frequency: 1176.45,
    band: 'L5',
    isDualFrequency: true
  },
  GLONASS_L1_CENTER: {
    constellation: 'GLONASS',
    frequency: 1602.0,
    band: 'L1',
    isDualFrequency: false
  },
  GLONASS_L2_CENTER: {
    constellation: 'GLONASS',
    frequency: 1246.0,
    band: 'L2',
    isDualFrequency: true
  },
  GLONASS_L5: {
    constellation: 'GLONASS',
    frequency: 1176.45,
    band: 'L5',
    isDualFrequency: true
  },
  GALILEO_E1: {
    constellation: 'GALILEO',
    frequency: 1575.42,
    band: 'E1',
    isDualFrequency: false
  },
  GALILEO_E5a: {
    constellation: 'GALILEO',
    frequency: 1176.45,
    band: 'E5a',
    isDualFrequency: true
  },
  GALILEO_E5b: {
    constellation: 'GALILEO',
    frequency: 1207.14,
    band: 'E5b',
    isDualFrequency: true
  },
  BEIDOU_B1: {
    constellation: 'BEIDOU',
    frequency: 1561.098,
    band: 'B1',
    isDualFrequency: false
  },
  BEIDOU_B2: {
    constellation: 'BEIDOU',
    frequency: 1207.14,
    band: 'B2',
    isDualFrequency: true
  },
  BEIDOU_B3: {
    constellation: 'BEIDOU',
    frequency: 1268.52,
    band: 'B3',
    isDualFrequency: true
  },
  UNKNOWN: {
    constellation: 'UNKNOWN',
    frequency: 0,
    band: 'UNKNOWN',
    isDualFrequency: false
  }
} as const;
