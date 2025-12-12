/**
 * VesselDetailsScreen Tests
 * Based on test plan: APP-VES-001 to APP-VES-008
 *
 * Test Cases Covered:
 * - APP-VES-001: Vessel details popup displays when vessel is tapped
 * - APP-VES-002: Basic vessel information displays correctly
 * - APP-VES-003: Close button functionality
 * - APP-VES-004: View Details button expands additional information
 * - APP-VES-005: Hide Details button collapses information
 * - APP-VES-006: Status badges display correctly
 * - APP-VES-007: Vessel data updates in real-time
 * - APP-VES-008: Popup does not display when no vessel selected
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { VesselDetailsScreen } from '../../src/screens/VesselDetailsScreen/VesselDetailsScreen';

// Mock VesselDetailsContext
const mockVesselDetailsContext = {
  cardVisible: true,
  setCardVisible: jest.fn(),
  detailsVisible: false,
  setDetailsVisible: jest.fn(),
  vesselData: {
    properties: {
      mmsi: '123456789',
    },
  },
};

jest.mock('../../src/components/contexts/VesselDetailsContext', () => ({
  useVesselDetails: () => mockVesselDetailsContext,
}));

// Mock VesselMqttContext
const mockVesselMqttContext = {
  vessels: {
    '123456789': {
      lat: 37.7749,
      lon: -122.4194,
      sog: 12.5,
      cog: 180,
      heading: 175,
      receivedAt: '2024-01-15T10:30:00Z',
      posAcc: true,
    },
  },
  metadata: {
    '123456789': {
      name: 'Test Vessel',
      destination: 'San Francisco',
      draught: '8.5m',
      callSign: 'TEST123',
      type: 'Cargo',
    },
  },
};

jest.mock('../../src/components/contexts/VesselMqttContext', () => ({
  useVesselMqtt: () => mockVesselMqttContext,
}));

describe('VesselDetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVesselDetailsContext.cardVisible = true;
    mockVesselDetailsContext.detailsVisible = false;
    mockVesselDetailsContext.vesselData = {
      properties: {
        mmsi: '123456789',
      },
    };
    
    // Reset vessel data
    mockVesselMqttContext.vessels['123456789'] = {
      lat: 37.7749,
      lon: -122.4194,
      sog: 12.5,
      cog: 180,
      heading: 175,
      receivedAt: '2024-01-15T10:30:00Z',
      posAcc: true,
    };
    
    // Reset metadata
    mockVesselMqttContext.metadata['123456789'] = {
      name: 'Test Vessel',
      destination: 'San Francisco',
      draught: '8.5m',
      callSign: 'TEST123',
      type: 'Cargo',
    };
  });

  /**
   * Test Case: APP-VES-001
   * Title: Vessel details popup displays when vessel is tapped
   * Priority: High | Severity: Critical
   */
  describe('APP-VES-001: Vessel details popup displays when vessel is tapped', () => {
    it('should display vessel details popup when cardVisible is true', () => {
      mockVesselDetailsContext.cardVisible = true;

      const { getByText } = render(<VesselDetailsScreen />);

      expect(getByText('Test Vessel')).toBeTruthy();
    });

    it('should display Close button in popup', () => {
      const { getByText } = render(<VesselDetailsScreen />);

      expect(getByText('Close')).toBeTruthy();
    });

    it('should display vessel name when metadata is available', () => {
      const { getByText } = render(<VesselDetailsScreen />);

      expect(getByText('Test Vessel')).toBeTruthy();
    });

    it('should display MMSI when metadata is not available', () => {
      mockVesselMqttContext.metadata = {};

      const { getByText } = render(<VesselDetailsScreen />);

      expect(getByText('MMSI: 123456789')).toBeTruthy();
    });

    it('should render popup with proper structure', () => {
      const { toJSON } = render(<VesselDetailsScreen />);

      const tree = toJSON();
      expect(tree).toBeTruthy();
    });
  });

  /**
   * Test Case: APP-VES-002
   * Title: Basic vessel information displays correctly
   * Priority: High | Severity: Critical
   */
  describe('APP-VES-002: Basic vessel information displays correctly', () => {
    it('should display MMSI number', () => {
      const { getByText } = render(<VesselDetailsScreen />);

      expect(getByText('MMSI:')).toBeTruthy();
      expect(getByText('123456789')).toBeTruthy();
    });

    it('should display latitude and longitude', () => {
      const { getByText } = render(<VesselDetailsScreen />);

      expect(getByText('Latitude - Longitude:')).toBeTruthy();
      expect(getByText('37.7749 - -122.4194')).toBeTruthy();
    });

    it('should display speed in knots', () => {
      const { getByText } = render(<VesselDetailsScreen />);

      expect(getByText('Speed:')).toBeTruthy();
      expect(getByText('12.5 knots')).toBeTruthy();
    });

    it('should display course in degrees', () => {
      const { getByText } = render(<VesselDetailsScreen />);

      expect(getByText('Course:')).toBeTruthy();
      expect(getByText('180°')).toBeTruthy();
    });

    it('should display heading in degrees', () => {
      const { getByText } = render(<VesselDetailsScreen />);

      expect(getByText('Heading:')).toBeTruthy();
      expect(getByText('175°')).toBeTruthy();
    });

    it('should display last update timestamp', () => {
      const { getByText } = render(<VesselDetailsScreen />);

      expect(getByText('Last Update:')).toBeTruthy();
      // Timestamp will be formatted based on locale
      const timestamp = new Date('2024-01-15T10:30:00Z').toLocaleString();
      expect(getByText(timestamp)).toBeTruthy();
    });

    it('should display all basic information fields', () => {
      const { getByText } = render(<VesselDetailsScreen />);

      expect(getByText('MMSI:')).toBeTruthy();
      expect(getByText('Latitude - Longitude:')).toBeTruthy();
      expect(getByText('Speed:')).toBeTruthy();
      expect(getByText('Course:')).toBeTruthy();
      expect(getByText('Heading:')).toBeTruthy();
      expect(getByText('Last Update:')).toBeTruthy();
    });

    it('should handle zero speed correctly', () => {
      mockVesselMqttContext.vessels['123456789'].sog = 0;

      const { getByText } = render(<VesselDetailsScreen />);

      expect(getByText('0 knots')).toBeTruthy();
    });

    it('should handle null speed with default value', () => {
      mockVesselMqttContext.vessels['123456789'].sog = null;

      const { getByText } = render(<VesselDetailsScreen />);

      expect(getByText('0 knots')).toBeTruthy();
    });
  });

  /**
   * Test Case: APP-VES-003
   * Title: Close button functionality
   * Priority: High | Severity: Critical
   */
  describe('APP-VES-003: Close button functionality', () => {
    it('should call setCardVisible(false) when Close is pressed', () => {
      const { getByText } = render(<VesselDetailsScreen />);

      const closeButton = getByText('Close');
      fireEvent.press(closeButton);

      expect(mockVesselDetailsContext.setCardVisible).toHaveBeenCalledWith(false);
    });

    it('should call setDetailsVisible(false) when Close is pressed', () => {
      const { getByText } = render(<VesselDetailsScreen />);

      const closeButton = getByText('Close');
      fireEvent.press(closeButton);

      expect(mockVesselDetailsContext.setDetailsVisible).toHaveBeenCalledWith(false);
    });

    it('should reset both visibility states when Close is pressed', () => {
      const { getByText } = render(<VesselDetailsScreen />);

      const closeButton = getByText('Close');
      fireEvent.press(closeButton);

      expect(mockVesselDetailsContext.setCardVisible).toHaveBeenCalledWith(false);
      expect(mockVesselDetailsContext.setDetailsVisible).toHaveBeenCalledWith(false);
    });

    it('should not crash when Close button is pressed', () => {
      const { getByText } = render(<VesselDetailsScreen />);

      const closeButton = getByText('Close');

      expect(() => {
        fireEvent.press(closeButton);
      }).not.toThrow();
    });
  });

  /**
   * Test Case: APP-VES-004
   * Title: View Details button expands additional information
   * Priority: High | Severity: Major
   */
  describe('APP-VES-004: View Details button expands additional information', () => {
    it('should display View Details button when details are hidden', () => {
      mockVesselDetailsContext.detailsVisible = false;

      const { getByText } = render(<VesselDetailsScreen />);

      expect(getByText('View Details')).toBeTruthy();
    });

    it('should call setDetailsVisible(true) when View Details is pressed', () => {
      mockVesselDetailsContext.detailsVisible = false;

      const { getByText } = render(<VesselDetailsScreen />);

      const viewDetailsButton = getByText('View Details');
      fireEvent.press(viewDetailsButton);

      expect(mockVesselDetailsContext.setDetailsVisible).toHaveBeenCalledWith(true);
    });

    it('should display expanded details when detailsVisible is true', () => {
      mockVesselDetailsContext.detailsVisible = true;

      const { getByText } = render(<VesselDetailsScreen />);

      expect(getByText('Destination')).toBeTruthy();
      expect(getByText('San Francisco')).toBeTruthy();
    });

    it('should display destination in expanded details', () => {
      mockVesselDetailsContext.detailsVisible = true;

      const { getByText } = render(<VesselDetailsScreen />);

      expect(getByText('Destination')).toBeTruthy();
      expect(getByText('San Francisco')).toBeTruthy();
    });

    it('should display draught in expanded details', () => {
      mockVesselDetailsContext.detailsVisible = true;

      const { getByText } = render(<VesselDetailsScreen />);

      expect(getByText('Draught')).toBeTruthy();
      expect(getByText('8.5m')).toBeTruthy();
    });

    it('should display call sign in expanded details', () => {
      mockVesselDetailsContext.detailsVisible = true;

      const { getByText } = render(<VesselDetailsScreen />);

      expect(getByText('Call Sign')).toBeTruthy();
      expect(getByText('TEST123')).toBeTruthy();
    });

    it('should display ship type in expanded details', () => {
      mockVesselDetailsContext.detailsVisible = true;

      const { getByText } = render(<VesselDetailsScreen />);

      expect(getByText('Ship Type')).toBeTruthy();
      expect(getByText('Cargo')).toBeTruthy();
    });

    it('should not display expanded details when detailsVisible is false', () => {
      mockVesselDetailsContext.detailsVisible = false;

      const { queryByText } = render(<VesselDetailsScreen />);

      expect(queryByText('Destination')).toBeNull();
      expect(queryByText('Draught')).toBeNull();
    });
  });

  /**
   * Test Case: APP-VES-005
   * Title: Hide Details button collapses information
   * Priority: High | Severity: Major
   */
  describe('APP-VES-005: Hide Details button collapses information', () => {
    it('should display Hide Details button when details are visible', () => {
      mockVesselDetailsContext.detailsVisible = true;

      const { getByText } = render(<VesselDetailsScreen />);

      expect(getByText('Hide Details')).toBeTruthy();
    });

    it('should call setDetailsVisible(false) when Hide Details is pressed', () => {
      mockVesselDetailsContext.detailsVisible = true;

      const { getByText } = render(<VesselDetailsScreen />);

      const hideDetailsButton = getByText('Hide Details');
      fireEvent.press(hideDetailsButton);

      expect(mockVesselDetailsContext.setDetailsVisible).toHaveBeenCalledWith(false);
    });

    it('should toggle button text between View and Hide Details', () => {
      mockVesselDetailsContext.detailsVisible = false;

      const { getByText, rerender } = render(<VesselDetailsScreen />);

      expect(getByText('View Details')).toBeTruthy();

      // Change state to visible
      mockVesselDetailsContext.detailsVisible = true;
      rerender(<VesselDetailsScreen />);

      expect(getByText('Hide Details')).toBeTruthy();
    });

    it('should not crash when Hide Details is pressed', () => {
      mockVesselDetailsContext.detailsVisible = true;

      const { getByText } = render(<VesselDetailsScreen />);

      const hideDetailsButton = getByText('Hide Details');

      expect(() => {
        fireEvent.press(hideDetailsButton);
      }).not.toThrow();
    });
  });

  /**
   * Test Case: APP-VES-006
   * Title: Status badges display correctly
   * Priority: Medium | Severity: Major
   */
  describe('APP-VES-006: Status badges display correctly', () => {
    it('should display Active badge when vessel is moving', () => {
      mockVesselMqttContext.vessels['123456789'].sog = 12.5;

      const { getByText } = render(<VesselDetailsScreen />);

      expect(getByText('Active')).toBeTruthy();
    });

    it('should display Stationary badge when vessel speed is zero', () => {
      mockVesselMqttContext.vessels['123456789'].sog = 0;

      const { getByText } = render(<VesselDetailsScreen />);

      expect(getByText('Stationary')).toBeTruthy();
    });

    it('should display Normal badge when position accuracy is true', () => {
      mockVesselMqttContext.vessels['123456789'].posAcc = true;

      const { getByText } = render(<VesselDetailsScreen />);

      expect(getByText('Normal')).toBeTruthy();
    });

    it('should display Anomaly badge when position accuracy is false', () => {
      mockVesselMqttContext.vessels['123456789'].posAcc = false;

      const { getByText } = render(<VesselDetailsScreen />);

      expect(getByText('Anomaly')).toBeTruthy();
    });

    it('should display both status badges simultaneously', () => {
      mockVesselMqttContext.vessels['123456789'].sog = 10;
      mockVesselMqttContext.vessels['123456789'].posAcc = true;

      const { getByText } = render(<VesselDetailsScreen />);

      expect(getByText('Active')).toBeTruthy();
      expect(getByText('Normal')).toBeTruthy();
    });

    it('should handle null position accuracy as anomaly', () => {
      mockVesselMqttContext.vessels['123456789'].posAcc = null;

      const { getByText } = render(<VesselDetailsScreen />);

      expect(getByText('Anomaly')).toBeTruthy();
    });
  });

  /**
   * Test Case: APP-VES-007
   * Title: Vessel data updates in real-time
   * Priority: High | Severity: Major
   */
  describe('APP-VES-007: Vessel data updates in real-time', () => {
    it('should update displayed speed when vessel data changes', () => {
      const { getByText, rerender } = render(<VesselDetailsScreen />);

      expect(getByText('12.5 knots')).toBeTruthy();

      // Update vessel speed
      mockVesselMqttContext.vessels['123456789'].sog = 15.0;
      rerender(<VesselDetailsScreen />);

      expect(getByText('15 knots')).toBeTruthy();
    });

    it('should update displayed course when vessel data changes', () => {
      const { getByText, rerender } = render(<VesselDetailsScreen />);

      expect(getByText('180°')).toBeTruthy();

      // Update vessel course
      mockVesselMqttContext.vessels['123456789'].cog = 270;
      rerender(<VesselDetailsScreen />);

      expect(getByText('270°')).toBeTruthy();
    });

    it('should update status badge when speed changes to zero', () => {
      mockVesselMqttContext.vessels['123456789'].sog = 10;

      const { getByText, rerender } = render(<VesselDetailsScreen />);

      expect(getByText('Active')).toBeTruthy();

      // Update vessel to stationary
      mockVesselMqttContext.vessels['123456789'].sog = 0;
      rerender(<VesselDetailsScreen />);

      expect(getByText('Stationary')).toBeTruthy();
    });

    it('should update status badge when position accuracy changes', () => {
      mockVesselMqttContext.vessels['123456789'].posAcc = true;

      const { getByText, rerender } = render(<VesselDetailsScreen />);

      expect(getByText('Normal')).toBeTruthy();

      // Update to anomaly
      mockVesselMqttContext.vessels['123456789'].posAcc = false;
      rerender(<VesselDetailsScreen />);

      expect(getByText('Anomaly')).toBeTruthy();
    });

    it('should handle multiple re-renders without crash', () => {
      const { rerender } = render(<VesselDetailsScreen />);

      expect(() => {
        for (let i = 0; i < 5; i++) {
          rerender(<VesselDetailsScreen />);
        }
      }).not.toThrow();
    });
  });

  /**
   * Test Case: APP-VES-008
   * Title: Popup does not display when no vessel selected
   * Priority: High | Severity: Critical
   */
  describe('APP-VES-008: Popup does not display when no vessel selected', () => {
    it('should return null when vesselData is null', () => {
      mockVesselDetailsContext.vesselData = null;

      const { toJSON } = render(<VesselDetailsScreen />);

      expect(toJSON()).toBeNull();
    });

    it('should return null when vessel is not in vessels list', () => {
      mockVesselDetailsContext.vesselData = {
        properties: {
          mmsi: '999999999', // Non-existent vessel
        },
      };

      const { toJSON } = render(<VesselDetailsScreen />);

      expect(toJSON()).toBeNull();
    });

    it('should not display popup when cardVisible is false', () => {
      mockVesselDetailsContext.cardVisible = false;

      const { queryByText } = render(<VesselDetailsScreen />);

      expect(queryByText('Test Vessel')).toBeNull();
      expect(queryByText('Close')).toBeNull();
    });

    it('should not crash when rendering with null vessel data', () => {
      mockVesselDetailsContext.vesselData = null;

      expect(() => {
        render(<VesselDetailsScreen />);
      }).not.toThrow();
    });

    it('should not display any vessel information when no vessel selected', () => {
      mockVesselDetailsContext.vesselData = null;

      const { queryByText } = render(<VesselDetailsScreen />);

      expect(queryByText('MMSI:')).toBeNull();
      expect(queryByText('Speed:')).toBeNull();
      expect(queryByText('Course:')).toBeNull();
    });
  });

  /**
   * Additional Edge Case Tests
   */
  describe('Additional Edge Cases', () => {
    it('should handle missing metadata gracefully', () => {
      mockVesselMqttContext.metadata = {};

      const { getByText } = render(<VesselDetailsScreen />);

      // Should display MMSI instead of name
      expect(getByText('MMSI: 123456789')).toBeTruthy();
      // Should still display basic info
      expect(getByText('Speed:')).toBeTruthy();
    });

    it('should not display View Details button when metadata is missing', () => {
      mockVesselMqttContext.metadata = {};

      const { queryByText } = render(<VesselDetailsScreen />);

      expect(queryByText('View Details')).toBeNull();
    });

    it('should handle rapid button presses without crash', () => {
      const { getByText } = render(<VesselDetailsScreen />);

      const viewDetailsButton = getByText('View Details');
      const closeButton = getByText('Close');

      expect(() => {
        fireEvent.press(viewDetailsButton);
        fireEvent.press(closeButton);
        fireEvent.press(viewDetailsButton);
      }).not.toThrow();
    });

    it('should display all UI elements when fully loaded', () => {
      mockVesselDetailsContext.detailsVisible = true;

      const { getByText } = render(<VesselDetailsScreen />);

      const elements = [
        'Test Vessel',
        'Close',
        'Active',
        'Normal',
        'MMSI:',
        'Speed:',
        'Course:',
        'Heading:',
        'Destination',
        'Draught',
        'Call Sign',
        'Ship Type',
        'Hide Details',
      ];

      elements.forEach((text) => {
        expect(getByText(text)).toBeTruthy();
      });
    });
  });
});
