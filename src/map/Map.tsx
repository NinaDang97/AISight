import React from 'react';
import { Camera, MapView } from '@maplibre/maplibre-react-native';
import {
  CircleLayerSpecification,
  GeoJSONSourceSpecification,
  LineLayerSpecification,
  StyleSpecification,
} from '@maplibre/maplibre-gl-style-spec';

import { Button } from 'react-native';
import { addHerwood2CapeLayer, addPointLayer, defaultStyle } from './map-styles/styles';

const cameraInitState = {
  centerCoordinate: [19.93481, 60.09726],
  zoomLevel: 10,
};

const Map = () => {
  const [mapStyle, setMapStyle] = React.useState<StyleSpecification>(defaultStyle);
  const [camera, setCamera] = React.useState<any>(cameraInitState);
  const cameraref = React.useRef<Camera>(null);

  const addHerwoodToCape = () => {
    setMapStyle(addHerwood2CapeLayer(mapStyle));
  };

  const addPoints = () => {
    setMapStyle(addPointLayer(mapStyle));
  };

  // set new center focus, defaults to mariehamn
  const resetCamera = () => {
    setCamera(cameraInitState);
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
      <Button title="Reset" onPress={resetCamera}></Button>
      <Button title="Show" onPress={addHerwoodToCape}></Button>
      <Button title="Show2" onPress={addPoints}></Button>
      <MapView id={'asdf'} style={{ flex: 1 }} mapStyle={mapStyle}>
        <Camera centerCoordinate={camera.centerCoordinate} zoomLevel={camera.zoom} />
      </MapView>
    </>
  );
};

export default Map;
