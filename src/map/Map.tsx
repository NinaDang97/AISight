import React from 'react';
import {
  Camera,
  CameraRef,
  CameraStop,
  MapView,
  MarkerView,
  type MapViewRef,
} from '@maplibre/maplibre-react-native';
import { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
import { Button, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Feature as GeoJSONFeature, Position as GeoJSONPosition } from 'geojson';
import {
  addGnssMockLayer,
  addShipLayer,
  defaultStyle,
  removeGnssMockLayer,
  removeShipLayer,
} from './map-styles/styles';
import { gnssFixDetails, type GnssFixDetail } from '../logs/native-module/gnss-mock';

const Vessel = require('../../assets/images/icons/vessel.png');
const GnssOn = require('../../assets/images/icons/gnss-on.png');
const GnssOff = require('../../assets/images/icons/gnss-off.png');

const cameraInitStop: CameraStop = {
  centerCoordinate: [19.93481, 60.09726],
  zoomLevel: 5,
};

const NEAREST_FIX_THRESHOLD_METERS = 75;

const EARTH_RADIUS_METERS = 6371000;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

const getDistanceMeters = (a: GeoJSONPosition, b: GeoJSONPosition): number => {
  const [lon1, lat1] = a;
  const [lon2, lat2] = b;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);

  const aHav =
    sinDLat * sinDLat + Math.cos(lat1Rad) * Math.cos(lat2Rad) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(aHav), Math.sqrt(1 - aHav));

  return EARTH_RADIUS_METERS * c;
};

const findNearestFix = (
  coordinate: GeoJSONPosition,
  details: GnssFixDetail[],
): { detail: GnssFixDetail; distanceMeters: number } | null => {
  let nearest: GnssFixDetail | null = null;
  let minDistance = Number.POSITIVE_INFINITY;

  for (const detail of details) {
    const distance = getDistanceMeters(coordinate, detail.coordinate);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = detail;
    }
  }

  return nearest ? { detail: nearest, distanceMeters: minDistance } : null;
};

type SelectedGnss = {
  coordinate: GeoJSONPosition;
  detail: GnssFixDetail;
};

const Map = () => {
  const [mapStyle, setMapStyle] = React.useState<StyleSpecification>(defaultStyle);
  const cameraRef = React.useRef<CameraRef>(null);
  const mapRef = React.useRef<MapViewRef>(null);
  const [gnssEnabled, setGnssEnabled] = React.useState(false);
  const [shipLayerEnabled, setShipLayerEnabled] = React.useState(false);
  const [selectedGnss, setSelectedGnss] = React.useState<SelectedGnss | null>(null);

  const toggleGnss = () => {
    setGnssEnabled((prev) => !prev);
  };

  const toggleShips = () => {
    setShipLayerEnabled((prev) => !prev);
  };

  const resetCamera = () => {
    cameraRef.current?.setCamera(cameraInitStop);
  };

  React.useEffect(() => {
    setMapStyle((prev) => {
      let next = gnssEnabled ? addGnssMockLayer(prev) : removeGnssMockLayer(prev);
      next = shipLayerEnabled ? addShipLayer(next) : removeShipLayer(next);
      return next;
    });
  }, [gnssEnabled, shipLayerEnabled]);

  React.useEffect(() => {
    if (!gnssEnabled) {
      setSelectedGnss(null);
    }
  }, [gnssEnabled]);


  return (
    <>
      <MapView ref={mapRef} style={{ flex: 1 }} mapStyle={mapStyle}>
        <Camera ref={cameraRef} />
      </MapView>

      <View style={styles.iconContainer}>
        <Pressable onPress={toggleShips} style={styles.iconButton}>
          <Image source={Vessel} style={styles.icon} resizeMode="contain" />
        </Pressable>
        <Pressable onPress={toggleGnss} style={styles.iconButton}>
          <Image source={gnssEnabled ? GnssOn : GnssOff} style={styles.icon} resizeMode="contain" />
        </Pressable>
      </View>
      <Button title="Reset" onPress={resetCamera} />
    </>
  );
};

export default Map;

const styles = StyleSheet.create({
  iconContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'column',
    gap: 12,
  },
  iconButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  icon: {
    width: 48,
    height: 48,
  },
  popupContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    maxWidth: 260,
  },
  popupTitle: {
    color: '#f8fafc',
    fontWeight: '600',
    marginBottom: 2,
  },
  popupSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 8,
  },
  popupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  popupLabel: {
    color: '#cbd5f5',
    fontSize: 12,
    marginRight: 8,
  },
  popupValue: {
    color: '#e2e8f0',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
});
