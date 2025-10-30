import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
  StatusBar,
  Pressable,
  Text,
} from 'react-native';

import {
  Camera,
  CameraRef,
  CameraStop,
  MapView,
  MapViewRef,
  UserLocation,
} from '@maplibre/maplibre-react-native';
import { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
import type {
  Feature as GeoJSONFeature,
  FeatureCollection as GeoJSONFeatureCollection,
  Position as GeoJSONPosition,
} from 'geojson';

import {
  fetchMetadataForAllVessels,
  fetchVessels,
  makeAisApiUrl,
  VesselFC,
  VesselMetadataCollection,
} from './map-utils';
import {
  addGnssMockLayer,
  addShipLayer,
  defaultStyle,
  getAppropriateMapStyle,
  removeGnssMockLayer,
  removeShipLayer,
  updateShipData,
} from './map-styles/styles';
import { gnssFixDetails, type GnssFixDetail } from '../logs/native-module/gnss-mock';
import { LocationPermissionModal } from '../components/modals/PermissionModals';
import { usePermissions } from '../hooks';
import { RESULTS } from 'react-native-permissions';
import { LocationService } from '../services/location';
import { logger } from '../utils/logger';

const navigationIcon = require('../../assets/images/icons/navigation-icon.png');
const searchIcon = require('../../assets/images/icons/search-icon.png');
const vesselIcon = require('../../assets/images/icons/vessel-icon.png');
const portIcon = require('../../assets/images/icons/port-icon.png');
const mapLayerIcon = require('../../assets/images/icons/map-layer-icon.png');
const antennaIcon = require('../../assets/images/icons/antenna-icon.png');

type SelectedGnss = {
  coordinate: GeoJSONPosition;
  detail: GnssFixDetail;
};

type RegionChangeProperties = {
  zoomLevel?: number;
  isUserInteraction?: boolean;
};

const cameraInitStop: CameraStop = {
  centerCoordinate: [19.93481, 60.09726],
  zoomLevel: 10,
};

const defaultCameraCenter = cameraInitStop.centerCoordinate as GeoJSONPosition;

const Map = () => {
  // Initialize map with appropriate style based on API key availability
  const [mapStyle, setMapStyle] = React.useState<StyleSpecification>(defaultStyle);
  const cameraRef = React.useRef<CameraRef>(null);
  const mapRef = React.useRef<MapViewRef>(null);
  const [isShipEnabled, setIsShipEnabled] = React.useState(false);
  const [isGnssEnabled, setIsGnssEnabled] = useState(false);
  const [selectedGnss, setSelectedGnss] = React.useState<SelectedGnss | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [vesselMetadataState, setVesselMetadataState] =
    React.useState<VesselMetadataCollection | null>(null);

  const { hasLocationPermission, requestLocation } = usePermissions();

  useEffect(() => {
    setMapStyle(prev => {
      let next = isGnssEnabled ? addGnssMockLayer(prev) : removeGnssMockLayer(prev);
      next = isShipEnabled ? addShipLayer(next) : removeShipLayer(next);
      return next;
    });
  }, [isGnssEnabled, isShipEnabled]);

  useEffect(() => {
    let mounted = true;
    setMapStyle(getAppropriateMapStyle());

    const initMetadata = async () => {
      try {
        const metadata = await fetchMetadataForAllVessels();
        setVesselMetadataState(metadata);
      } catch (err) {
        console.warn('Failed to load vessel metadata on mount', err);
      }
    };
    initMetadata();

    const tick = async () => {
      try {
        updateVesselData();
      } catch (err) {
        console.warn('Periodic ship update failed', err);
      }
    };

    tick();
    const id = setInterval(tick, 15_000);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const updateVesselData = async () => {
    const currentCenter = await mapRef.current?.getCenter();
    if (!currentCenter) throw new Error('Error getting map center');
    const visibleBounds = await mapRef.current?.getVisibleBounds();
    if (!visibleBounds) throw new Error('Error getting map bounds');

    const url = makeAisApiUrl(currentCenter, visibleBounds);
    const vessels: VesselFC = await fetchVessels(url);

    // Populate the metadata property
    vessels.features.forEach(
      feature =>
        (feature.properties.vesselMetadata = vesselMetadataState?.metadataRecords.get(
          feature.mmsi,
        )),
    );

    logger.info(`Vessels updated`);

    setMapStyle(prev => updateShipData(prev, vessels));
  };

  const handleMapPress = useCallback(
    async (feature: GeoJSONFeature) => {
      if (!mapRef.current || !isGnssEnabled) {
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
    [isGnssEnabled],
  );

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
        [{ text: 'OK' }],
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
    setIsShipEnabled(prev => !prev);
  };

  // Handle port button press
  const handlePortPress = () => {
    // TODO: Implement port functionality
    // - Toggle port visibility on map
    // - Show port information (name, type, facilities)
    // - Display port markers with icons
    // - Filter ports by type (cargo, passenger, fishing, etc.)
    // - Show distance to nearest port
    console.log('Port button pressed');
  };

  // Handle map layer button press
  const handleMapLayerPress = () => {
    // TODO: Implement map layer switching functionality
    // - Show layer options: Standard, Satellite, Hybrid, Nautical Chart
    // - Allow user to toggle between different map styles
    // - Save selected layer preference
    // - Update map view with selected layer
    console.log('Map layer button pressed');
  };

  // Handle GNSS toggle button press
  const handleGnssToggle = () => {
    // TODO: Implement GNSS functionality
    // - Toggle GNSS data overlay on map
    // - Show satellite positioning information
    // - Display GNSS signal strength indicators
    // - Show positioning accuracy
    // - Save GNSS toggle state preference
    console.log('GNSS toggled:', !isGnssEnabled);
    setIsGnssEnabled(prev => !prev);
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <MapView
        ref={mapRef}
        style={styles.map}
        mapStyle={mapStyle}
        onPress={handleMapPress}
        attributionEnabled={false}
        onRegionDidChange={updateVesselData}
      >
        <Camera ref={cameraRef} defaultSettings={cameraInitStop} />
        <UserLocation renderMode="native" androidRenderMode="compass" />
      </MapView>

      {/* Search Bar and Vessel Filter */}
      <View style={styles.topControlsContainer}>
        <TouchableOpacity style={styles.searchBar} onPress={handleSearchPress} activeOpacity={0.7}>
          <Image source={searchIcon} style={styles.searchIcon} resizeMode="contain" />
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
          activeOpacity={0.8}
        >
          <Image source={vesselIcon} style={styles.vesselIcon} resizeMode="contain" />
        </TouchableOpacity>

        {/* Port Button */}
        <TouchableOpacity style={styles.portButton} onPress={handlePortPress} activeOpacity={0.8}>
          <Image source={portIcon} style={styles.portIcon} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      {/* Map Layer Button */}
      <TouchableOpacity
        style={styles.mapLayerButton}
        onPress={handleMapLayerPress}
        activeOpacity={0.8}
      >
        <Image source={mapLayerIcon} style={styles.mapLayerIcon} resizeMode="contain" />
      </TouchableOpacity>

      {/* GNSS Toggle Button */}
      <TouchableOpacity
        style={[styles.gnssButton, isGnssEnabled && styles.gnssButtonActive]}
        onPress={handleGnssToggle}
        activeOpacity={0.8}
      >
        <Image source={antennaIcon} style={styles.gnssIcon} resizeMode="contain" />
      </TouchableOpacity>

      {/* Navigation Button */}
      <TouchableOpacity
        style={styles.navigationButton}
        onPress={handleNavigationPress}
        activeOpacity={0.8}
        disabled={isLoadingLocation}
      >
        {isLoadingLocation ? (
          <ActivityIndicator size="small" color="#5856D6" />
        ) : (
          <Image source={navigationIcon} style={styles.navigationIcon} resizeMode="contain" />
        )}
      </TouchableOpacity>

      <Button title="Reset Camera" onPress={resetCamera} />

      {/* Location Permission Modal */}
      <LocationPermissionModal
        visible={showLocationModal}
        onContinue={handleContinue}
        onNotNow={handleNotNow}
      />

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
    </View>
  );
};

export default Map;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
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
    shadowOffset: { width: 0, height: 2 },
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  vesselIcon: {
    width: 24,
    height: 24,
  },
  portButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  portIcon: {
    width: 24,
    height: 24,
  },
  mapLayerButton: {
    position: 'absolute',
    top: 128,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  mapLayerIcon: {
    width: 24,
    height: 24,
  },
  gnssButton: {
    position: 'absolute',
    top: 188,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  gnssButtonActive: {
    backgroundColor: '#08A315',
  },
  gnssIcon: {
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  navigationIcon: {
    width: 24,
    height: 24,
  },
});
