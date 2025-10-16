import type { Feature, FeatureCollection, LineString, Point } from 'geojson';

type ConstellationName = 'GPS' | 'GLONASS' | 'GALILEO' | 'BEIDOU' | 'QZSS' | 'NAVIC' | 'SBAS';

export interface SatelliteInfo {
  svid: number;
  constellationType: number;
  constellationName: ConstellationName | 'UNKNOWN';
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
  constellation: ConstellationName | 'UNKNOWN';
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
  supportedConstellations: (ConstellationName | 'UNKNOWN')[];
  carrierFrequencies: number[];
  frequencyBands: FrequencyBandInfo[];
  satellites: SatelliteInfo[];
  apiLevel?: number;
  supportsCn0?: boolean;
  supportsCarrierFreq?: boolean;
}

const GNSS_CONSTELLATIONS: Record<ConstellationName, number> = {
  GPS: 1,
  GLONASS: 3,
  GALILEO: 6,
  BEIDOU: 5,
  QZSS: 4,
  NAVIC: 7,
  SBAS: 2,
};

const CARRIER_FREQUENCIES = {
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

  if (Math.abs(freq - CARRIER_FREQUENCIES.GPS_L1) <= tolerance) {
    return { frequency: freq, constellation: 'GPS', band: 'L1', isDualFrequency: false };
  }
  if (Math.abs(freq - CARRIER_FREQUENCIES.GPS_L2) <= tolerance) {
    return { frequency: freq, constellation: 'GPS', band: 'L2', isDualFrequency: true };
  }
  if (Math.abs(freq - CARRIER_FREQUENCIES.GPS_L5) <= tolerance) {
    return { frequency: freq, constellation: 'GPS', band: 'L5', isDualFrequency: true };
  }

  if (Math.abs(freq - CARRIER_FREQUENCIES.GLONASS_L1_CENTER) <= tolerance) {
    return { frequency: freq, constellation: 'GLONASS', band: 'L1', isDualFrequency: false };
  }
  if (Math.abs(freq - CARRIER_FREQUENCIES.GLONASS_L2_CENTER) <= tolerance) {
    return { frequency: freq, constellation: 'GLONASS', band: 'L2', isDualFrequency: true };
  }
  if (Math.abs(freq - CARRIER_FREQUENCIES.GLONASS_L5) <= tolerance) {
    return { frequency: freq, constellation: 'GLONASS', band: 'L5', isDualFrequency: true };
  }

  if (Math.abs(freq - CARRIER_FREQUENCIES.GALILEO_E1) <= tolerance) {
    return { frequency: freq, constellation: 'GALILEO', band: 'E1', isDualFrequency: false };
  }
  if (Math.abs(freq - CARRIER_FREQUENCIES.GALILEO_E5a) <= tolerance) {
    return { frequency: freq, constellation: 'GALILEO', band: 'E5a', isDualFrequency: true };
  }
  if (Math.abs(freq - CARRIER_FREQUENCIES.GALILEO_E5b) <= tolerance) {
    return { frequency: freq, constellation: 'GALILEO', band: 'E5b', isDualFrequency: true };
  }

  if (Math.abs(freq - CARRIER_FREQUENCIES.BEIDOU_B1) <= tolerance) {
    return { frequency: freq, constellation: 'BEIDOU', band: 'B1', isDualFrequency: false };
  }
  if (Math.abs(freq - CARRIER_FREQUENCIES.BEIDOU_B2) <= tolerance) {
    return { frequency: freq, constellation: 'BEIDOU', band: 'B2', isDualFrequency: true };
  }
  if (Math.abs(freq - CARRIER_FREQUENCIES.BEIDOU_B3) <= tolerance) {
    return { frequency: freq, constellation: 'BEIDOU', band: 'B3', isDualFrequency: true };
  }

  if (Math.abs(freq - CARRIER_FREQUENCIES.SBAS_L1) <= tolerance) {
    return { frequency: freq, constellation: 'SBAS', band: 'L1', isDualFrequency: false };
  }
  if (Math.abs(freq - CARRIER_FREQUENCIES.SBAS_L5) <= tolerance) {
    return { frequency: freq, constellation: 'SBAS', band: 'L5', isDualFrequency: true };
  }

  return { frequency: freq, constellation: 'UNKNOWN', band: 'UNKNOWN', isDualFrequency: false };
};

