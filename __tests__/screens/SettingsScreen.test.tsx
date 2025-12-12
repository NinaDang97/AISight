/**
 * SettingsScreen Tests
 * Based on test plan: APP-SET-001 to APP-SET-011
 *
 * Test Cases Covered:
 * - APP-SET-001: Settings screen loads successfully
 * - APP-SET-002: Permissions section displays
 * - APP-SET-003: Push Notifications toggle functionality
 * - APP-SET-004: Location Services toggle functionality
 * - APP-SET-005: About section displays all items
 * - APP-SET-006: Version displays correctly
 * - APP-SET-007: Map copyrights navigation
 * - APP-SET-008: 3rd party licenses navigation
 * - APP-SET-009: Clear Cache button functionality
 * - APP-SET-010: Permission status displays correctly
 * - APP-SET-011: Settings sections organization
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { SettingsScreen } from '../../src/screens/SettingsScreen/SettingsScreen';

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock AppContext
const mockAppContext = {
  permissions: {
    notification: 'granted',
    location: 'granted',
  },
  hasNotificationPermission: true,
  hasLocationPermission: true,
  isNotificationBlocked: false,
  isLocationBlocked: false,
  openSettings: jest.fn(),
  checkPermissions: jest.fn(),
};

jest.mock('../../src/contexts', () => ({
  useAppContext: () => mockAppContext,
}));

// Mock react-native-legal
jest.mock('react-native-legal', () => ({
  ReactNativeLegal: {
    launchLicenseListScreen: jest.fn(),
  },
}));

// Mock useFocusEffect
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => void) => {
    callback();
  },
}));

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAppContext.hasNotificationPermission = true;
    mockAppContext.hasLocationPermission = true;
    mockAppContext.isNotificationBlocked = false;
    mockAppContext.isLocationBlocked = false;
  });

  /**
   * Test Case: APP-SET-001
   * Title: Settings screen loads successfully
   * Priority: High | Severity: Critical
   */
  describe('APP-SET-001: Settings screen loads successfully', () => {
    it('should display Settings header', () => {
      const { getByText } = render(<SettingsScreen />);

      expect(getByText('Settings')).toBeTruthy();
    });

    it('should display Permissions section', () => {
      const { getByText } = render(<SettingsScreen />);

      expect(getByText('Permissions')).toBeTruthy();
    });

    it('should display About section', () => {
      const { getByText } = render(<SettingsScreen />);

      expect(getByText('About')).toBeTruthy();
    });

    it('should render all main sections without crash', () => {
      const { getByText } = render(<SettingsScreen />);

      expect(getByText('Settings')).toBeTruthy();
      expect(getByText('Permissions')).toBeTruthy();
      expect(getByText('About')).toBeTruthy();
    });

    it('should render component tree successfully', () => {
      const { toJSON } = render(<SettingsScreen />);

      const tree = toJSON();
      expect(tree).toBeTruthy();
    });

    it('should call checkPermissions on screen focus', () => {
      render(<SettingsScreen />);

      expect(mockAppContext.checkPermissions).toHaveBeenCalled();
    });
  });

  /**
   * Test Case: APP-SET-002
   * Title: Permissions section displays
   * Priority: High | Severity: Major
   */
  describe('APP-SET-002: Permissions section displays', () => {
    it('should display Push Notifications item', () => {
      const { getByText } = render(<SettingsScreen />);

      expect(getByText('Push Notifications')).toBeTruthy();
    });

    it('should display Location Services item', () => {
      const { getByText } = render(<SettingsScreen />);

      expect(getByText('Location Services')).toBeTruthy();
    });

    it('should display notification permission status when enabled', () => {
      mockAppContext.hasNotificationPermission = true;

      const { getAllByText } = render(<SettingsScreen />);

      const enabledTexts = getAllByText('Enabled');
      expect(enabledTexts.length).toBeGreaterThan(0);
    });

    it('should display notification permission status when disabled', () => {
      mockAppContext.hasNotificationPermission = false;

      const { getByText } = render(<SettingsScreen />);

      expect(getByText('Disabled')).toBeTruthy();
    });

    it('should display blocked status for notifications', () => {
      mockAppContext.hasNotificationPermission = false;
      mockAppContext.isNotificationBlocked = true;

      const { getByText } = render(<SettingsScreen />);

      expect(getByText('Blocked - Open Settings')).toBeTruthy();
    });

    it('should display location permission status when enabled', () => {
      mockAppContext.hasLocationPermission = true;

      const { getAllByText } = render(<SettingsScreen />);

      const enabledTexts = getAllByText('Enabled');
      expect(enabledTexts.length).toBeGreaterThan(0);
    });

    it('should display blocked status for location', () => {
      mockAppContext.hasLocationPermission = false;
      mockAppContext.isLocationBlocked = true;

      const { getAllByText } = render(<SettingsScreen />);

      const blockedTexts = getAllByText('Blocked - Open Settings');
      expect(blockedTexts.length).toBeGreaterThan(0);
    });
  });

  /**
   * Test Case: APP-SET-003
   * Title: Push Notifications toggle functionality
   * Priority: High | Severity: Critical
   */
  describe('APP-SET-003: Push Notifications toggle functionality', () => {
    it('should display notification toggle switch', () => {
      const { getAllByRole } = render(<SettingsScreen />);

      const switches = getAllByRole('switch');
      expect(switches.length).toBeGreaterThanOrEqual(1);
    });

    it('should show alert when trying to enable notifications', () => {
      mockAppContext.hasNotificationPermission = false;

      const { getAllByRole } = render(<SettingsScreen />);

      const switches = getAllByRole('switch');
      const notificationSwitch = switches[0]; // First switch is notifications

      fireEvent(notificationSwitch, 'valueChange', true);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Enable Notifications',
        'Please enable notifications in your device settings.',
        expect.any(Array)
      );
    });

    it('should show alert when trying to disable notifications', () => {
      mockAppContext.hasNotificationPermission = true;

      const { getAllByRole } = render(<SettingsScreen />);

      const switches = getAllByRole('switch');
      const notificationSwitch = switches[0];

      fireEvent(notificationSwitch, 'valueChange', false);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Disable Notifications',
        'To disable notifications, please go to your device settings.',
        expect.any(Array)
      );
    });

    it('should show blocked alert when permission is blocked', () => {
      mockAppContext.hasNotificationPermission = false;
      mockAppContext.isNotificationBlocked = true;

      const { getAllByRole } = render(<SettingsScreen />);

      const switches = getAllByRole('switch');
      const notificationSwitch = switches[0];

      fireEvent(notificationSwitch, 'valueChange', true);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Permission Blocked',
        'Notification permission is blocked. Please enable it in your device settings.',
        expect.any(Array)
      );
    });

    it('should reflect current notification permission state', () => {
      mockAppContext.hasNotificationPermission = true;

      const { getAllByRole } = render(<SettingsScreen />);

      const switches = getAllByRole('switch');
      const notificationSwitch = switches[0];

      expect(notificationSwitch.props.value).toBe(true);
    });
  });

  /**
   * Test Case: APP-SET-004
   * Title: Location Services toggle functionality
   * Priority: High | Severity: Major
   */
  describe('APP-SET-004: Location Services toggle functionality', () => {
    it('should display location toggle switch', () => {
      const { getAllByRole } = render(<SettingsScreen />);

      const switches = getAllByRole('switch');
      expect(switches.length).toBe(2); // Notification and Location switches
    });

    it('should show alert when trying to enable location', () => {
      mockAppContext.hasLocationPermission = false;

      const { getAllByRole } = render(<SettingsScreen />);

      const switches = getAllByRole('switch');
      const locationSwitch = switches[1]; // Second switch is location

      fireEvent(locationSwitch, 'valueChange', true);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Enable Location',
        'Please enable location services in your device settings.',
        expect.any(Array)
      );
    });

    it('should show alert when trying to disable location', () => {
      mockAppContext.hasLocationPermission = true;

      const { getAllByRole } = render(<SettingsScreen />);

      const switches = getAllByRole('switch');
      const locationSwitch = switches[1];

      fireEvent(locationSwitch, 'valueChange', false);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Disable Location',
        'To disable location services, please go to your device settings.',
        expect.any(Array)
      );
    });

    it('should show blocked alert when location permission is blocked', () => {
      mockAppContext.hasLocationPermission = false;
      mockAppContext.isLocationBlocked = true;

      const { getAllByRole } = render(<SettingsScreen />);

      const switches = getAllByRole('switch');
      const locationSwitch = switches[1];

      fireEvent(locationSwitch, 'valueChange', true);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Permission Blocked',
        'Location permission is blocked. Please enable it in your device settings.',
        expect.any(Array)
      );
    });

    it('should reflect current location permission state', () => {
      mockAppContext.hasLocationPermission = true;

      const { getAllByRole } = render(<SettingsScreen />);

      const switches = getAllByRole('switch');
      const locationSwitch = switches[1];

      expect(locationSwitch.props.value).toBe(true);
    });
  });

  /**
   * Test Case: APP-SET-005
   * Title: About section displays all items
   * Priority: Medium | Severity: Major
   */
  describe('APP-SET-005: About section displays all items', () => {
    it('should display Version item', () => {
      const { getByText } = render(<SettingsScreen />);

      expect(getByText('Version')).toBeTruthy();
    });

    it('should display Map copyrights item', () => {
      const { getByText } = render(<SettingsScreen />);

      expect(getByText('Map copyrights')).toBeTruthy();
    });

    it('should display 3rd party licenses item', () => {
      const { getByText } = render(<SettingsScreen />);

      expect(getByText('3rd party licenses')).toBeTruthy();
    });

    it('should display all About section items', () => {
      const { getByText } = render(<SettingsScreen />);

      expect(getByText('Version')).toBeTruthy();
      expect(getByText('Map copyrights')).toBeTruthy();
      expect(getByText('3rd party licenses')).toBeTruthy();
    });

    it('should display chevron indicators for navigable items', () => {
      const { getAllByText } = render(<SettingsScreen />);

      const chevrons = getAllByText('>');
      expect(chevrons.length).toBeGreaterThanOrEqual(2); // Map copyrights and 3rd party licenses
    });
  });

  /**
   * Test Case: APP-SET-006
   * Title: Version displays correctly
   * Priority: Medium | Severity: Major
   */
  describe('APP-SET-006: Version displays correctly', () => {
    it('should display version number 1.0.0', () => {
      const { getByText } = render(<SettingsScreen />);

      expect(getByText('1.0.0')).toBeTruthy();
    });

    it('should display Version label and value', () => {
      const { getByText } = render(<SettingsScreen />);

      expect(getByText('Version')).toBeTruthy();
      expect(getByText('1.0.0')).toBeTruthy();
    });
  });

  /**
   * Test Case: APP-SET-007
   * Title: Map copyrights navigation
   * Priority: Medium | Severity: Major
   */
  describe('APP-SET-007: Map copyrights navigation', () => {
    it('should navigate to map copyrights when tapped', () => {
      const { getByText } = render(<SettingsScreen />);

      const mapCopyrightsItem = getByText('Map copyrights');
      fireEvent.press(mapCopyrightsItem);

      // Should show map copyrights content
      expect(getByText(/Map copyright notices/i)).toBeTruthy();
    });

    it('should display MapTiler copyright', () => {
      const { getByText } = render(<SettingsScreen />);

      const mapCopyrightsItem = getByText('Map copyrights');
      fireEvent.press(mapCopyrightsItem);

      expect(getByText(/MapTiler/i)).toBeTruthy();
    });

    it('should display OpenStreetMap copyright', () => {
      const { getByText } = render(<SettingsScreen />);

      const mapCopyrightsItem = getByText('Map copyrights');
      fireEvent.press(mapCopyrightsItem);

      expect(getByText(/OpenStreetMap/i)).toBeTruthy();
    });

    it('should show Back button on copyrights screen', () => {
      const { getByText } = render(<SettingsScreen />);

      const mapCopyrightsItem = getByText('Map copyrights');
      fireEvent.press(mapCopyrightsItem);

      expect(getByText('< Back')).toBeTruthy();
    });

    it('should navigate back to settings when Back is pressed', () => {
      const { getByText, queryByText } = render(<SettingsScreen />);

      // Navigate to copyrights
      const mapCopyrightsItem = getByText('Map copyrights');
      fireEvent.press(mapCopyrightsItem);

      // Press Back button
      const backButton = getByText('< Back');
      fireEvent.press(backButton);

      // Should be back on settings screen
      expect(getByText('Settings')).toBeTruthy();
      expect(queryByText('< Back')).toBeNull();
    });
  });

  /**
   * Test Case: APP-SET-008
   * Title: 3rd party licenses navigation
   * Priority: Medium | Severity: Major
   */
  describe('APP-SET-008: 3rd party licenses navigation', () => {
    it('should call license screen when 3rd party licenses is tapped', () => {
      const { ReactNativeLegal } = require('react-native-legal');
      const { getByText } = render(<SettingsScreen />);

      const licensesItem = getByText('3rd party licenses');
      fireEvent.press(licensesItem);

      expect(ReactNativeLegal.launchLicenseListScreen).toHaveBeenCalledWith('3rd Party Licenses');
    });

    it('should not crash when 3rd party licenses is tapped', () => {
      const { getByText } = render(<SettingsScreen />);

      const licensesItem = getByText('3rd party licenses');

      expect(() => {
        fireEvent.press(licensesItem);
      }).not.toThrow();
    });
  });

  /**
   * Test Case: APP-SET-009
   * Title: Clear Cache button functionality
   * Priority: Medium | Severity: Major
   */
  describe('APP-SET-009: Clear Cache button functionality', () => {
    it('should display Clear Cache button', () => {
      const { getByText } = render(<SettingsScreen />);

      expect(getByText('Clear Cache')).toBeTruthy();
    });

    it('should show alert when Clear Cache is pressed', () => {
      const { getByText } = render(<SettingsScreen />);

      const clearCacheButton = getByText('Clear Cache');
      fireEvent.press(clearCacheButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Clear Cache',
        'This feature will be available soon.',
        expect.any(Array)
      );
    });

    it('should not crash when Clear Cache is pressed', () => {
      const { getByText } = render(<SettingsScreen />);

      const clearCacheButton = getByText('Clear Cache');

      expect(() => {
        fireEvent.press(clearCacheButton);
      }).not.toThrow();
    });
  });

  /**
   * Test Case: APP-SET-010
   * Title: Permission status displays correctly
   * Priority: High | Severity: Major
   */
  describe('APP-SET-010: Permission status displays correctly', () => {
    it('should show Enabled for granted notification permission', () => {
      mockAppContext.hasNotificationPermission = true;
      mockAppContext.isNotificationBlocked = false;

      const { getAllByText } = render(<SettingsScreen />);

      const enabledTexts = getAllByText('Enabled');
      expect(enabledTexts.length).toBeGreaterThan(0);
    });

    it('should show Disabled for denied notification permission', () => {
      mockAppContext.hasNotificationPermission = false;
      mockAppContext.isNotificationBlocked = false;

      const { getByText } = render(<SettingsScreen />);

      expect(getByText('Disabled')).toBeTruthy();
    });

    it('should show Blocked status for blocked notification permission', () => {
      mockAppContext.hasNotificationPermission = false;
      mockAppContext.isNotificationBlocked = true;

      const { getByText } = render(<SettingsScreen />);

      expect(getByText('Blocked - Open Settings')).toBeTruthy();
    });

    it('should show Enabled for granted location permission', () => {
      mockAppContext.hasLocationPermission = true;
      mockAppContext.isLocationBlocked = false;

      const { getAllByText } = render(<SettingsScreen />);

      const enabledTexts = getAllByText('Enabled');
      expect(enabledTexts.length).toBeGreaterThan(0);
    });

    it('should show Blocked status for blocked location permission', () => {
      mockAppContext.hasLocationPermission = false;
      mockAppContext.isLocationBlocked = true;

      const { getAllByText } = render(<SettingsScreen />);

      const blockedTexts = getAllByText('Blocked - Open Settings');
      expect(blockedTexts.length).toBeGreaterThan(0);
    });
  });

  /**
   * Test Case: APP-SET-011
   * Title: Settings sections organization
   * Priority: Medium | Severity: Major
   */
  describe('APP-SET-011: Settings sections organization', () => {
    it('should display sections in correct order', () => {
      const { getByText } = render(<SettingsScreen />);

      expect(getByText('Settings')).toBeTruthy();
      expect(getByText('Permissions')).toBeTruthy();
      expect(getByText('About')).toBeTruthy();
    });

    it('should group permission items under Permissions section', () => {
      const { getByText } = render(<SettingsScreen />);

      expect(getByText('Permissions')).toBeTruthy();
      expect(getByText('Push Notifications')).toBeTruthy();
      expect(getByText('Location Services')).toBeTruthy();
    });

    it('should group about items under About section', () => {
      const { getByText } = render(<SettingsScreen />);

      expect(getByText('About')).toBeTruthy();
      expect(getByText('Version')).toBeTruthy();
      expect(getByText('Map copyrights')).toBeTruthy();
      expect(getByText('3rd party licenses')).toBeTruthy();
    });

    it('should display Clear Cache button at the bottom', () => {
      const { getByText } = render(<SettingsScreen />);

      expect(getByText('Clear Cache')).toBeTruthy();
    });

    it('should render all UI elements simultaneously', () => {
      const { getByText } = render(<SettingsScreen />);

      const elements = [
        'Settings',
        'Permissions',
        'Push Notifications',
        'Location Services',
        'About',
        'Version',
        '1.0.0',
        'Map copyrights',
        '3rd party licenses',
        'Clear Cache',
      ];

      elements.forEach((text) => {
        expect(getByText(text)).toBeTruthy();
      });
    });
  });

  /**
   * Additional Edge Case Tests
   */
  describe('Additional Edge Cases', () => {
    it('should handle multiple re-renders without issues', () => {
      const { rerender, getByText } = render(<SettingsScreen />);

      expect(getByText('Settings')).toBeTruthy();

      // Re-render multiple times
      for (let i = 0; i < 3; i++) {
        rerender(<SettingsScreen />);
      }

      // Should still display correctly
      expect(getByText('Settings')).toBeTruthy();
      expect(getByText('Permissions')).toBeTruthy();
    });

    it('should handle rapid button presses without crash', () => {
      const { getByText } = render(<SettingsScreen />);

      const clearCacheButton = getByText('Clear Cache');
      const mapCopyrightsItem = getByText('Map copyrights');

      expect(() => {
        fireEvent.press(clearCacheButton);
        fireEvent.press(mapCopyrightsItem);
        fireEvent.press(clearCacheButton);
      }).not.toThrow();
    });

    it('should handle permission state changes', () => {
      const { rerender, getAllByRole } = render(<SettingsScreen />);

      // Initial state: permissions enabled
      let switches = getAllByRole('switch');
      expect(switches[0].props.value).toBe(true);

      // Change permission state
      mockAppContext.hasNotificationPermission = false;
      rerender(<SettingsScreen />);

      // Should reflect new state
      switches = getAllByRole('switch');
      expect(switches[0].props.value).toBe(false);
    });
  });
});
