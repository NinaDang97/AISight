import {
  CircleLayerSpecification,
  GeoJSONSourceSpecification,
  SourceSpecification,
  StyleSpecification,
  SymbolLayerSpecification,
  LineLayerSpecification,
} from '@maplibre/maplibre-gl-style-spec';
import * as defaultMapStyle from '../map-styles/maplibre-default-style.json';
import * as basicMapStyle from '../map-styles/maptiler-basic-gl-style.json';
import { gnssMockFixes } from './gnss-mock';

// You can replace this with any valid MapLibre style JSON e.g. the basicMapStyle.
// It however requires you to have the api key from https://docs.maptiler.com/cloud/api/authentication-key/
// You have to set it to the json. Plan is to have this is .env in the future.
// Maplibre default style does not require a key.
export const defaultStyle: StyleSpecification = defaultMapStyle as StyleSpecification;

export const addHerwood2CapeLayer = (prevStyle: StyleSpecification): StyleSpecification => {
  return {
    ...prevStyle,
    sources: {
      ...prevStyle.sources,
      'herwood-to-capetown': herwood2CapetownSource,
    },
    layers: [...prevStyle.layers, herwoodLayer],
  };
};

export const addPointLayer = (prevStyle: StyleSpecification): StyleSpecification => {
  return {
    ...prevStyle,
    sources: {
      ...prevStyle.sources,
      'fintraffic-ships': herwoodCenteredShipSource,
      'plain-point': plainPointSource,
    },
    layers: [...prevStyle.layers, shipLayer, plainPointLayer, shipTextLayer],
  };
};

export const addGnssMockLayer = (prevStyle: StyleSpecification): StyleSpecification => {
  const baseStyle = removeGnssMockLayer(prevStyle);

  return {
    ...baseStyle,
    sources: {
      ...(baseStyle.sources ?? {}),
      'gnss-mock': gnssMockSource,
    },
    layers: [...(baseStyle.layers ?? []), gnssTrackLayer, gnssPointLayer],
  };
};

export const removeGnssMockLayer = (prevStyle: StyleSpecification): StyleSpecification => {
  const hasGnssLayer = (prevStyle.layers ?? []).some(
    (layer) => layer.id === gnssTrackLayer.id || layer.id === gnssPointLayer.id,
  );
  const hasGnssSource = Boolean(prevStyle.sources?.['gnss-mock']);

  if (!hasGnssLayer && !hasGnssSource) {
    return prevStyle;
  }

  const sources = baseStyleSourcesWithoutGnss(prevStyle.sources);
  const layers = (prevStyle.layers ?? []).filter(
    (layer) => layer.id !== gnssTrackLayer.id && layer.id !== gnssPointLayer.id,
  );

  return {
    ...prevStyle,
    sources,
    layers,
  };
};

const herwoodCenteredShipSource: GeoJSONSourceSpecification = {
  type: 'geojson',
  data: 'https://meri.digitraffic.fi/api/ais/v1/locations?radius=500&latitude=61.4481&longitude=23.8521',
};

const shipLayer: CircleLayerSpecification = {
  id: 'ships',
  type: 'circle',
  source: 'fintraffic-ships',
  paint: {
    'circle-color': '#0aa',
    'circle-stroke-width': 2,
  },
};

const shipTextLayer: SymbolLayerSpecification = {
  id: 'ships-text',
  type: 'symbol',
  source: 'fintraffic-ships',
  layout: {
    'text-field': ['get', 'mmsi'],
    'text-size': 12,
    'text-offset': [0, 1.5],
  },
};

const herwoodToCapetown: GeoJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [23.8521, 61.4481],
          [18.4233, -33.918861],
        ],
      },
      properties: { name: 'Hervanta - Cape Town' },
    },
  ],
};

const herwood2CapetownSource: GeoJSONSourceSpecification = {
  type: 'geojson',
  data: herwoodToCapetown,
};

const herwoodLayer: LineLayerSpecification = {
  id: 'herwood-to-capetown',
  type: 'line',
  source: 'herwood-to-capetown',
  paint: {
    'line-cap': 'round',
    'line-width': 10,
    'line-color': '#fa0',
  },
};

const plainPointSource: GeoJSONSourceSpecification = {
  type: 'geojson',
  data: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [19.93481, 60.09726],
        },
        properties: { name: 'Mariehamn' },
      },
    ],
  },
};

const plainPointLayer: CircleLayerSpecification = {
  id: 'plain-point',
  type: 'circle',
  source: 'plain-point',
  paint: {
    'circle-color': '#0a0',
    'circle-stroke-width': 2,
    'circle-stroke-color': '#000',
  },
};

const gnssMockSource: GeoJSONSourceSpecification = {
  type: 'geojson',
  data: gnssMockFixes,
};

const gnssTrackLayer: LineLayerSpecification = {
  id: 'gnss-mock-track',
  type: 'line',
  source: 'gnss-mock',
  paint: {
    'line-width': 3,
    'line-color': '#1d4ed8',
  },
};

const gnssPointLayer: CircleLayerSpecification = {
  id: 'gnss-mock-points',
  type: 'circle',
  source: 'gnss-mock',
  filter: ['==', ['geometry-type'], 'Point'],
  paint: {
    'circle-radius': 4,
    'circle-color': '#f97316',
    'circle-stroke-width': 1,
    'circle-stroke-color': '#ffffff',
  },
};

const baseStyleSourcesWithoutGnss = (
  sources?: Record<string, SourceSpecification>,
): Record<string, SourceSpecification> | undefined => {
  if (!sources) {
    return sources;
  }

  const { ['gnss-mock']: _, ...rest } = sources;
  return rest;
};
