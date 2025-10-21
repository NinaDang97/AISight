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

  const adjustZoom = React.useCallback(
    async (delta: number) => {
      if (!mapRef.current || !cameraRef.current) return;
      const currentZoom = await mapRef.current.getZoom();
      const nextZoom = Math.max(2, Math.min(currentZoom + delta, 18)); // clamp if you like
      cameraRef.current.setCamera({
        zoomLevel: nextZoom,
        animationDuration: 400,
      });
    },
    [],
  );

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

      <View style={styles.zoomContainer}>
        <Pressable style={styles.zoomButton} onPress={() => adjustZoom(1)}>
          <Text style={styles.zoomLabel}>+</Text>
        </Pressable>
        <Pressable style={styles.zoomButton} onPress={() => adjustZoom(-1)}>
          <Text style={styles.zoomLabel}>−</Text>
        </Pressable>
      </View>
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
    top: 10,
    right: 10,
    flexDirection: 'column',
  },
  iconButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  icon: {
    width: 48,
    height: 48,
  },
  zoomContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
  },
  zoomButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  zoomLabel: {
    color: '#e2e8f0',
    fontSize: 18,
    fontWeight: '600',
  }
});
