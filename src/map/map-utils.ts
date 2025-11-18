const FINTRAFFIC_AIS_BASE_URL: string = 'https://meri.digitraffic.fi/api/ais/v1';

// interface definitions for AIS data from FinTraffic API https://meri.digitraffic.fi/swagger/#/AIS%20V1/vesselMetadataByMssi
interface FinTrafficVesselFeatureProperties {
  mmsi: number;
  sog: number;
  cog: number;
  navStat: number;
  rot: number;
  posAcc: boolean;
  raim: boolean;
  heading?: number;
  timestamp: number;
  timestampExternal?: number;
}

interface FinTrafficVesselFeature
  extends GeoJSON.Feature<GeoJSON.Point, FinTrafficVesselFeatureProperties> {
  mmsi: number;
}

export interface FinTrafficVesselFC extends GeoJSON.FeatureCollection {
  dataUpdatedTime: string;
  features: FinTrafficVesselFeature[];
}

export interface VesselMetadataCollection {
  dataFetched: number;
  metadataRecords: Map<number, FinTrafficVesselMetadata>;
}

export interface FinTrafficVesselMetadata {
  name: string;
  timestamp: number;
  destination: string;
  shipType: number; // value between 0-255
  mmsi: number; // Maritime Mobile Service Identity
  imo: number; // International Maritime Organization number
  callSign: string;
  draught: number; // in decimetres, 0 == not available
  eta: number;
  posType: number; // positioning type, values 0-15 e.g. 1 = GPS, 2 = GLONASS, ...
  referencePointA: number;
  referencePointB: number;
  referencePointC: number;
  referencePointD: number;
}

interface VesselFeatureProperties extends FinTrafficVesselFeatureProperties {
  vesselMetadata: FinTrafficVesselMetadata | undefined;
}

interface VesselFeature extends GeoJSON.Feature<GeoJSON.Point, VesselFeatureProperties> {
  mmsi: number;
}

export interface VesselFC extends GeoJSON.FeatureCollection {
  features: VesselFeature[];
}

/**
 *
 * @param currentCenter Center position of the screen as GeoJSON.Position
 * @param visibleBounds
 * @returns
 */
export const makeAisApiUrl = (
  currentCenter: GeoJSON.Position,
  visibleBounds: [GeoJSON.Position, GeoJSON.Position],
  from: number = Date.now() - 120000,
  to: number = Date.now(),
) => {
  // FinTraffic AIS API doesn't support bounding boxes
  const topleft: GeoJSON.Position = visibleBounds[0];
  const radius =
    Math.sqrt(
      Math.pow(topleft[0] - currentCenter[0], 2) + Math.pow(topleft[1] - currentCenter[1], 2),
    ) * 111; // rough conversion to kilometers
  const sourceString = `${FINTRAFFIC_AIS_BASE_URL}/locations?radius=${radius}&latitude=${currentCenter[1]}&longitude=${currentCenter[0]}&from=${from}&to=${to}`;
  return sourceString;
};

export const fetchVessels = async (url: string): Promise<VesselFC> =>
  fetch(url)
    .then(Response => {
      if (!Response.ok) {
        throw new Error(`HTTP response error: ${Response.status}`);
      }
      return Response.json();
    })
    .catch(error => {
      console.error('Error fetching AIS data:', error);
      throw error;
    });

export const fetchMetadataForAllVessels = async (): Promise<VesselMetadataCollection> => {
  const Response = await fetch(`${FINTRAFFIC_AIS_BASE_URL}/vessels`);
  if (!Response.ok) {
    throw new Error(`HTTP response error: ${Response.status}`);
  }

  const metadataArr: FinTrafficVesselMetadata[] = await Response.json();
  const metadataRecords = new Map();
  metadataArr.forEach(metadataRecord => metadataRecords.set(metadataRecord.mmsi, metadataRecord));
  return {
    dataFetched: Date.now(),
    metadataRecords,
  };
};

const fetchVesselMetadataByMmsi = async (mmsi: number): Promise<FinTrafficVesselMetadata> =>
  fetch(`${FINTRAFFIC_AIS_BASE_URL}/vessels/${mmsi}`)
    .then(Response => {
      if (!Response.ok) {
        throw new Error(`HTTP response error: ${Response.status}`);
      }
      return Response.json();
    })
    .catch(error => {
      console.error('Error fetching vessel metadata:', error);
      throw error;
    });

const fetchVesselsWithMetadata = async (url: string): Promise<VesselFC> => {
  const vessels: VesselFC = await fetchVessels(url);

  const featuresWithMetadata: VesselFeature[] = await Promise.all(
    vessels.features.map(async feature =>
      fetchVesselMetadataByMmsi(feature.mmsi).then(metadata => ({
        ...feature,
        vesselMetadata: metadata,
      })),
    ),
  );
  return { ...vessels, features: featuresWithMetadata };
};
