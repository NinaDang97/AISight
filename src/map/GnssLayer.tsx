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



const lines: GeoJSON.FeatureCollection<GeoJSON.LineString, { id: string }> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { id: 'track1' },
      geometry: {
        coordinates: [
          [23.849147381997057, 61.45376934970855],
          [23.847513736389175, 61.453376821960234],
          [23.847615693417254, 61.45297311793291],
          [23.84812547855833, 61.45231186728137],
          [23.848453197577157, 61.45194991361575],
        ],
        type: 'LineString',
      },
    },
  ],
};

interface GnssLayerProps {
  gnssEnabled: boolean;
}

type GnssTrackState = GeoJSON.FeatureCollection<GeoJSON.Point, GnssLocation>;

const GnssLayer = ({ gnssEnabled }: GnssLayerProps) => {
  const { location, isTracking } = useGnss();
  const [trackState, setTrackState] = useState<GnssTrackState>({
    type: 'FeatureCollection',
    features: [],
  });

  useEffect(() => {
    // You can use the GNSS location data here if needed
    if (isTracking) {
      console.log('GNSS Location:', location);
      if (location) {
        trackState.features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [location.longitude, location.latitude] },
          properties: location,
        });
        setTrackState({ ...trackState });
      }
    }
  }, [isTracking, location]);

  const isLayerVisible = gnssEnabled ? 'visible' : 'none';
  return (
    <>
      <ShapeSource id="gnss-source" shape={trackState}>
        <CircleLayer id="gnss-layer" style={{ ...gnssStyle, visibility: isLayerVisible }} />
      </ShapeSource>
      <ShapeSource id="gnss-track-source" shape={lines}>
        <LineLayer id="gnss-track" style={{ ...gnssTrackStyle, visibility: isLayerVisible }} />
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
