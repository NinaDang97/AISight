import React, { useEffect, useState } from 'react';
import {
  CircleLayer,
  CircleLayerStyle,
  LineLayer,
  LineLayerStyle,
  ShapeSource,
} from '@maplibre/maplibre-react-native';
import { useGnss } from '../components/contexts';
import { GnssLocation } from '../native/GnssModule';

// meters threshold under which we ignore small movement
const DISTANCE_THRESHOLD_METERS = 5;
// limit track length to avoid unbounded memory growth
const TRACK_MAX_POINTS = 500;

const haversineMeters = (lon1: number, lat1: number, lon2: number, lat2: number) => {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

type GnssPointState = GeoJSON.FeatureCollection<GeoJSON.Point, GnssLocation>;

type GnssTrackState = GeoJSON.FeatureCollection<GeoJSON.LineString>;

interface GnssLayerProps {
  gnssEnabled: boolean;
}

const GnssLayer = ({ gnssEnabled }: GnssLayerProps) => {
  const { location, isTracking } = useGnss();
  const [trackPointState, setTrackPointState] = useState<GnssPointState>({
    type: 'FeatureCollection',
    features: [],
  });
  const [trackLineState, setTrackLineState] = useState<GnssTrackState>({
    type: 'FeatureCollection',
    features: [],
  });
  const [trackInitialized, setTrackInitialized] = useState<boolean>(false);

  useEffect(() => {
    if (!isTracking || !location) return;

    console.log('GNSS Location:', location);

    // ignore too small movements
    if (trackPointState.features.length > 1) {
      const prevLng =
        trackPointState.features[trackPointState.features.length - 1].geometry.coordinates[0];
      const prevLat =
        trackPointState.features[trackPointState.features.length - 1].geometry.coordinates[1];
      const currLng = location.longitude;
      const currLat = location.latitude;
      if (haversineMeters(prevLng, prevLat, currLng, currLat) < DISTANCE_THRESHOLD_METERS) {
        return;
      }
    }

    const userLocationFeature: GeoJSON.Feature<GeoJSON.Point, GnssLocation> = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [location.longitude, location.latitude] },
      properties: location,
    };

    setTrackPointState(prevState => {
      const nextFeatures = [...prevState.features, userLocationFeature];
      // cap length
      const sliceStart = Math.max(0, nextFeatures.length - TRACK_MAX_POINTS);
      const capped = nextFeatures.slice(sliceStart);
      return { type: 'FeatureCollection', features: capped };
    });
  }, [isTracking, location]);

  useEffect(() => {
    if (!gnssEnabled || trackPointState.features.length < 2) return;

    if (!trackInitialized) {
      setTrackLineState({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: trackPointState.features.map(f => f.geometry.coordinates),
            },
            properties: {},
          },
        ],
      });
      setTrackInitialized(true);
    } else if (trackPointState.features.length > 2 && trackLineState.features.length > 0) {
      setTrackLineState(prevState => {
        const existingCoords = prevState.features[0].geometry.coordinates;
        const newLocation =
          trackPointState.features[trackPointState.features.length - 1].geometry.coordinates;
        const existingFeature = prevState.features[0];
        const updatedCoords = existingCoords.concat([[newLocation[0], newLocation[1]]]);
        const updatedFeature = {
          ...existingFeature,
          geometry: { ...existingFeature.geometry, coordinates: updatedCoords },
        };
        return {
          ...prevState,
          features: [updatedFeature],
        };
      });
    }
  }, [trackPointState]);

  const isLayerVisible = gnssEnabled ? 'visible' : 'none';
  return (
    <>
      <ShapeSource id="gnss-source" key="gnss-source" shape={trackLineState}>
        <LineLayer
          id="gnss-track-line"
          key="gnss-track-line"
          style={{ ...gnssTrackStyle, visibility: isLayerVisible }}
        />
      </ShapeSource>
      <ShapeSource id="gnss-point-source" key="gnss-point-source" shape={trackPointState}>
        <CircleLayer
          id="gnss-point-layer"
          key="gnss-point-layer"
          style={{ ...gnssStyle, visibility: isLayerVisible }}
        />
      </ShapeSource>
    </>
  );
};

export default GnssLayer;

const gnssStyle: CircleLayerStyle = {
  circleRadius: 6,
  circleColor: '#FF0000',
  circleStrokeWidth: 2,
  circleStrokeColor: '#FFFFFF',
};

const gnssTrackStyle: LineLayerStyle = {
  lineWidth: 4,
  lineColor: [
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
