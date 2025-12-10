/**
 * Map Component Tests
 * Test file location: __tests__/screens/Map.test.tsx
 *
 * Test Coverage:
 * - MAP-INIT-001: Map renders without crashing
 * - MAP-INIT-002: Map renders all required UI elements
 * - MAP-NAV-001: Navigation button opens location permission modal
 * - MAP-NAV-002: Permission modal Continue button requests location
 * - MAP-NAV-003: Camera centers on user location when permission granted
 * - MAP-NAV-004: Location service errors handled gracefully
 * - MAP-SEARCH-001: Search filters vessels by MMSI
 * - MAP-SEARCH-002: Search filters vessels by name
 * - MAP-SEARCH-003: Search clears results when empty
 * - MAP-SEARCH-004: Vessel selection updates card and camera
 * - MAP-TOGGLE-001: Vessel layer toggle changes button state
 * - MAP-TOGGLE-002: GNSS layer toggle changes button state
 * - MAP-TOGGLE-003: North button resets heading to 0
 * - MAP-TOGGLE-004: Map reset button resets camera to initial position
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import Map from '../../src/map/Map';
import { usePermissions } from '../../src/hooks';
import { useVesselDetails } from '../../src/components/contexts/VesselDetailsContext';
import { useVesselMqtt } from '../../src/components/contexts/VesselMqttContext';
import { LocationService, Position } from '../../src/services/location';
import { RESULTS } from 'react-native-permissions';

// ============================================================================
// SETUP: Mocks
// ============================================================================

jest.mock('../../src/hooks');
jest.mock('../../src/components/contexts/VesselDetailsContext');
jest.mock('../../src/components/contexts/VesselMqttContext');
jest.mock('../../src/services/location');

// Camera mock with ref to capture imperative calls
const mockSetCamera = jest.fn();
const mockFlyTo = jest.fn();
const mockZoomTo = jest.fn();

jest.mock('@maplibre/maplibre-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');

  const MockCamera = React.forwardRef((_props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      setCamera: (stop: any) => mockSetCamera(stop),
      flyTo: (stop: any) => mockFlyTo(stop),
      zoomTo: (stop: any) => mockZoomTo(stop),
    }));
    return null;
  });

  return {
    MapView: ({ children }: any) => <View testID="MapView">{children}</View>,
    Camera: MockCamera,
    UserLocation: () => null,
    ShapeSource: () => null,
  };
});

// PermissionModal mock with testable buttons
jest.mock('../../src/components/modals/PermissionModals', () => {
  const React = require('react');
  const { View, Button } = require('react-native');

  return {
    LocationPermissionModal: ({ visible, onContinue, onNotNow }: any) =>
      visible ? (
        <View testID="locationPermissionModal">
          <Button
            title="Continue"
            testID="locationPermissionModalContinue"
            onPress={() => onContinue && onContinue()}
          />
          <Button
            title="Not Now"
            testID="locationPermissionModalNotNow"
            onPress={() => onNotNow && onNotNow()}
          />
        </View>
      ) : null,
  };
});

jest.mock('../../src/map/GnssLayer', () => () => null);

// ============================================================================
// TYPE DEFINITIONS & MOCK SETUP
// ============================================================================

const mockUsePermissions = usePermissions as jest.Mock;
const mockUseVesselDetails = useVesselDetails as jest.Mock;
const mockUseVesselMqtt = useVesselMqtt as jest.Mock;
const mockLocationService = LocationService as jest.Mocked<typeof LocationService>;

// ============================================================================
// TEST SUITE
// ============================================================================

describe('Map Component', () => {
  // Setup/Teardown
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Default mock values
    mockUsePermissions.mockReturnValue({
      hasLocationPermission: false,
      requestLocation: jest.fn(),
    });

    mockUseVesselDetails.mockReturnValue({
      setCardVisible: jest.fn(),
      setVesselData: jest.fn(),
    });

    mockUseVesselMqtt.mockReturnValue({
      vesselList: [],
      metadata: {},
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // =========================================================================
  // MAP-INIT: Initial Render Tests
  // =========================================================================

  describe('MAP-INIT: Initial Render', () => {
    it('MAP-INIT-001: should render Map component without crashing', () => {
      const { root } = render(<Map />);
      expect(root).toBeTruthy();
    });

    it('MAP-INIT-002: should render all required UI elements', () => {
      render(<Map />);

      // Core UI elements
      expect(screen.getByTestId('MapView')).toBeTruthy();
      expect(screen.getByTestId('navigationButton')).toBeTruthy();
      expect(screen.getByTestId('vesselButton')).toBeTruthy();
      expect(screen.getByTestId('gnssButton')).toBeTruthy();
      expect(screen.getByTestId('northButton')).toBeTruthy();
      expect(screen.getByTestId('mapResetButton')).toBeTruthy();

      // Search bar
      expect(screen.getByPlaceholderText('Search by vessel mmsi or name...')).toBeTruthy();
    });
  });

  // =========================================================================
  // MAP-NAV: Navigation & Location Tests
  // =========================================================================

  describe('MAP-NAV: Navigation and Location', () => {
    it('MAP-NAV-001: should show location permission modal when user lacks permission', async () => {
      mockUsePermissions.mockReturnValue({
        hasLocationPermission: false,
        requestLocation: jest.fn(),
      });

      render(<Map />);
      fireEvent.press(screen.getByTestId('navigationButton'));

      await waitFor(() => {
        expect(screen.getByTestId('locationPermissionModal')).toBeTruthy();
      });
    });

    it('MAP-NAV-002: should call requestLocation when Continue pressed on modal', async () => {
      const mockRequestLocation = jest.fn().mockResolvedValue(RESULTS.GRANTED);

      mockUsePermissions.mockReturnValue({
        hasLocationPermission: false,
        requestLocation: mockRequestLocation,
      });

      render(<Map />);
      fireEvent.press(screen.getByTestId('navigationButton'));

      await waitFor(() => {
        expect(screen.getByTestId('locationPermissionModal')).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId('locationPermissionModalContinue'));

      await waitFor(() => {
        expect(mockRequestLocation).toHaveBeenCalled();
      });
    });

    it('MAP-NAV-003: should center camera on user location when permission granted', async () => {
      mockUsePermissions.mockReturnValue({
        hasLocationPermission: true,
        requestLocation: jest.fn(),
      });

      mockLocationService.getCurrentPosition.mockResolvedValue({
        latitude: 60.1,
        longitude: 19.9,
      } as Position);

      mockSetCamera.mockClear();

      render(<Map />);
      fireEvent.press(screen.getByTestId('navigationButton'));

      await waitFor(() => {
        expect(mockLocationService.getCurrentPosition).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockSetCamera).toHaveBeenCalledWith(
          expect.objectContaining({
            centerCoordinate: [19.9, 60.1],
            zoomLevel: 14,
            animationDuration: 1000,
          }),
        );
      });
    });

    it('MAP-NAV-004: should handle location service errors gracefully', async () => {
      mockUsePermissions.mockReturnValue({
        hasLocationPermission: true,
        requestLocation: jest.fn(),
      });

      mockLocationService.getCurrentPosition.mockRejectedValue(new Error('Location unavailable'));

      render(<Map />);
      fireEvent.press(screen.getByTestId('navigationButton'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Location Error',
          expect.stringContaining('Unable to get your current location'),
          expect.any(Array),
        );
      });
    });

    it('should close modal when Not Now button pressed', async () => {
      mockUsePermissions.mockReturnValue({
        hasLocationPermission: false,
        requestLocation: jest.fn(),
      });

      render(<Map />);
      fireEvent.press(screen.getByTestId('navigationButton'));

      await waitFor(() => {
        expect(screen.getByTestId('locationPermissionModal')).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId('locationPermissionModalNotNow'));

      await waitFor(() => {
        expect(screen.queryByTestId('locationPermissionModal')).toBeNull();
      });
    });
  });

  // =========================================================================
  // MAP-SEARCH: Search Functionality Tests
  // =========================================================================

  describe('MAP-SEARCH: Search Functionality', () => {
    it('MAP-SEARCH-001: should filter vessels by MMSI', () => {
      mockUseVesselMqtt.mockReturnValue({
        vesselList: [{ mmsi: '123456789', lat: 60.1, lon: 19.9, sog: 10, receivedAt: Date.now() }],
        metadata: { '123456789': { name: 'Test Vessel' } },
      });

      render(<Map />);
      const searchInput = screen.getByPlaceholderText('Search by vessel mmsi or name...');

      fireEvent.changeText(searchInput, '123456');

      expect(screen.getByText('Test Vessel')).toBeTruthy();
    });

    it('MAP-SEARCH-002: should filter vessels by name', () => {
      mockUseVesselMqtt.mockReturnValue({
        vesselList: [{ mmsi: '987654321', lat: 60.1, lon: 19.9, sog: 5, receivedAt: Date.now() }],
        metadata: { '987654321': { name: 'Nordic Vessel' } },
      });

      render(<Map />);
      const searchInput = screen.getByPlaceholderText('Search by vessel mmsi or name...');

      fireEvent.changeText(searchInput, 'Nordic');

      expect(screen.getByText('Nordic Vessel')).toBeTruthy();
    });

    it('MAP-SEARCH-003: should clear search results when input empty', () => {
      mockUseVesselMqtt.mockReturnValue({
        vesselList: [{ mmsi: '123456789', lat: 60.1, lon: 19.9, sog: 10, receivedAt: Date.now() }],
        metadata: { '123456789': { name: 'Test Vessel' } },
      });

      render(<Map />);
      const searchInput = screen.getByPlaceholderText('Search by vessel mmsi or name...');

      fireEvent.changeText(searchInput, '123456');
      expect(screen.getByText('Test Vessel')).toBeTruthy();

      fireEvent.changeText(searchInput, '');
      expect(screen.queryByText('Test Vessel')).toBeNull();
    });

    it('MAP-SEARCH-004: should select vessel and update card + camera', async () => {
      const mockSetCardVisible = jest.fn();
      const mockSetVesselData = jest.fn();

      mockUseVesselDetails.mockReturnValue({
        setCardVisible: mockSetCardVisible,
        setVesselData: mockSetVesselData,
      });

      mockUseVesselMqtt.mockReturnValue({
        vesselList: [{ mmsi: '123456789', lat: 60.1, lon: 19.9, sog: 10, receivedAt: Date.now() }],
        metadata: { '123456789': { name: 'Test Vessel' } },
      });

      mockSetCamera.mockClear();

      render(<Map />);
      const searchInput = screen.getByPlaceholderText('Search by vessel mmsi or name...');

      fireEvent.changeText(searchInput, '123456');
      const vesselResult = screen.getByText('Test Vessel');
      fireEvent.press(vesselResult);

      await waitFor(() => {
        expect(mockSetCardVisible).toHaveBeenCalledWith(true);
        expect(mockSetVesselData).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockSetCamera).toHaveBeenCalledWith(
          expect.objectContaining({
            centerCoordinate: [19.9, 60.1],
            zoomLevel: 10,
            animationDuration: 800,
          }),
        );
      });
    });
  });

  // =========================================================================
  // MAP-TOGGLE: Toggle Buttons Tests
  // =========================================================================

  describe('MAP-TOGGLE: Toggle Buttons', () => {
    it('MAP-TOGGLE-001: should toggle ship layer on vessel button press', () => {
      const { rerender } = render(<Map />);
      const vesselButton = screen.getByTestId('vesselButton');

      fireEvent.press(vesselButton);
      rerender(<Map />);

      expect(vesselButton).toHaveStyle({ backgroundColor: '#08A315' });
    });

    it('MAP-TOGGLE-002: should toggle GNSS layer on GNSS button press', () => {
      render(<Map />);
      const gnssButton = screen.getByTestId('gnssButton');

      fireEvent.press(gnssButton);

      expect(gnssButton).toHaveStyle({ backgroundColor: '#08A315' });
    });

    it('MAP-TOGGLE-003: should reset map rotation to north on north button press', () => {
      mockSetCamera.mockClear();

      render(<Map />);
      fireEvent.press(screen.getByTestId('northButton'));

      expect(mockSetCamera).toHaveBeenCalledWith(
        expect.objectContaining({
          heading: 0,
          animationDuration: 1000,
        }),
      );
    });

    it('MAP-TOGGLE-004: should reset camera to initial position on map reset', () => {
      mockSetCamera.mockClear();

      render(<Map />);
      fireEvent.press(screen.getByTestId('mapResetButton'));

      expect(mockSetCamera).toHaveBeenCalledWith(
        expect.objectContaining({
          centerCoordinate: expect.any(Array),
          zoomLevel: expect.any(Number),
        }),
      );
    });
  });

  // =========================================================================
  // MAP-VESSEL: Vessel Display Tests
  // =========================================================================

  describe('MAP-VESSEL: Vessel Display', () => {
    it('should render map when vessels present', () => {
      mockUseVesselMqtt.mockReturnValue({
        vesselList: [
          {
            mmsi: '123456789',
            lat: 60.1,
            lon: 19.9,
            sog: 10,
            cog: 45,
            navStat: 0,
            receivedAt: Date.now(),
          },
        ],
        metadata: {},
      });

      render(<Map />);
      expect(screen.getByTestId('MapView')).toBeTruthy();
    });

    it('should handle large vessel lists (>500)', () => {
      const largeVesselList = Array.from({ length: 600 }, (_, i) => ({
        mmsi: `${100000000 + i}`,
        lat: 60.1 + i * 0.001,
        lon: 19.9,
        sog: 10,
        cog: 45,
        navStat: 0,
        receivedAt: Date.now(),
      }));

      mockUseVesselMqtt.mockReturnValue({
        vesselList: largeVesselList,
        metadata: {},
      });

      render(<Map />);
      expect(screen.getByTestId('MapView')).toBeTruthy();
    });
  });

  // =========================================================================
  // MAP-LOADING: Loading States Tests
  // =========================================================================

  describe('MAP-LOADING: Loading States', () => {
    it('should show loading indicator while getting location', async () => {
      mockUsePermissions.mockReturnValue({
        hasLocationPermission: true,
        requestLocation: jest.fn(),
      });

      mockLocationService.getCurrentPosition.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve({ latitude: 60.1, longitude: 19.9 } as Position), 100),
          ),
      );

      render(<Map />);
      fireEvent.press(screen.getByTestId('navigationButton'));

      await waitFor(() => {
        expect(screen.getByTestId('loadingIndicator')).toBeTruthy();
      });
    });
  });
});
