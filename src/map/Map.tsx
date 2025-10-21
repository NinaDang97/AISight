import React from 'react';
import { Button, View, StyleSheet } from 'react-native';
import { Camera, CameraRef, CameraStop, MapView } from '@maplibre/maplibre-react-native';
import { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
import { addPointLayer, getAppropriateMapStyle,  } from './map-styles/styles';

const cameraInitStop: CameraStop = {
  centerCoordinate: [19.93481, 60.09726],
  zoomLevel: 10,
};

const Map = () => {
  // Initialize map with appropriate style based on API key availability
  const [mapStyle, setMapStyle] = React.useState<StyleSpecification>(getAppropriateMapStyle());
  const cameraRef = React.useRef<CameraRef>(null);
  const mapRef = React.useRef<MapViewRef>(null);
  const userLocationRef = React.useRef<UserLocationRef>(null);

  const addPoints = () => {
    setMapStyle(prevStyle => addPointLayer(prevStyle));
  };

  const resetCamera = () => {
    cameraRef.current?.setCamera(cameraInitStop);
  };

  const fetchAndUpdateShips = async (prevStyle: StyleSpecification) => {
    const currentCenter = await mapRef.current?.getCenter();
    const visibleBounds = await mapRef.current?.getVisibleBounds();

    if (!currentCenter) throw new Error('Error getting map center');
    if (!visibleBounds) throw new Error('Error getting map bounds');

    const udpatedStyle = updateShipSource(prevStyle, currentCenter, visibleBounds);
    setMapStyle(udpatedStyle);
  };

  /*
    React.useEffect(() => {
      addPoints();
      const interval = setInterval(() => {
        fetchAndUpdateShips(mapStyle).catch(err => console.error(err));
      }, 15000); // Fetch every 15 seconds
      return () => clearInterval(interval);
    }, []);
  */

  return (
    <View style={styles.container}>
      <MapView style={styles.map} mapStyle={mapStyle} attributionEnabled={false}>
        <Camera ref={cameraRef} defaultSettings={cameraInitStop} />
        <UserLocation ref={userLocationRef} renderMode="native" androidRenderMode="compass" />
      </MapView>
      <View style={styles.buttonContainer}></View>
      <Button title="Reset" onPress={resetCamera}></Button>
      <Button title="Show" onPress={addPoints}></Button>
      <Button
        title="Jump to user location"
        onPress={async () =>
          cameraRef.current?.setCamera({
            centerCoordinate: await LocationManager.getLastKnownLocation().then(location =>
              location ? [location.coords.longitude, location.coords.latitude] : undefined,
            ),
            zoomLevel: 7,
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