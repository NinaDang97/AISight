import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  CameraModes,
  CameraRef,
  CameraStop,
  MapView,
  MapViewRef,
  ShapeSource,
  UserLocation,
} from '@maplibre/maplibre-react-native';
import { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
import type {
  Feature as GeoJSONFeature,
  FeatureCollection as GeoJSONFeatureCollection,
  Position as GeoJSONPosition,
} from 'geojson';

import { VesselFC } from './map-utils';
import {
  addGnssMockLayer,
  addShipLayer,
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
import { useVesselDetails } from '../components/contexts/VesselDetailsContext';
import GnssLayer from './GnssLayer';
import { useVesselMqtt } from '../components/contexts/VesselMqttContext';
import { useGnss } from '../components/contexts';

const navigationIcon = require('../../assets/images/icons/navigation-icon.png');
const searchIcon = require('../../assets/images/icons/search-icon.png');
const vesselIcon = require('../../assets/images/icons/vessel-icon.png');
const northIcon = require('../../assets/images/icons/north-icon.png');
const mapLayerIcon = require('../../assets/images/icons/black-location-icon.png');
const antennaIcon = require('../../assets/images/icons/antenna-icon.png');

type SelectedGnss = {
  coordinate: GeoJSONPosition;
  detail: GnssFixDetail;
};

type RegionPayload = {
  zoomLevel: number;
  heading: number;
  animated: boolean;
  isUserInteraction: boolean;
  visibleBounds: [northEast: GeoJSONPosition, southWest: GeoJSONPosition];
  pitch: number;
};

type LiveVessel = ReturnType<typeof useVesselMqtt>['vesselList'][number];

const cameraInitStop: CameraStop = {
  centerCoordinate: [19.93481, 60.09726],
  zoomLevel: 8,
  heading: 0,
  animationMode: 'easeTo',
  animationDuration: 500,
};

const defaultCameraCenter = cameraInitStop.centerCoordinate as GeoJSONPosition;

const emptyVesselCollection: VesselFC = {
  type: 'FeatureCollection',
  features: [],
};

const Map = () => {
  const cameraRef = React.useRef<CameraRef>(null);
  const mapRef = React.useRef<MapViewRef>(null);
  const vesselUpdateThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastVesselUpdateRef = useRef(0);
  const lastScheduledSelectedRef = useRef<number | null>(null);
  const [isShipEnabled, setIsShipEnabled] = React.useState(false);
  const [isGnssEnabled, setIsGnssEnabled] = useState(false);
  const [selectedGnss, setSelectedGnss] = React.useState<SelectedGnss | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [viewBounds, setViewBounds] = useState<{
    northeast: GeoJSONPosition;
    southwest: GeoJSONPosition;
  } | null>(null);
  const [viewCenter, setViewCenter] = useState<GeoJSONPosition | null>(null);
  const [mapStyle, setMapStyle] = useState<StyleSpecification>(() => getAppropriateMapStyle());
  const [selectedVesselMmsi, setSelectedVesselMmsi] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResultsVisible, setSearchResultsVisible] = useState(false);
  const [searchResults, setSearchResults] = useState<LiveVessel[]>([]);

  const { hasLocationPermission, requestLocation } = usePermissions();
  const { isTracking } = useGnss();
  const { setCardVisible, setVesselData } = useVesselDetails();
  const { vesselList, metadata } = useVesselMqtt();
  const shouldUseLiveFeed = vesselList.length > 0;
  const selectedVessel = useMemo(
    () => vesselList.find(v => Number(v.mmsi) === selectedVesselMmsi),
    [vesselList, selectedVesselMmsi],
  );
  const getVesselName = useCallback(
    (mmsi: string | number) => metadata?.[String(mmsi)]?.name ?? null,
    [metadata],
  );

  const liveVesselCollection = useMemo<VesselFC>(() => {
    if (!vesselList.length) {
      return emptyVesselCollection;
    }

    const center = viewCenter ?? defaultCameraCenter;
    const bounds = viewBounds;
    const maxVisible = 500;

    const toFeature = (v: LiveVessel) => {
      const numericMmsi = Number(v.mmsi);
      const rawRot = v.raw?.rot;

      return {
        type: 'Feature',
        mmsi: numericMmsi,
        geometry: {
          type: 'Point',
          coordinates: [v.lon, v.lat],
        },
        properties: {
          mmsi: numericMmsi,
          sog: typeof v.sog === 'number' ? v.sog : 0,
          cog: typeof v.cog === 'number' ? v.cog : 0,
          navStat: typeof v.navStat === 'number' ? v.navStat : 0,
          rot: typeof rawRot === 'number' ? rawRot : 0,
          posAcc: Boolean(v.posAcc),
          raim: Boolean(v.raim),
          heading: typeof v.heading === 'number' ? v.heading : undefined,
          timestamp: v.receivedAt,
          isSelected: selectedVesselMmsi === numericMmsi,
          layerId: 'ships',
        },
      };
    };

    const bounded = vesselList.filter(v => {
      if (typeof v.lat !== 'number' || typeof v.lon !== 'number') {
        return false;
      }
      if (!bounds) {
        return true;
      }
      // Vessel latitude between top and bottom of the screen/box
      const inLat = v.lat <= bounds.northeast[1] && v.lat >= bounds.southwest[1];
      // Vessel latitude between left and right of the screen/box
      const inLon = v.lon <= bounds.northeast[0] && v.lon >= bounds.southwest[0];
      return inLat && inLon;
    });

    // Euclidean distance: sort vessels by proximity to the center (closer first)
    const sorted = bounded
      .map(v => ({
        v,
        d: Math.hypot(v.lon - center[0], v.lat - center[1]),
      }))
      .sort((a, b) => a.d - b.d)
      .slice(0, maxVisible)
      .map(({ v }) => v);

    let features = sorted.map(toFeature);

    if (
      selectedVessel &&
      typeof selectedVessel.lat === 'number' &&
      typeof selectedVessel.lon === 'number'
    ) {
      const selectedMmsi = Number(selectedVessel.mmsi);
      const alreadyIncluded = features.some(f => f.mmsi === selectedMmsi);
      if (!alreadyIncluded) {
        features = [toFeature(selectedVessel), ...features].slice(0, maxVisible);
      }
    }

    return {
      type: 'FeatureCollection',
      features,
    };
  }, [vesselList, selectedVessel, selectedVesselMmsi, viewBounds, viewCenter]);

  useEffect(() => {
    setMapStyle(prev => {
      let next = isShipEnabled ? addShipLayer(prev) : removeShipLayer(prev);
      return next;
    });
  }, [isGnssEnabled, isShipEnabled]);

  const scheduleVesselStyleUpdate = useCallback(
    (collection: VesselFC, { immediate = false }: { immediate?: boolean } = {}) => {
      if (!collection.features.length) {
        return;
      }
      const now = Date.now();
      const elapsed = now - lastVesselUpdateRef.current;
      const delay = immediate ? 0 : Math.max(0, 1000 - elapsed); // throttle ~1000ms

      if (vesselUpdateThrottleRef.current) {
        clearTimeout(vesselUpdateThrottleRef.current);
      }

      vesselUpdateThrottleRef.current = setTimeout(() => {
        lastVesselUpdateRef.current = Date.now();
        setMapStyle(prev => updateShipData(prev, collection));
      }, delay);
    },
    [],
  );

  useEffect(() => {
    if (!isShipEnabled || !shouldUseLiveFeed) {
      return;
    }
    const shouldForceSelectedUpdate =
      selectedVesselMmsi !== null && selectedVesselMmsi !== lastScheduledSelectedRef.current;
    scheduleVesselStyleUpdate(liveVesselCollection, { immediate: shouldForceSelectedUpdate });
    lastScheduledSelectedRef.current = selectedVesselMmsi;
    return () => {
      if (vesselUpdateThrottleRef.current) {
        clearTimeout(vesselUpdateThrottleRef.current);
        vesselUpdateThrottleRef.current = null;
      }
    };
  }, [
    isShipEnabled,
    shouldUseLiveFeed,
    liveVesselCollection,
    scheduleVesselStyleUpdate,
    selectedVesselMmsi,
  ]);

  useEffect(() => {
    const initBounds = async () => {
      try {
        const bounds = await mapRef.current?.getVisibleBounds();
        const center = await mapRef.current?.getCenter();
        if (bounds) {
          setViewBounds({ northeast: bounds[0], southwest: bounds[1] });
        }
        if (center) {
          setViewCenter(center);
        }
      } catch {
        // ignore
      }
    };
    initBounds();
  }, []);

  // Handle user interaction with map - disable following mode when user scrolls
  const handleRegionWillChange = useCallback(
    (feature: GeoJSONFeature<GeoJSON.Point, RegionPayload>) => {
      // If user manually interacts with the map, disable following mode
      if (feature.properties?.isUserInteraction) {
        setIsFollowingUser(false);
      }

      // This fixes issue where camera would just stick when set with setCamera and not move after user interaction
      // No idea why it works but it does
      cameraRef.current?.setCamera({});
    },
    [],
  );

  const handleRegionDidChange = useCallback(
    (feature: GeoJSONFeature<GeoJSON.Point, RegionPayload>) => {
      const bounds = feature.properties?.visibleBounds;
      if (bounds?.length === 2) {
        setViewBounds({ northeast: bounds[0], southwest: bounds[1] });
      }
      const center = feature.geometry?.coordinates as GeoJSONPosition | undefined;
      if (center?.length === 2) {
        setViewCenter(center);
      }
    },
    [],
  );

  const handleMapPress = useCallback(
    async (feature: GeoJSONFeature) => {
      if (!mapRef.current || (!isGnssEnabled && !isShipEnabled)) {
        setSelectedGnss(null);
        setCardVisible(false);
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
        setCardVisible(false);
        return;
      }
      try {
        const collection: GeoJSONFeatureCollection =
          await mapRef.current.queryRenderedFeaturesAtPoint(
            [screenPointX, screenPointY],
            undefined,
            [
              'gnss-mock-points',
              'normal-active-ships',
              'normal-stationary-ships',
              'anomaly-active-ships',
              'anomaly-stationary-ships',
            ],
          );

        if (!collection.features || !collection.features.length) {
          setSelectedGnss(null);
          setCardVisible(false);
        }

        const tappedFeature = collection.features[0];
        const layerId = tappedFeature?.properties?.layerId;

        if (layerId === 'gnss-mock-points') {
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
        } else if (layerId === 'ships') {
          setSelectedGnss(null);
          setCardVisible(true);
          setVesselData(tappedFeature);
          const tappedMmsi = Number((tappedFeature.properties as { mmsi?: number })?.mmsi);
          if (!Number.isNaN(tappedMmsi)) {
            setSelectedVesselMmsi(tappedMmsi);
          }
        }
      } catch (error) {
        console.warn('Unable to resolve GNSS selection', error);
        setSelectedGnss(null);
        setCardVisible(false);
      }
    },
    [isGnssEnabled, isShipEnabled],
  );

  const resetCamera = () => {
    setIsFollowingUser(false);
    cameraRef.current?.setCamera(cameraInitStop);
  };

  // Center map on user's current location
  const centerOnUserLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const position = await LocationService.getCurrentPosition();

      // Enable following mode
      setIsFollowingUser(true);

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
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    const trimmed = text.trim();
    if (!trimmed) {
      setSearchResults([]);
      setSearchResultsVisible(false);
      return;
    }

    const lower = trimmed.toLowerCase();
    const matches = vesselList
      .filter(v => {
        if (v.mmsi.includes(trimmed)) {
          return true;
        }
        const name = getVesselName(v.mmsi);
        return Boolean(name && name.toLowerCase().includes(lower));
      })
      .slice(0, 5);
    setSearchResults(matches);
    setSearchResultsVisible(matches.length > 0);
  };

  const handleSelectVessel = (vessel: LiveVessel) => {
    const numericMmsi = Number(vessel.mmsi);
    const vesselName = getVesselName(vessel.mmsi);

    setIsShipEnabled(true);
    setSelectedVesselMmsi(numericMmsi);
    setSearchQuery(vesselName || vessel.mmsi);
    setSearchResults([]);
    setSearchResultsVisible(false);
    setCardVisible(true);

    setVesselData({
      type: 'Feature',
      mmsi: numericMmsi,
      geometry: {
        type: 'Point',
        coordinates: [vessel.lon, vessel.lat],
      },
      properties: {
        mmsi: numericMmsi,
        sog: typeof vessel.sog === 'number' ? vessel.sog : 0,
        cog: typeof vessel.cog === 'number' ? vessel.cog : 0,
        navStat: typeof vessel.navStat === 'number' ? vessel.navStat : 0,
        rot: typeof vessel.rot === 'number' ? vessel.rot : 0,
        posAcc: Boolean(vessel.posAcc),
        raim: Boolean(vessel.raim),
        heading: typeof vessel.heading === 'number' ? vessel.heading : undefined,
        timestamp: vessel.receivedAt,
        layerId: 'ships',
      },
    });

    cameraRef.current?.setCamera({
      centerCoordinate: [vessel.lon, vessel.lat],
      zoomLevel: 10,
      animationDuration: 800,
    });
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

  // Handle north button press
  const handleNorthPress = () => {
    console.log('North button pressed');
    cameraRef.current?.setCamera({
      heading: 0,
      animationDuration: 1000,
    });
  };

  // Handle map reset button press
  const handleMapResetPress = () => {
    // TODO: Implement map layer switching functionality
    // - Show layer options: Standard, Satellite, Hybrid, Nautical Chart
    // - Allow user to toggle between different map styles
    // - Save selected layer preference
    // - Update map view with selected layer
    console.log('Map reset button pressed');
    resetCamera();
  };

  // Handle GNSS toggle button press
  const handleGnssToggle = () => {
    // TODO: Implement GNSS functionality
    // - Toggle GNSS data overlay on map
    // - Show satellite positioning information
    // - Display GNSS signal strength indicators
    // - Show positioning accuracy
    // - Save GNSS toggle state preference
    if (!isGnssEnabled && !isTracking) {
      Alert.alert(
        'GNSS Tracking not enabled',
        'To record GNSS track on the map enable GNSS Tracking on the GNSS screen.',
        [{ text: 'OK' }],
      );
    }
    console.log('GNSS toggled:', !isGnssEnabled);
    setIsGnssEnabled(prev => !prev);
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <MapView
        testID="mapView"
        ref={mapRef}
        style={styles.map}
        mapStyle={mapStyle}
        onPress={handleMapPress}
        attributionEnabled={true}
        attributionPosition={{ bottom: 8, left: 8 }}
        compassEnabled={false}
        onRegionWillChange={handleRegionWillChange}
        onRegionDidChange={handleRegionDidChange}
      >
        <GnssLayer gnssEnabled={isGnssEnabled} />
        <Camera
          ref={cameraRef}
          defaultSettings={cameraInitStop}
          followUserLocation={isFollowingUser}
        />
        {hasLocationPermission && <UserLocation renderMode="native" androidRenderMode="compass" />}
      </MapView>

      {/* Search Bar and Vessel Filter */}
      <View style={styles.topControlsContainer}>
        <View style={styles.searchBar}>
          <Image source={searchIcon} style={styles.searchIcon} resizeMode="contain" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by vessel mmsi or name..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearchChange}
            onFocus={() => setSearchResultsVisible(Boolean(searchQuery.trim()))}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>

        {/* Vessel Filter Button */}
        <TouchableOpacity
          testID="vesselButton"
          style={[styles.vesselButton, isShipEnabled && styles.buttonActive]}
          onPress={handleVesselFilterPress}
          activeOpacity={0.8}
        >
          <Image source={vesselIcon} style={styles.vesselIcon} resizeMode="contain" />
        </TouchableOpacity>

        {/* North Button */}
        <TouchableOpacity
          testID="northButton"
          style={styles.portButton}
          onPress={handleNorthPress}
          activeOpacity={0.8}
        >
          <Image source={northIcon} style={styles.portIcon} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      {searchResultsVisible && searchResults.length > 0 && (
        <View style={styles.searchResultsContainer}>
          {searchResults.map(v => (
            <TouchableOpacity
              key={v.mmsi}
              style={styles.searchResultItem}
              onPress={() => handleSelectVessel(v)}
            >
              <Text style={styles.searchResultTitle}>{getVesselName(v.mmsi) || v.mmsi}</Text>
              <Text style={styles.searchResultSubtitle}>
                MMSI {v.mmsi} · {typeof v.sog === 'number' ? `${v.sog} kts` : 'Speed N/A'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Map Layer Button */}
      <TouchableOpacity
        testID="mapResetButton"
        style={styles.mapResetButton}
        onPress={handleMapResetPress}
        activeOpacity={0.8}
      >
        <Image source={mapLayerIcon} style={styles.mapLayerIcon} resizeMode="contain" />
      </TouchableOpacity>

      {/* GNSS Toggle Button */}
      <TouchableOpacity
        testID="gnssButton"
        style={[styles.gnssButton, isGnssEnabled && styles.buttonActive]}
        onPress={handleGnssToggle}
        activeOpacity={0.8}
      >
        <Image source={antennaIcon} style={styles.gnssIcon} resizeMode="contain" />
      </TouchableOpacity>

      {/* Navigation Button */}
      <TouchableOpacity
        testID="navigationButton"
        style={styles.navigationButton}
        onPress={handleNavigationPress}
        activeOpacity={0.8}
        disabled={isLoadingLocation}
      >
        {isLoadingLocation ? (
          <ActivityIndicator testID="loadingIndicator" size="small" color="#5856D6" />
        ) : (
          <Image source={navigationIcon} style={styles.navigationIcon} resizeMode="contain" />
        )}
      </TouchableOpacity>

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
  buttonActive: {
    backgroundColor: '#08A315',
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
  searchResultsContainer: {
    position: 'absolute',
    top: 116,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
  },
  searchResultItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  searchResultTitle: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  searchResultSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
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
  mapResetButton: {
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
  gnssIcon: {
    width: 24,
    height: 24,
  },
  navigationButton: {
    position: 'absolute',
    bottom: 20,
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
