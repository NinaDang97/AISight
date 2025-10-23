// // Hardcoded MapTiler API key for development
// const MAPTILER_API_KEY = 'kzrINMR6M7Z6c9QO8rw6';

// // for testing
// // const MAPTILER_API_KEY = '';

import { getMapTilerApiKey } from '../../config/environment';
const MAPTILER_API_KEY = getMapTilerApiKey();

import {
  CircleLayerSpecification,
  GeoJSONSourceSpecification,
  LineLayerSpecification,
  StyleSpecification,
  SymbolLayerSpecification,
} from '@maplibre/maplibre-gl-style-spec';
import type { FeatureCollection, LineString, Point } from 'geojson';
import * as defaultMapStyle from '../map-styles/maplibre-default-style.json';
import * as basicMapStyle from '../map-styles/maptiler-basic-gl-style.json';
import { VesselFC } from '../map-utils';

// ===== Base Map Styles =====

/**
 * Default MapLibre style that doesn't require an API key
 */
export const defaultStyle: StyleSpecification = defaultMapStyle as StyleSpecification;

// ===== MapTiler Integration =====
/**
 * Determines if MapTiler should be used based on API key availability
 * @returns true if a valid API key is available
 */
export const shouldUseMapTiler = (): boolean => {
  const isValid = !!MAPTILER_API_KEY && MAPTILER_API_KEY.length > 0;
  console.log('Using MapTiler:', isValid ? 'YES' : 'NO');
  return isValid;
};

/**
 * Creates a MapTiler style with the API key injected
 * @returns The MapTiler style with API key
 */
export const getMapTilerStyle = (): StyleSpecification => {
  // If no API key is available, return the default style
  if (!shouldUseMapTiler()) {
    console.warn('No MapTiler API key found in environment variables, using default MapLibre style');
    return defaultStyle;
  }

  try {
    // Create a deep copy of the basicMapStyle
    const mapTilerStyle = JSON.parse(JSON.stringify(basicMapStyle)) as StyleSpecification;
    
    // Replace the placeholder in sources URL
    if (mapTilerStyle.sources?.openmaptiles) {
      const source = mapTilerStyle.sources.openmaptiles;
      if ('url' in source && typeof source.url === 'string') {
        (source as any).url = source.url.replace('{key}', MAPTILER_API_KEY || '');
      }
    }
    
    // Replace the placeholder in glyphs URL
    if (typeof mapTilerStyle.glyphs === 'string') {
      mapTilerStyle.glyphs = mapTilerStyle.glyphs.replace('{key}', MAPTILER_API_KEY || '');
    }
    
    return mapTilerStyle;
  } catch (error) {
    console.error('Failed to create MapTiler style:', error);
    return defaultStyle;
  }
};

/**
 * Gets the appropriate map style based on API key availability
 * @returns The appropriate map style
 */
export const getAppropriateMapStyle = (): StyleSpecification => {
  return shouldUseMapTiler() ? getMapTilerStyle() : defaultStyle;
};

// ===== Layer Addition Functions =====

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
      'plain-point': plainPointSource,
    },
    layers: [...prevStyle.layers, shipLayer, plainPointLayer, shipTextLayer],
  };
};

// ===== Source Definitions =====
/**
 * Method to get stuff from Digitraffic ais source
 * @param prevStyle
 * @param location
 * @param radius
 * @returns
 */

// geojson source given the json as a parameter
export const updateShipData = (
  prevStyle: StyleSpecification,
  vessels: VesselFC,
): StyleSpecification => {
  return {
    ...prevStyle,
    sources: {
      ...prevStyle.sources,
      'fintraffic-ships': {
        type: 'geojson',
        data: vessels,
      },
    },
  };
};

export const updateShipSource = (
  prevStyle: StyleSpecification,
  currentCenter: GeoJSON.Position,
  visibleBounds: [GeoJSON.Position, GeoJSON.Position],
): StyleSpecification => {
  const topleft: GeoJSON.Position = visibleBounds[0];
  const radius =
    Math.sqrt(
      Math.pow(topleft[0] - currentCenter[0], 2) + Math.pow(topleft[1] - currentCenter[1], 2),
    ) * 111; // rough conversion to kilometers
  const sourceString = `https://meri.digitraffic.fi/api/ais/v1/locations?radius=${radius}&latitude=${currentCenter[0]}&longitude=${currentCenter[1]}`;
  if (prevStyle.sources && prevStyle.sources['fintraffic-ships']) {
    return {
      ...prevStyle,
      sources: {
        ...prevStyle.sources,
        'fintraffic-ships': {
          type: 'geojson',
          data: sourceString,
        },
      },
    };
  }
  return prevStyle;
};

const herwoodCenteredShipSource: GeoJSONSourceSpecification = {
  type: 'geojson',
  data: 'https://meri.digitraffic.fi/api/ais/v1/locations?radius=500&latitude=61.4481&longitude=23.8521',
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
  } as FeatureCollection<Point>,
};

const herwoodToCapetown: FeatureCollection<LineString> = {
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

// ===== Layer Definitions =====

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

const herwoodLayer: LineLayerSpecification = {
  id: 'herwood-to-capetown',
  type: 'line',
  source: 'herwood-to-capetown',
  paint: {
    'line-width': 10,
    'line-color': '#fa0',
  },
  layout: {
    'line-cap': 'round',
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