type SatelliteSample = {
  svid: number;
  constellation: ConstellationName;
  cn0DbHz: number;
  elevation: number;
  azimuth: number;
  usedInFix: boolean;
  carrierFrequencyMHz: number;
};

const toSatelliteInfo = (sample: SatelliteSample): SatelliteInfo => ({
  svid: sample.svid,
  constellationType: GNSS_CONSTELLATIONS[sample.constellation],
  constellationName: sample.constellation,
  cn0DbHz: sample.cn0DbHz,
  elevation: sample.elevation,
  azimuth: sample.azimuth,
  hasEphemeris: sample.usedInFix || sample.cn0DbHz >= 30,
  hasAlmanac: true,
  usedInFix: sample.usedInFix,
  carrierFrequencyHz: sample.carrierFrequencyMHz * 1_000_000,
});

const createStatus = (satellites: SatelliteInfo[]): GnssStatusResult => {
  const cn0Samples = satellites
    .map((sat) => sat.cn0DbHz)
    .filter((value): value is number => value !== undefined);

  const supportedConstellations = Array.from(
    new Set(satellites.map((sat) => sat.constellationName)),
  );

  const carrierFrequenciesSet = new Set<number>();
  satellites.forEach((sat) => {
    if (sat.carrierFrequencyHz) {
      carrierFrequenciesSet.add(Number((sat.carrierFrequencyHz / 1_000_000).toFixed(3)));
    }
  });
  const carrierFrequencies = Array.from(carrierFrequenciesSet).sort((a, b) => a - b);
  const frequencyBands = carrierFrequencies.map((freq) => identifyFrequencyBand(freq));
  const dualFrequencyDetected = frequencyBands.some((band) => band.isDualFrequency);

  const averageSignalToNoiseRatio =
    cn0Samples.length > 0
      ? Number((cn0Samples.reduce((sum, value) => sum + value, 0) / cn0Samples.length).toFixed(1))
      : 0;

  return {
    isGNSSSupported: true,
    isDualFrequencySupported: dualFrequencyDetected,
    isNavICSupported: supportedConstellations.includes('NAVIC'),
    satellitesVisible: satellites.length,
    satellitesUsedInFix: satellites.filter((sat) => sat.usedInFix).length,
    averageSignalToNoiseRatio,
    supportedConstellations,
    carrierFrequencies,
    frequencyBands,
    satellites,
    apiLevel: 33,
    supportsCn0: cn0Samples.length > 0,
    supportsCarrierFreq: carrierFrequencies.length > 0,
  };
};

type TrackPoint = {
  coord: [number, number];
  timestamp: string;
  speedKts: number;
  courseOverGround: number;
  headingTrue: number;
  hdop: number;
  vdop: number;
  pdop: number;
  seaState: 'calm' | 'moderate' | 'rough';
  navStatus: 'underway' | 'anchored' | 'moored';
  satellites: SatelliteSample[];
};

type TrackDefinition = {
  trackId: string;
  vesselName: string;
  vesselType: 'cargo' | 'tanker' | 'passenger' | 'patrol';
  legName: string;
  startTime: string;
  endTime: string;
  avgSpeedKts: number;
  maxSpeedKts: number;
  route: [number, number][];
  points: TrackPoint[];
};

