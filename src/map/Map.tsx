import React from 'react';
import {
  Camera,
  CameraRef,
  CameraStop,
  MapView,
  MapViewRef,
} from '@maplibre/maplibre-react-native';
import { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
import { Button } from 'react-native';
import { addPointLayer, defaultStyle } from './map-styles/styles';
import { useVesselDetails } from '../screens/VesselDetailsScreen';

const cameraInitStop: CameraStop = {
  centerCoordinate: [19.93481, 60.09726],
  zoomLevel: 5,
};

const Map = () => {
  const {cardVisible, setCardVisible, detailsVisible, setDetailsVisible} = useVesselDetails();
  const [mapStyle, setMapStyle] = React.useState<StyleSpecification>(defaultStyle);
  const cameraRef = React.useRef<CameraRef>(null);
  const mapRef = React.useRef<MapViewRef>(null);

  const addPoints = () => {
    setMapStyle(addPointLayer(mapStyle));
  };

  // set center focus to maarianhamina
  const resetCamera = () => {
    cameraRef.current?.setCamera(cameraInitStop);
  };

  const handlePress = async (e: any): Promise<void> => {
    const pointX = e.properties.screenPointX;
    const pointY = e.properties.screenPointY;
    console.log('Tapped at:', pointX, pointY, e);
    const points = await mapRef.current?.queryRenderedFeaturesAtPoint([pointX, pointY], undefined, [
      'ships',
    ]);
    console.log(points);
    setCardVisible(true);
  };

  return (
    <>
      <MapView ref={mapRef} style={{ flex: 1 }} mapStyle={mapStyle} onPress={handlePress}>
        <Camera ref={cameraRef} />
      </MapView>
      <Button title="Reset" onPress={resetCamera}></Button>
      <Button title="Show" onPress={addPoints}></Button>
    </>
  );
};

export default Map;
