import {
  CircleLayerSpecification,
  GeoJSONSourceSpecification,
  SourceSpecification,
  StyleSpecification,
  SymbolLayerSpecification,
} from '@maplibre/maplibre-gl-style-spec';
import * as defaultMapStyle from '../map-styles/style.json';

export const defaultStyle: StyleSpecification =
  defaultMapStyle as StyleSpecification;

export const addHerwood2CapeLayer = (
  prevStyle: StyleSpecification,
): StyleSpecification => {
  return {
    ...prevStyle,
    sources: {
      ...prevStyle.sources,
      'herwood-to-capetown': herwood2CapetownSource,
    },
    layers: [...prevStyle.layers, herwoodLayer],
  };
};

export const addPointLayer = (
  prevStyle: StyleSpecification,
): StyleSpecification => {
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
      properties: {name: 'Hervanta - Cape Town'},
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
        properties: {name: 'Mariehamn'},
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