const tracks: TrackDefinition[] = [
  {
    trackId: 'finland-gulf-run',
    vesselName: 'MV Baltic Breeze',
    vesselType: 'cargo',
    legName: 'Helsinki to Tallinn',
    startTime: '2024-03-25T08:00:00Z',
    endTime: '2024-03-25T10:10:00Z',
    avgSpeedKts: 15.4,
    maxSpeedKts: 17.2,
    route: [
      [24.96338, 60.16103],
      [25.10628, 60.05571],
      [25.30044, 59.94555],
      [25.29607, 59.79421],
      [24.89462, 59.50741],
      [24.72991, 59.44537],
    ],
    points: [
      {
        coord: [24.96338, 60.16103],
        timestamp: '2024-03-25T08:00:00Z',
        speedKts: 0.8,
        courseOverGround: 172,
        headingTrue: 175,
        hdop: 0.7,
        vdop: 1.1,
        pdop: 1.3,
        seaState: 'calm',
        navStatus: 'moored',
        satellites: [
          {
            svid: 3,
            constellation: 'GPS',
            cn0DbHz: 39,
            elevation: 61,
            azimuth: 107,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L1,
          },
          {
            svid: 9,
            constellation: 'GPS',
            cn0DbHz: 42,
            elevation: 47,
            azimuth: 214,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L5,
          },
          {
            svid: 15,
            constellation: 'GLONASS',
            cn0DbHz: 33,
            elevation: 23,
            azimuth: 322,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GLONASS_L1_CENTER,
          },
          {
            svid: 21,
            constellation: 'GALILEO',
            cn0DbHz: 30,
            elevation: 18,
            azimuth: 48,
            usedInFix: false,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GALILEO_E1,
          },
        ],
      },
      {
        coord: [25.10628, 60.05571],
        timestamp: '2024-03-25T08:30:00Z',
        speedKts: 12.4,
        courseOverGround: 160,
        headingTrue: 163,
        hdop: 0.6,
        vdop: 0.9,
        pdop: 1.2,
        seaState: 'calm',
        navStatus: 'underway',
        satellites: [
          {
            svid: 3,
            constellation: 'GPS',
            cn0DbHz: 41,
            elevation: 63,
            azimuth: 109,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L1,
          },
          {
            svid: 9,
            constellation: 'GPS',
            cn0DbHz: 44,
            elevation: 49,
            azimuth: 216,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L5,
          },
          {
            svid: 15,
            constellation: 'GLONASS',
            cn0DbHz: 35,
            elevation: 26,
            azimuth: 325,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GLONASS_L2_CENTER,
          },
          {
            svid: 5,
            constellation: 'BEIDOU',
            cn0DbHz: 28,
            elevation: 19,
            azimuth: 61,
            usedInFix: false,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.BEIDOU_B1,
          },
        ],
      },
      {
        coord: [25.30044, 59.94555],
        timestamp: '2024-03-25T09:00:00Z',
        speedKts: 15.2,
        courseOverGround: 181,
        headingTrue: 184,
        hdop: 0.7,
        vdop: 1.0,
        pdop: 1.3,
        seaState: 'moderate',
        navStatus: 'underway',
        satellites: [
          {
            svid: 3,
            constellation: 'GPS',
            cn0DbHz: 40,
            elevation: 58,
            azimuth: 115,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L1,
          },
          {
            svid: 9,
            constellation: 'GPS',
            cn0DbHz: 42,
            elevation: 46,
            azimuth: 224,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L5,
          },
          {
            svid: 15,
            constellation: 'GLONASS',
            cn0DbHz: 34,
            elevation: 28,
            azimuth: 333,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GLONASS_L2_CENTER,
          },
          {
            svid: 11,
            constellation: 'GALILEO',
            cn0DbHz: 31,
            elevation: 20,
            azimuth: 70,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GALILEO_E5a,
          },
        ],
      },
      {
        coord: [25.29607, 59.79421],
        timestamp: '2024-03-25T09:30:00Z',
        speedKts: 16.8,
        courseOverGround: 197,
        headingTrue: 200,
        hdop: 0.9,
        vdop: 1.3,
        pdop: 1.6,
        seaState: 'moderate',
        navStatus: 'underway',
        satellites: [
          {
            svid: 3,
            constellation: 'GPS',
            cn0DbHz: 37,
            elevation: 54,
            azimuth: 118,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L1,
          },
          {
            svid: 9,
            constellation: 'GPS',
            cn0DbHz: 40,
            elevation: 42,
            azimuth: 229,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L5,
          },
          {
            svid: 15,
            constellation: 'GLONASS',
            cn0DbHz: 33,
            elevation: 24,
            azimuth: 339,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GLONASS_L2_CENTER,
          },
          {
            svid: 5,
            constellation: 'BEIDOU',
            cn0DbHz: 26,
            elevation: 17,
            azimuth: 75,
            usedInFix: false,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.BEIDOU_B1,
          },
        ],
      },
      {
        coord: [24.89462, 59.50741],
        timestamp: '2024-03-25T09:50:00Z',
        speedKts: 15.9,
        courseOverGround: 222,
        headingTrue: 225,
        hdop: 1.0,
        vdop: 1.4,
        pdop: 1.8,
        seaState: 'moderate',
        navStatus: 'underway',
        satellites: [
          {
            svid: 3,
            constellation: 'GPS',
            cn0DbHz: 36,
            elevation: 48,
            azimuth: 124,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L1,
          },
          {
            svid: 9,
            constellation: 'GPS',
            cn0DbHz: 38,
            elevation: 37,
            azimuth: 236,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L5,
          },
          {
            svid: 15,
            constellation: 'GLONASS',
            cn0DbHz: 31,
            elevation: 21,
            azimuth: 346,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GLONASS_L2_CENTER,
          },
          {
            svid: 21,
            constellation: 'GALILEO',
            cn0DbHz: 28,
            elevation: 19,
            azimuth: 82,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GALILEO_E1,
          },
        ],
      },
      {
        coord: [24.72991, 59.44537],
        timestamp: '2024-03-25T10:10:00Z',
        speedKts: 4.2,
        courseOverGround: 245,
        headingTrue: 248,
        hdop: 1.1,
        vdop: 1.6,
        pdop: 1.9,
        seaState: 'calm',
        navStatus: 'anchored',
        satellites: [
          {
            svid: 3,
            constellation: 'GPS',
            cn0DbHz: 34,
            elevation: 45,
            azimuth: 128,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L1,
          },
          {
            svid: 9,
            constellation: 'GPS',
            cn0DbHz: 37,
            elevation: 33,
            azimuth: 240,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L5,
          },
          {
            svid: 15,
            constellation: 'GLONASS',
            cn0DbHz: 29,
            elevation: 18,
            azimuth: 351,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GLONASS_L1_CENTER,
          },
          {
            svid: 11,
            constellation: 'GALILEO',
            cn0DbHz: 27,
            elevation: 16,
            azimuth: 89,
            usedInFix: false,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GALILEO_E1,
          },
        ],
      },
    ],
  },
  {
    trackId: 'sweden-archipelago-survey',
    vesselName: 'RV Sea Explorer',
    vesselType: 'patrol',
    legName: 'Stockholm Shipping Lane Survey',
    startTime: '2024-04-03T05:40:00Z',
    endTime: '2024-04-03T08:05:00Z',
    avgSpeedKts: 11.8,
    maxSpeedKts: 14.6,
    route: [
      [18.96312, 59.31706],
      [19.11892, 59.3516],
      [19.39581, 59.44231],
      [19.67692, 59.58542],
      [20.12617, 59.77501],
      [20.51784, 59.95278],
      [20.81273, 60.12597],
    ],
    points: [
      {
        coord: [18.96312, 59.31706],
        timestamp: '2024-04-03T05:40:00Z',
        speedKts: 2.1,
        courseOverGround: 31,
        headingTrue: 35,
        hdop: 0.8,
        vdop: 1.2,
        pdop: 1.5,
        seaState: 'calm',
        navStatus: 'moored',
        satellites: [
          {
            svid: 4,
            constellation: 'GPS',
            cn0DbHz: 38,
            elevation: 58,
            azimuth: 142,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L1,
          },
          {
            svid: 12,
            constellation: 'GPS',
            cn0DbHz: 40,
            elevation: 44,
            azimuth: 238,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L5,
          },
          {
            svid: 18,
            constellation: 'GLONASS',
            cn0DbHz: 32,
            elevation: 21,
            azimuth: 19,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GLONASS_L1_CENTER,
          },
          {
            svid: 30,
            constellation: 'GALILEO',
            cn0DbHz: 28,
            elevation: 17,
            azimuth: 91,
            usedInFix: false,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GALILEO_E1,
          },
        ],
      },
      {
        coord: [19.11892, 59.3516],
        timestamp: '2024-04-03T06:05:00Z',
        speedKts: 9.6,
        courseOverGround: 58,
        headingTrue: 60,
        hdop: 0.7,
        vdop: 1.0,
        pdop: 1.2,
        seaState: 'moderate',
        navStatus: 'underway',
        satellites: [
          {
            svid: 4,
            constellation: 'GPS',
            cn0DbHz: 39,
            elevation: 60,
            azimuth: 145,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L1,
          },
          {
            svid: 12,
            constellation: 'GPS',
            cn0DbHz: 42,
            elevation: 46,
            azimuth: 241,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L5,
          },
          {
            svid: 18,
            constellation: 'GLONASS',
            cn0DbHz: 34,
            elevation: 24,
            azimuth: 23,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GLONASS_L2_CENTER,
          },
          {
            svid: 8,
            constellation: 'BEIDOU',
            cn0DbHz: 27,
            elevation: 19,
            azimuth: 102,
            usedInFix: false,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.BEIDOU_B1,
          },
        ],
      },
      {
        coord: [19.39581, 59.44231],
        timestamp: '2024-04-03T06:30:00Z',
        speedKts: 11.4,
        courseOverGround: 72,
        headingTrue: 74,
        hdop: 0.7,
        vdop: 1.0,
        pdop: 1.3,
        seaState: 'moderate',
        navStatus: 'underway',
        satellites: [
          {
            svid: 4,
            constellation: 'GPS',
            cn0DbHz: 41,
            elevation: 57,
            azimuth: 151,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L1,
          },
          {
            svid: 12,
            constellation: 'GPS',
            cn0DbHz: 43,
            elevation: 43,
            azimuth: 247,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L5,
          },
          {
            svid: 18,
            constellation: 'GLONASS',
            cn0DbHz: 35,
            elevation: 26,
            azimuth: 32,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GLONASS_L2_CENTER,
          },
          {
            svid: 30,
            constellation: 'GALILEO',
            cn0DbHz: 30,
            elevation: 21,
            azimuth: 111,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GALILEO_E5a,
          },
        ],
      },
      {
        coord: [19.67692, 59.58542],
        timestamp: '2024-04-03T06:55:00Z',
        speedKts: 13.7,
        courseOverGround: 58,
        headingTrue: 60,
        hdop: 0.8,
        vdop: 1.1,
        pdop: 1.4,
        seaState: 'moderate',
        navStatus: 'underway',
        satellites: [
          {
            svid: 4,
            constellation: 'GPS',
            cn0DbHz: 40,
            elevation: 54,
            azimuth: 156,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L1,
          },
          {
            svid: 12,
            constellation: 'GPS',
            cn0DbHz: 41,
            elevation: 40,
            azimuth: 252,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L5,
          },
          {
            svid: 18,
            constellation: 'GLONASS',
            cn0DbHz: 34,
            elevation: 23,
            azimuth: 39,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GLONASS_L2_CENTER,
          },
          {
            svid: 8,
            constellation: 'BEIDOU',
            cn0DbHz: 26,
            elevation: 18,
            azimuth: 117,
            usedInFix: false,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.BEIDOU_B1,
          },
        ],
      },
      {
        coord: [20.12617, 59.77501],
        timestamp: '2024-04-03T07:20:00Z',
        speedKts: 14.6,
        courseOverGround: 49,
        headingTrue: 51,
        hdop: 0.9,
        vdop: 1.3,
        pdop: 1.7,
        seaState: 'rough',
        navStatus: 'underway',
        satellites: [
          {
            svid: 4,
            constellation: 'GPS',
            cn0DbHz: 38,
            elevation: 50,
            azimuth: 163,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L1,
          },
          {
            svid: 12,
            constellation: 'GPS',
            cn0DbHz: 39,
            elevation: 37,
            azimuth: 259,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L5,
          },
          {
            svid: 18,
            constellation: 'GLONASS',
            cn0DbHz: 33,
            elevation: 21,
            azimuth: 47,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GLONASS_L2_CENTER,
          },
          {
            svid: 30,
            constellation: 'GALILEO',
            cn0DbHz: 28,
            elevation: 20,
            azimuth: 126,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GALILEO_E5b,
          },
        ],
      },
      {
        coord: [20.51784, 59.95278],
        timestamp: '2024-04-03T07:45:00Z',
        speedKts: 12.8,
        courseOverGround: 41,
        headingTrue: 44,
        hdop: 1.0,
        vdop: 1.3,
        pdop: 1.8,
        seaState: 'rough',
        navStatus: 'underway',
        satellites: [
          {
            svid: 4,
            constellation: 'GPS',
            cn0DbHz: 36,
            elevation: 46,
            azimuth: 169,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L1,
          },
          {
            svid: 12,
            constellation: 'GPS',
            cn0DbHz: 37,
            elevation: 33,
            azimuth: 265,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L5,
          },
          {
            svid: 18,
            constellation: 'GLONASS',
            cn0DbHz: 31,
            elevation: 19,
            azimuth: 55,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GLONASS_L2_CENTER,
          },
          {
            svid: 8,
            constellation: 'BEIDOU',
            cn0DbHz: 25,
            elevation: 17,
            azimuth: 136,
            usedInFix: false,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.BEIDOU_B1,
          },
        ],
      },
      {
        coord: [20.81273, 60.12597],
        timestamp: '2024-04-03T08:05:00Z',
        speedKts: 3.9,
        courseOverGround: 18,
        headingTrue: 20,
        hdop: 1.2,
        vdop: 1.5,
        pdop: 2.0,
        seaState: 'moderate',
        navStatus: 'anchored',
        satellites: [
          {
            svid: 4,
            constellation: 'GPS',
            cn0DbHz: 35,
            elevation: 43,
            azimuth: 175,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L1,
          },
          {
            svid: 12,
            constellation: 'GPS',
            cn0DbHz: 36,
            elevation: 30,
            azimuth: 272,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L5,
          },
          {
            svid: 18,
            constellation: 'GLONASS',
            cn0DbHz: 30,
            elevation: 18,
            azimuth: 62,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GLONASS_L1_CENTER,
          },
          {
            svid: 30,
            constellation: 'GALILEO',
            cn0DbHz: 27,
            elevation: 16,
            azimuth: 144,
            usedInFix: false,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GALILEO_E1,
          },
        ],
      },
    ],
  },
  {
    trackId: 'kattegat-night-transit',
    vesselName: 'MS Nordic Star',
    vesselType: 'passenger',
    legName: 'Aarhus to Gothenburg Night Transit',
    startTime: '2024-05-12T21:50:00Z',
    endTime: '2024-05-13T01:30:00Z',
    avgSpeedKts: 18.1,
    maxSpeedKts: 20.4,
    route: [
      [10.86154, 56.15121],
      [11.14732, 56.32097],
      [11.53602, 56.67744],
      [11.98284, 57.04581],
      [12.24561, 57.36173],
      [12.02642, 57.70379],
    ],
    points: [
      {
        coord: [10.86154, 56.15121],
        timestamp: '2024-05-12T21:50:00Z',
        speedKts: 0.5,
        courseOverGround: 12,
        headingTrue: 15,
        hdop: 0.9,
        vdop: 1.4,
        pdop: 1.8,
        seaState: 'calm',
        navStatus: 'moored',
        satellites: [
          {
            svid: 6,
            constellation: 'GPS',
            cn0DbHz: 37,
            elevation: 52,
            azimuth: 132,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L1,
          },
          {
            svid: 14,
            constellation: 'GPS',
            cn0DbHz: 39,
            elevation: 40,
            azimuth: 238,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L5,
          },
          {
            svid: 22,
            constellation: 'GLONASS',
            cn0DbHz: 31,
            elevation: 19,
            azimuth: 23,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GLONASS_L1_CENTER,
          },
          {
            svid: 33,
            constellation: 'GALILEO',
            cn0DbHz: 27,
            elevation: 17,
            azimuth: 84,
            usedInFix: false,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GALILEO_E1,
          },
        ],
      },
      {
        coord: [11.14732, 56.32097],
        timestamp: '2024-05-12T22:35:00Z',
        speedKts: 16.7,
        courseOverGround: 40,
        headingTrue: 43,
        hdop: 0.8,
        vdop: 1.1,
        pdop: 1.4,
        seaState: 'calm',
        navStatus: 'underway',
        satellites: [
          {
            svid: 6,
            constellation: 'GPS',
            cn0DbHz: 38,
            elevation: 55,
            azimuth: 135,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L1,
          },
          {
            svid: 14,
            constellation: 'GPS',
            cn0DbHz: 41,
            elevation: 43,
            azimuth: 242,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L5,
          },
          {
            svid: 22,
            constellation: 'GLONASS',
            cn0DbHz: 33,
            elevation: 22,
            azimuth: 30,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GLONASS_L2_CENTER,
          },
          {
            svid: 16,
            constellation: 'BEIDOU',
            cn0DbHz: 26,
            elevation: 18,
            azimuth: 98,
            usedInFix: false,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.BEIDOU_B1,
          },
        ],
      },
      {
        coord: [11.53602, 56.67744],
        timestamp: '2024-05-12T23:20:00Z',
        speedKts: 18.2,
        courseOverGround: 31,
        headingTrue: 34,
        hdop: 0.8,
        vdop: 1.0,
        pdop: 1.3,
        seaState: 'moderate',
        navStatus: 'underway',
        satellites: [
          {
            svid: 6,
            constellation: 'GPS',
            cn0DbHz: 40,
            elevation: 58,
            azimuth: 139,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L1,
          },
          {
            svid: 14,
            constellation: 'GPS',
            cn0DbHz: 42,
            elevation: 45,
            azimuth: 246,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L5,
          },
          {
            svid: 22,
            constellation: 'GLONASS',
            cn0DbHz: 34,
            elevation: 25,
            azimuth: 36,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GLONASS_L2_CENTER,
          },
          {
            svid: 33,
            constellation: 'GALILEO',
            cn0DbHz: 29,
            elevation: 19,
            azimuth: 104,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GALILEO_E5a,
          },
        ],
      },
      {
        coord: [11.98284, 57.04581],
        timestamp: '2024-05-13T00:05:00Z',
        speedKts: 19.8,
        courseOverGround: 29,
        headingTrue: 31,
        hdop: 0.9,
        vdop: 1.2,
        pdop: 1.6,
        seaState: 'moderate',
        navStatus: 'underway',
        satellites: [
          {
            svid: 6,
            constellation: 'GPS',
            cn0DbHz: 39,
            elevation: 54,
            azimuth: 143,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L1,
          },
          {
            svid: 14,
            constellation: 'GPS',
            cn0DbHz: 41,
            elevation: 41,
            azimuth: 250,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L5,
          },
          {
            svid: 22,
            constellation: 'GLONASS',
            cn0DbHz: 33,
            elevation: 21,
            azimuth: 42,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GLONASS_L2_CENTER,
          },
          {
            svid: 16,
            constellation: 'BEIDOU',
            cn0DbHz: 27,
            elevation: 18,
            azimuth: 109,
            usedInFix: false,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.BEIDOU_B1,
          },
        ],
      },
      {
        coord: [12.24561, 57.36173],
        timestamp: '2024-05-13T00:50:00Z',
        speedKts: 20.4,
        courseOverGround: 19,
        headingTrue: 21,
        hdop: 1.0,
        vdop: 1.4,
        pdop: 1.8,
        seaState: 'moderate',
        navStatus: 'underway',
        satellites: [
          {
            svid: 6,
            constellation: 'GPS',
            cn0DbHz: 37,
            elevation: 50,
            azimuth: 147,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L1,
          },
          {
            svid: 14,
            constellation: 'GPS',
            cn0DbHz: 39,
            elevation: 38,
            azimuth: 254,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L5,
          },
          {
            svid: 22,
            constellation: 'GLONASS',
            cn0DbHz: 32,
            elevation: 19,
            azimuth: 47,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GLONASS_L2_CENTER,
          },
          {
            svid: 33,
            constellation: 'GALILEO',
            cn0DbHz: 28,
            elevation: 18,
            azimuth: 117,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GALILEO_E5b,
          },
        ],
      },
      {
        coord: [12.02642, 57.70379],
        timestamp: '2024-05-13T01:30:00Z',
        speedKts: 5.5,
        courseOverGround: 332,
        headingTrue: 335,
        hdop: 1.2,
        vdop: 1.6,
        pdop: 2.1,
        seaState: 'calm',
        navStatus: 'anchored',
        satellites: [
          {
            svid: 6,
            constellation: 'GPS',
            cn0DbHz: 35,
            elevation: 46,
            azimuth: 152,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L1,
          },
          {
            svid: 14,
            constellation: 'GPS',
            cn0DbHz: 37,
            elevation: 34,
            azimuth: 259,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GPS_L5,
          },
          {
            svid: 22,
            constellation: 'GLONASS',
            cn0DbHz: 30,
            elevation: 17,
            azimuth: 52,
            usedInFix: true,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.GLONASS_L1_CENTER,
          },
          {
            svid: 16,
            constellation: 'BEIDOU',
            cn0DbHz: 24,
            elevation: 16,
            azimuth: 126,
            usedInFix: false,
            carrierFrequencyMHz: CARRIER_FREQUENCIES.BEIDOU_B1,
          },
        ],
      },
    ],
  },
];

