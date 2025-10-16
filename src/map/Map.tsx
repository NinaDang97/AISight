import React from 'react';
import { Camera, CameraRef, CameraStop, MapView } from '@maplibre/maplibre-react-native';
import { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
import { Button, Image, Pressable, StyleSheet, View } from 'react-native';
import {
  addGnssMockLayer,
  addPointLayer,
  defaultStyle,
  removeGnssMockLayer,
} from './map-styles/styles';
import { colors } from '../styles';
const Vessel = require('../../assets/images/icons/vessel.png');
const GnssOn = require('../../assets/images/icons/gnss-on.png');
const GnssOff = require('../../assets/images/icons/gnss-off.png');

const cameraInitStop: CameraStop = {
  centerCoordinate: [19.93481, 60.09726],
  zoomLevel: 5,
};

const MapCamera: Camera = <Camera />;

const Map = () => {
  const [mapStyle, setMapStyle] = React.useState<StyleSpecification>(defaultStyle);
  const cameraRef = React.useRef<CameraRef>(null);
  const [gnss, setGnss] = React.useState(false);

  // toggle gnss state
  const toggleGnss = () => {
    setGnss((prev) => !prev);
  };

  const addPoints = () => {
    setMapStyle((prev) => addPointLayer(prev));
  };

  // set center focus to maarianhamina
  const resetCamera = () => {
    cameraRef.current?.setCamera(cameraInitStop);
  };

  React.useEffect(() => {
    setMapStyle((prev) => (gnss ? addGnssMockLayer(prev) : removeGnssMockLayer(prev)));
  }, [gnss]);

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

      <View style={styles.iconContainer}>
        <Pressable onPress={addPoints}>
          <Image source={Vessel} style={styles.icon} resizeMode="contain" />
        </Pressable>
        <Pressable onPress={toggleGnss}>
          <Image source={gnss ? GnssOn : GnssOff} style={styles.icon} resizeMode="contain" />
        </Pressable>
      </View>
      <Button title="Reset" onPress={resetCamera}></Button>
    </>
  );
};

export default Map;

const styles = StyleSheet.create({
  iconContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  icon: {
    width: 50,
    height: 50,
  }
})
