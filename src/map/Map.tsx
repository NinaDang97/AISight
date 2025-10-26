import React from 'react';
import { Button, View, StyleSheet } from 'react-native';
import {
  Camera,
  CameraRef,
  CameraStop,
  LocationManager,
  MapView,
  MapViewRef,
  UserLocation,
  UserLocationRef,
} from '@maplibre/maplibre-react-native';
import { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
import { addPointLayers, getAppropriateMapStyle, updateShipData } from './map-styles/styles';
import {
  fetchVessels,
  FinTrafficVesselFC,
  FinTrafficVesselMetadata,
  makeAisApiUrl,
  VesselFC,
  VesselMetadataCollection,
} from './map-utils';

const cameraInitStop: CameraStop = {
  centerCoordinate: [19.93481, 60.09726],
  zoomLevel: 10,
};

const Map = () => {
  // Initialize map with appropriate style based on API key availability
  const [mapStyle, setMapStyle] = React.useState<StyleSpecification>(
    addPointLayers(getAppropriateMapStyle()),
  );
  const [vesselMetadata, setVesselMetadata] = React.useState<VesselMetadataCollection>(); // TODO: load all metadata to separate state
  const cameraRef = React.useRef<CameraRef>(null);
  const mapRef = React.useRef<MapViewRef>(null);
  const userLocationRef = React.useRef<UserLocationRef>(null);

  React.useEffect(() => {
    let mounted = true;

    const tick = async () => {
      try {
        updateVesselData();
      } catch (err) {
        console.warn('Periodic ship update failed', err);
      }
    };

    tick();
    const id = setInterval(tick, 5_000);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const updateVesselData = async () => {
    const currentCenter = await mapRef.current?.getCenter();
    const visibleBounds = await mapRef.current?.getVisibleBounds();

    if (!currentCenter) throw new Error('Error getting map center');
    if (!visibleBounds) throw new Error('Error getting map bounds');

    const url = makeAisApiUrl(currentCenter, visibleBounds);
    const vessels: VesselFC = await fetchVessels(url);
    console.log(vessels);
    setMapStyle(prev => updateShipData(prev, vessels));
  };

  const resetCamera = () => {
    cameraRef.current?.setCamera(cameraInitStop);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        mapStyle={mapStyle}
        attributionEnabled={false}
        onRegionWillChange={() => updateVesselData()}
      >
        <Camera ref={cameraRef} defaultSettings={cameraInitStop} />
        <UserLocation ref={userLocationRef} renderMode="native" androidRenderMode="compass" />
      </MapView>
      <View style={styles.buttonContainer}>
        <Button title="Reset" onPress={resetCamera}></Button>
        <Button
          title="Jmp2Usr"
          onPress={async () =>
            cameraRef.current?.setCamera({
              centerCoordinate: await LocationManager.getLastKnownLocation().then(location =>
                location ? [location.coords.longitude, location.coords.latitude] : undefined,
              ),
              zoomLevel: 10,
            })
          }
        ></Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
});

export default Map;