type GnssFeatureProps = {
  trackId: string;
  vesselName: string;
  vesselType: 'cargo' | 'tanker' | 'passenger' | 'patrol';
  legName: string;
  startTime: string;
  endTime: string;
  avgSpeedKts: number;
  maxSpeedKts: number;
  gnssStatus: GnssStatusResult;
  timestamp?: string;
  fixIndex?: number;
  speedKts?: number;
  courseOverGround?: number;
  headingTrue?: number;
  hdop?: number;
  vdop?: number;
  pdop?: number;
  seaState?: 'calm' | 'moderate' | 'rough';
  navStatus?: 'underway' | 'anchored' | 'moored';
};

const features: Array<Feature<LineString | Point, GnssFeatureProps>> = tracks.flatMap((track) => {
  const {
    trackId,
    vesselName,
    vesselType,
    legName,
    startTime,
    endTime,
    avgSpeedKts,
    maxSpeedKts,
    route,
    points,
  } = track;

  const commonProps = {
    trackId,
    vesselName,
    vesselType,
    legName,
    startTime,
    endTime,
    avgSpeedKts,
    maxSpeedKts,
  } as const;

  const lineStatus = createStatus(points[0].satellites.map(toSatelliteInfo));

  const lineFeature: Feature<LineString, GnssFeatureProps> = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: route,
    },
    properties: {
      ...commonProps,
      gnssStatus: lineStatus,
    },
  };

  const pointFeatures: Array<Feature<Point, GnssFeatureProps>> = points.map((point, index) => {
    const satelliteInfos = point.satellites.map(toSatelliteInfo);
    const status = createStatus(satelliteInfos);

    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: point.coord,
      },
      properties: {
        ...commonProps,
        gnssStatus: status,
        timestamp: point.timestamp,
        fixIndex: index,
        speedKts: point.speedKts,
        courseOverGround: point.courseOverGround,
        headingTrue: point.headingTrue,
        hdop: point.hdop,
        vdop: point.vdop,
        pdop: point.pdop,
        seaState: point.seaState,
        navStatus: point.navStatus,
      },
    };
  });

  return [lineFeature, ...pointFeatures];
});

export const gnssMockFixes: FeatureCollection<LineString | Point, GnssFeatureProps> = {
  type: 'FeatureCollection',
  features,
};
