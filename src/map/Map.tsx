import React from 'react';
import { Camera, CameraRef, CameraStop, MapView } from '@maplibre/maplibre-react-native';
import { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
import { Button } from 'react-native';
import { addPointLayer, defaultStyle } from './map-styles/styles';

const cameraInitStop: CameraStop = {
  centerCoordinate: [19.93481, 60.09726],
  zoomLevel: 5,
};

const MapCamera: Camera = <Camera />;

const Map = () => {
  const [mapStyle, setMapStyle] = React.useState<StyleSpecification>(defaultStyle);
  const cameraRef = React.useRef<CameraRef>(null);

  const addPoints = () => {
    setMapStyle(addPointLayer(mapStyle));
  };

  // set center focus to maarianhamina
  const resetCamera = () => {
    cameraRef.current?.setCamera(cameraInitStop);
  };

  /*
if (defaultStyle) {
  defaultStyle.sources = {
    ...defaultStyle.sources,
    'fintraffic-ships': herwoodSource,
  };

    defaultStyle.layers.push({
      id: 'herwood-location-static',
      type: 'circle',
      source: 'fintraffic-ships',
      paint: {
        'circle-radius': 4,
        'circle-color': '#ffe600ff',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#000000ff',
      },
    });
  }
  */
  return (
    <>
      <MapView style={{ flex: 1 }} mapStyle={mapStyle}>
        <Camera ref={cameraRef} />
      </MapView>
      <Button title="Reset" onPress={resetCamera}></Button>
      <Button title="Show" onPress={addPoints}></Button>
    </>
  );
};

export default Map;
