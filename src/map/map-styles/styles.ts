import { getMapTilerApiKey } from '../../config/environment';
import { logger } from '../../utils/logger';
import {
  CircleLayerSpecification,
  GeoJSONSourceSpecification,
  LineLayerSpecification,
  SourceSpecification,
  StyleSpecification,
  SymbolLayerSpecification,
} from '@maplibre/maplibre-gl-style-spec';
import type { FeatureCollection, LineString, Point } from 'geojson';
import * as defaultMapStyle from '../map-styles/maplibre-default-style.json';
import * as basicMapStyle from '../map-styles/maptiler-basic-gl-style.json';
import { gnssMockFixes } from '../../logs/native-module/gnss-mock';
import { VesselFC } from '../map-utils';

const MAPTILER_API_KEY = getMapTilerApiKey();

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
  logger.debug('Using MapTiler:', isValid ? 'YES' : 'NO');
  return isValid;
};

/**
 * Creates a MapTiler style with the API key injected
 * @returns The MapTiler style with API key
 */
export const getMapTilerStyle = (): StyleSpecification => {
  // If no API key is available, return the default style
  if (!shouldUseMapTiler()) {
    logger.warn('No MapTiler API key found, using default MapLibre style');
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
    logger.error('Failed to create MapTiler style:', error);
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

export const addShipLayer = (prevStyle: StyleSpecification): StyleSpecification => {
  const baseStyle = removeShipLayer(prevStyle);

  return {
    ...baseStyle,
    sources: {
      ...(baseStyle.sources ?? {}),
      'plain-point': plainPointSource,
    },
    layers: [
      ...(baseStyle.layers ?? []),
      shipLayer,
      passengerShipLayer,
      plainPointLayer,
      shipTextLayer,
    ],
  };
};

export const removeShipLayer = (prevStyle: StyleSpecification): StyleSpecification => {
  const sources = baseStyleSourcesWithoutShips(prevStyle.sources);
  const layers = (prevStyle.layers ?? []).filter(
    layer =>
      layer.id !== shipLayer.id &&
      layer.id !== passengerShipLayer.id &&
      layer.id !== plainPointLayer.id &&
      layer.id !== shipTextLayer.id,
  );

  return {
    ...prevStyle,
    sources,
    layers,
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
    layers: [...(baseStyle.layers ?? []), gnssTrackLayer, gnssPointLayer, gnssTextLayer],
  };
};

export const removeGnssMockLayer = (prevStyle: StyleSpecification): StyleSpecification => {
  const hasGnssLayer = (prevStyle.layers ?? []).some(
    layer => layer.id === gnssTrackLayer.id || layer.id === gnssPointLayer.id,
  );
  const hasGnssSource = Boolean(prevStyle.sources?.['gnss-mock']);

  if (!hasGnssLayer && !hasGnssSource) {
    return prevStyle;
  }

  const sources = baseStyleSourcesWithoutGnss(prevStyle.sources);
  const layers = (prevStyle.layers ?? []).filter(
    layer => layer.id !== gnssTrackLayer.id && layer.id !== gnssPointLayer.id,
  );

  return {
    ...prevStyle,
    sources,
    layers,
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

// source is just plain json
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
        data: {
          ...vessels,
          features: vessels.features.map(f => ({
            ...f,
            properties: {
              ...f.properties,
              layerId: 'ships',
            },
          })),
        },
      },
    },
  };
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

// ===== Layer Definitions =====

const shipLayer: CircleLayerSpecification = {
  id: 'ships',
  type: 'circle',
  source: 'fintraffic-ships',
  filter: ['!=', ['get', 'shipType', ['get', 'vesselMetadata']], 60],
  paint: {
    'circle-color': '#0aa',
    'circle-stroke-width': 2,
  },
};

const passengerShipLayer: CircleLayerSpecification = {
  id: 'passenger-ships',
  type: 'circle',
  source: 'fintraffic-ships',
  filter: ['==', ['get', 'shipType', ['get', 'vesselMetadata']], 60],
  paint: {
    'circle-color': '#f00',
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

const gnssMockSource: GeoJSONSourceSpecification = {
  type: 'geojson',
  data: {
    ...gnssMockFixes,
    features: gnssMockFixes.features.map(f => ({
      ...f,
      properties: {
        ...f.properties,
        layerId: 'gnss-mock-points', // Add a unique layerId
      },
    })),
  },
};

const gnssTrackLayer: LineLayerSpecification = {
  id: 'gnss-mock-track',
  type: 'line',
  source: 'gnss-mock',
  paint: {
    'line-width': 3,
    'line-color': [
      'interpolate',
      ['linear'],
      ['coalesce', ['get', 'gnssSatVisible'], 0],
      0,
      '#991b1b',
      5,
      '#f97316',
      10,
      '#84cc16',
    ],
  },
};

const gnssPointLayer: CircleLayerSpecification = {
  id: 'gnss-mock-points',
  type: 'circle',
  source: 'gnss-mock',
  filter: ['==', ['geometry-type'], 'Point'],
  paint: {
    'circle-radius': 8,
    'circle-color': [
      'step',
      ['coalesce', ['get', 'gnssAvgCn0'], 0],
      '#ef4444',
      25,
      '#f59e0b',
      35,
      '#22c55e',
    ],
    'circle-stroke-width': 1,
    'circle-stroke-color': '#ffffff',
  },
};

const gnssTextLayer: SymbolLayerSpecification = {
  id: 'gnss-text',
  type: 'symbol',
  source: 'gnss-mock',
  layout: {
    'text-field': ['get', 'gnssAvgCn0'],
    'text-size': 12,
    'text-offset': [0, 1.5],
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

const baseStyleSourcesWithoutShips = (
  sources?: Record<string, SourceSpecification>,
): Record<string, SourceSpecification> | undefined => {
  if (!sources) {
    return sources;
  }

  const {
    ['fintraffic-ships']: _removedShips,
    ['plain-point']: _removedPlainPoint,
    ...rest
  } = sources;
  return rest;
};
