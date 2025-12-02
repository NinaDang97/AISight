import React, { useEffect, useState } from 'react';
import {
  CircleLayer,
  CircleLayerStyle,
  LineLayer,
  LineLayerStyle,
  ShapeSource,
  SymbolLayer,
  SymbolLayerStyle,
} from '@maplibre/maplibre-react-native';
import { useGnss } from '../components/contexts';
import { GnssLocation, GnssStatus } from '../native/GnssModule';

// meters threshold under which we ignore small movement
const DISTANCE_THRESHOLD_METERS = 5;
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

type GnssLocationAndStatus = GnssLocation & Partial<GnssStatus>;

type GnssPointState = GeoJSON.FeatureCollection<GeoJSON.Point, GnssLocationAndStatus>;

type GnssTrackState = GeoJSON.FeatureCollection<GeoJSON.LineString>;

interface GnssLayerProps {
  gnssEnabled: boolean;
}

const GnssLayer = ({ gnssEnabled }: GnssLayerProps) => {
  const { location, status, isTracking } = useGnss();
  const [trackPointState, setTrackPointState] = useState<GnssPointState>({
    type: 'FeatureCollection',
    features: [],
  });
  const [trackLineState, setTrackLineState] = useState<GnssTrackState>({
    type: 'FeatureCollection',
    features: [],
  });

  useEffect(() => {
    if (!isTracking || !location) return;

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

    // round the avgCn0DbHz to 3 decimal places for display
    const parsedStatus = status
      ? {
          ...status,
          avgCn0DbHz: status.avgCn0DbHz
            ? Math.round((status.avgCn0DbHz + Number.EPSILON) * 1000) / 1000
            : 0,
        }
      : {};

    const userLocationFeature: GeoJSON.Feature<GeoJSON.Point, GnssLocationAndStatus> = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [location.longitude, location.latitude] },
      properties: { ...location, ...parsedStatus },
    };

    setTrackPointState(prevState => {
      const nextFeatures = [...prevState.features, userLocationFeature];
      const sliceStart = Math.max(0, nextFeatures.length - TRACK_MAX_POINTS);
      const capped = nextFeatures.slice(sliceStart);
      return { type: 'FeatureCollection', features: capped };
    });
  }, [isTracking, location]);

  useEffect(() => {
    if (!gnssEnabled || trackPointState.features.length < 2) {
      setTrackLineState({ type: 'FeatureCollection', features: [] });
      return;
    }

    const segments: GeoJSON.Feature<GeoJSON.LineString>[] = trackPointState.features
      .slice(1)
      .map((endFeature, iter) => {
        const startFeature = trackPointState.features[iter];
        return {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [startFeature.geometry.coordinates, endFeature.geometry.coordinates],
          },
          properties: {},
        } as GeoJSON.Feature<GeoJSON.LineString>;
      })
      .slice(-TRACK_MAX_POINTS);

    setTrackLineState({ type: 'FeatureCollection', features: segments });
  }, [trackPointState, gnssEnabled]);

  const isLayerVisible = gnssEnabled ? 'visible' : 'none';
  return (
    <>
      <ShapeSource id="gnss-point-source" key="gnss-point-source" shape={trackPointState}>
        <CircleLayer
          id="gnss-point-layer"
          key="gnss-point-layer"
          style={{ ...gnssPointStyle, visibility: isLayerVisible }}
        />
        <SymbolLayer
          id="gnss-point-text"
          key="gnss-point-text"
          style={{ ...gnssTextLayer, visibility: isLayerVisible }}
        />
      </ShapeSource>
      <ShapeSource id="gnss-track-source" key="gnss-track-source" shape={trackLineState}>
        <LineLayer
          id="gnss-track-line"
          key="gnss-track-line"
          belowLayerID="gnss-point-layer"
          style={{ ...gnssTrackStyle, visibility: isLayerVisible }}
        />
      </ShapeSource>
    </>
  );
};

export default GnssLayer;

const gnssPointStyle: CircleLayerStyle = {
  circleRadius: 8,
  circleColor: [
    'step',
    ['coalesce', ['get', 'avgCn0DbHz'], 0],
    '#ff1509',
    25,
    '#f9e36c',
    30,
    '#a6ff20',
    35,
    '#049500',
  ],
  circleStrokeWidth: 1,
  circleStrokeColor: '#ffffff',
};

const gnssTrackStyle: LineLayerStyle = {
  lineWidth: 4,
  lineColor: '#c9c9c9',
};

const gnssTextLayer: SymbolLayerStyle = {
  textField: ['get', 'avgCn0DbHz'],
  textSize: 12,
  textOffset: [0, 1.5],
};
