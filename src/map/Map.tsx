import React, {useState} from 'react';
import { Button, View, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, TextInput, StatusBar } from 'react-native';
import { Camera, CameraRef, CameraStop, MapView } from '@maplibre/maplibre-react-native';
import { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
import { addPointLayer, getAppropriateMapStyle } from './map-styles/styles';
import {LocationPermissionModal} from '../components/modals/PermissionModals';
import {usePermissions} from '../hooks';
import {RESULTS} from 'react-native-permissions';
import {LocationService} from '../services/location';

const navigationIcon = require('../../assets/images/icons/navigation-icon.png');
const searchIcon = require('../../assets/images/icons/search-icon.png');
const vesselIcon = require('../../assets/images/icons/vessel-icon.png');

const cameraInitStop: CameraStop = {
  centerCoordinate: [19.93481, 60.09726],
  zoomLevel: 5,
};

const Map = () => {
  // Initialize map with appropriate style based on API key availability
  const [mapStyle, setMapStyle] = React.useState<StyleSpecification>(getAppropriateMapStyle());
  const cameraRef = React.useRef<CameraRef>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

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

  // Center map on user's current location
  const centerOnUserLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const position = await LocationService.getCurrentPosition();

      // Center camera on user location with animation
      cameraRef.current?.setCamera({
        centerCoordinate: [position.longitude, position.latitude],
        zoomLevel: 14,
        animationDuration: 1000,
      });

      console.log('Centered on user location:', position);
    } catch (error: any) {
      console.error('Error getting location:', error);

      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please make sure location services are enabled.',
        [{text: 'OK'}]
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Handle navigation/location button press
  const handleNavigationPress = async () => {
    if (hasLocationPermission) {
      // Already have permission, center on user location
      await centerOnUserLocation();
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
      // Permission granted, center on user location
      await centerOnUserLocation();
    } else {
      console.log('Location permission denied in native dialog');
    }
  };

  // Handle "Not now" button - just close the modal
  const handleNotNow = () => {
    setShowLocationModal(false);
    console.log('User declined location permission');
  };

  // Handle search input
  const handleSearchPress = () => {
    // TODO: Implement search functionality
    // - Search for vessels by name/MMSI
    // - Search for locations/coordinates
    // - Show search results dropdown
    console.log('Search pressed');
  };

  // Handle vessel filter button press
  const handleVesselFilterPress = () => {
    // TODO: Implement vessel filter functionality
    // - Show bottom slider with vessel type options
    // - Filter options: All Vessels, Cargo, Tanker, Passenger, Fishing, etc.
    // - Update map to show only selected vessel types
    // - Save filter preferences
    console.log('Vessel filter pressed');
  };

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      <MapView style={styles.map} mapStyle={mapStyle}>
        <Camera ref={cameraRef} defaultSettings={cameraInitStop} />
      </MapView>

      {/* Search Bar and Vessel Filter */}
      <View style={styles.topControlsContainer}>
        <TouchableOpacity
          style={styles.searchBar}
          onPress={handleSearchPress}
          activeOpacity={0.7}>
          <Image
            source={searchIcon}
            style={styles.searchIcon}
            resizeMode="contain"
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#999"
            editable={false}
            pointerEvents="none"
          />
        </TouchableOpacity>

        {/* Vessel Filter Button */}
        <TouchableOpacity
          style={styles.vesselButton}
          onPress={handleVesselFilterPress}
          activeOpacity={0.8}>
          <Image
            source={vesselIcon}
            style={styles.vesselIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {/* Navigation Button */}
      <TouchableOpacity
        style={styles.navigationButton}
        onPress={handleNavigationPress}
        activeOpacity={0.8}
        disabled={isLoadingLocation}>
        {isLoadingLocation ? (
          <ActivityIndicator size="small" color="#5856D6" />
        ) : (
          <Image
            source={navigationIcon}
            style={styles.navigationIcon}
            resizeMode="contain"
          />
        )}
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
  topControlsContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
    tintColor: '#999',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  vesselButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  vesselIcon: {
    width: 24,
    height: 24,
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