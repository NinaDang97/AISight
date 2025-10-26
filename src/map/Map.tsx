import React from 'react';
import {
  Camera,
  CameraRef,
  CameraStop,
  MapView,
  type MapViewRef,
} from '@maplibre/maplibre-react-native';
import { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
import { Button, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type {
  Feature as GeoJSONFeature,
  FeatureCollection as GeoJSONFeatureCollection,
  Position as GeoJSONPosition,
} from 'geojson';
import {
  addGnssMockLayer,
  addShipLayer,
  getAppropriateMapStyle,
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
  // Initialize map with appropriate style based on API key availability
  const [mapStyle, setMapStyle] = React.useState<StyleSpecification>(getAppropriateMapStyle());
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

  const handleMapPress = React.useCallback(
    async (feature: GeoJSONFeature) => {
      if (!mapRef.current || !gnssEnabled) {
        setSelectedGnss(null);
        return;
      }

      const screenPointX = Number(
        (feature.properties as { screenPointX?: number } | undefined)?.screenPointX,
      );
      const screenPointY = Number(
        (feature.properties as { screenPointY?: number } | undefined)?.screenPointY,
      );

      if (Number.isNaN(screenPointX) || Number.isNaN(screenPointY)) {
        setSelectedGnss(null);
        return;
      }

      try {
        const collection: GeoJSONFeatureCollection =
          await mapRef.current.queryRenderedFeaturesAtPoint(
            [screenPointX, screenPointY],
            undefined,
            ['gnss-mock-points'],
          );

        const tappedFeature = collection.features[0];
        if (!tappedFeature) {
          setSelectedGnss(null);
          return;
        }

        const fixIndex = Number(
          (tappedFeature.properties as { fixIndex?: number } | undefined)?.fixIndex,
        );
        const detail = Number.isInteger(fixIndex) ? gnssFixDetails[fixIndex] : undefined;

        if (detail) {
          setSelectedGnss({
            coordinate: detail.coordinate,
            detail,
          });
        } else {
          setSelectedGnss(null);
        }
      } catch (error) {
        console.warn('Unable to resolve GNSS selection', error);
        setSelectedGnss(null);
      }
    },
    [gnssEnabled],
  );

  return (
    <>
      <MapView ref={mapRef} style={{ flex: 1 }} mapStyle={mapStyle} onPress={handleMapPress}>
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
      {selectedGnss && (
        <View style={styles.gnssDetailCard}>
          <View style={styles.gnssDetailHeader}>
            <Text style={styles.gnssDetailTitle}>GNSS fix #{selectedGnss.detail.fixIndex}</Text>
            <Pressable onPress={() => setSelectedGnss(null)} hitSlop={10}>
              <Text style={styles.gnssDetailClose}>Close</Text>
            </Pressable>
          </View>
          <Text style={styles.gnssDetailMeta}>Time: {selectedGnss.detail.timestamp}</Text>
          <Text style={styles.gnssDetailMeta}>
            Speed: {selectedGnss.detail.speedKts} kts ({selectedGnss.detail.speedMps} m/s)
          </Text>
          <Text style={styles.gnssDetailMeta}>
            Satellites used: {selectedGnss.detail.status.satellitesUsedInFix}
          </Text>
          <Text style={styles.gnssDetailMeta}>
            Average Cn0: {selectedGnss.detail.status.averageSignalToNoiseRatio}
          </Text>
          <Text style={styles.gnssDetailMeta}>Sea state: {selectedGnss.detail.seaState}</Text>
          <Text style={styles.gnssDetailMeta}>Nav status: {selectedGnss.detail.navStatus}</Text>
        </View>
      )}
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
  },
  gnssDetailCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  gnssDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  gnssDetailTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  gnssDetailClose: {
    color: '#94a3b8',
    fontSize: 14,
  },
  gnssDetailMeta: {
    color: '#e2e8f0',
    fontSize: 14,
    marginTop: 4,
  },
});