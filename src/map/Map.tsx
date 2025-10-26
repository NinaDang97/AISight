import React, {useState} from 'react';
import { Button, View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Camera, CameraRef, CameraStop, MapView } from '@maplibre/maplibre-react-native';
import { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
import { addPointLayer, getAppropriateMapStyle } from './map-styles/styles';
import {LocationPermissionModal} from '../components/modals/PermissionModals';
import {usePermissions} from '../hooks';
import {RESULTS} from 'react-native-permissions';

const navigationIcon = require('../../assets/images/icons/navigation-icon.png');

const cameraInitStop: CameraStop = {
  centerCoordinate: [19.93481, 60.09726],
  zoomLevel: 5,
};

const Map = () => {
  // Initialize map with appropriate style based on API key availability
  const [mapStyle, setMapStyle] = React.useState<StyleSpecification>(getAppropriateMapStyle());
  const cameraRef = React.useRef<CameraRef>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const {
    hasLocationPermission,
    requestLocation,
  } = usePermissions();

  const addPoints = () => {
    setMapStyle(prevStyle => addPointLayer(prevStyle));
  };

  const resetCamera = () => {
    cameraRef.current?.setCamera(cameraInitStop);
  };

  // Handle navigation/location button press
  const handleNavigationPress = async () => {
    if (hasLocationPermission) {
      // Already have permission, center on user location
      console.log('Centering on user location');
      // TODO: Implement actual location centering
    } else {
      // Show permission modal
      setShowLocationModal(true);
    }
  };

  // Handle "Continue" button - show native permission dialog
  const handleContinue = async () => {
    setShowLocationModal(false);
    // Request permission - this will show the native system dialog
    const result = await requestLocation();
    if (result === RESULTS.GRANTED) {
      console.log('Location permission granted, centering on user');
      // TODO: Implement actual location centering
    } else {
      console.log('Location permission denied in native dialog');
    }
  };

  // Handle "Not now" button - just close the modal
  const handleNotNow = () => {
    setShowLocationModal(false);
    console.log('User declined location permission');
  };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} mapStyle={mapStyle}>
        <Camera ref={cameraRef} defaultSettings={cameraInitStop} />
      </MapView>

      {/* Navigation Button */}
      <TouchableOpacity
        style={styles.navigationButton}
        onPress={handleNavigationPress}
        activeOpacity={0.8}>
        <Image
          source={navigationIcon}
          style={styles.navigationIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <View style={styles.buttonContainer}>
        <Button title="Reset Camera" onPress={resetCamera} />
        <Button title="Show Points" onPress={addPoints} />
      </View>

      {/* Location Permission Modal */}
      <LocationPermissionModal
        visible={showLocationModal}
        onContinue={handleContinue}
        onNotNow={handleNotNow}
      />
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
  navigationButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  navigationIcon: {
    width: 24,
    height: 24,
  },
});

export default Map;