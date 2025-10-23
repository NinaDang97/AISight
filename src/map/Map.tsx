import React from 'react';
import { Button, View, StyleSheet } from 'react-native';
import { Camera, CameraRef, CameraStop, MapView } from '@maplibre/maplibre-react-native';
import { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
import { addPointLayer, getAppropriateMapStyle } from './map-styles/styles';

const cameraInitStop: CameraStop = {
  centerCoordinate: [19.93481, 60.09726],
  zoomLevel: 5,
};

const Map = () => {
  // Initialize map with appropriate style based on API key availability
  const [mapStyle, setMapStyle] = React.useState<StyleSpecification>(getAppropriateMapStyle());
  const cameraRef = React.useRef<CameraRef>(null);

  const addPoints = () => {
    setMapStyle(prevStyle => addPointLayer(prevStyle));
  };

  const resetCamera = () => {
    cameraRef.current?.setCamera(cameraInitStop);
  };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} mapStyle={mapStyle}>
        <Camera ref={cameraRef} defaultSettings={cameraInitStop} />
      </MapView>
      <View style={styles.buttonContainer}>
        <Button title="Reset Camera" onPress={resetCamera} />
        <Button title="Show Points" onPress={addPoints} />
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