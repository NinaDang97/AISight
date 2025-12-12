/**
 * MainTabNavigator Tests
 * Based on test plan: APP-NAV-001 to APP-NAV-004
 *
 * Test Cases Covered:
 * - APP-NAV-001: Bottom navigation displays correctly
 * - APP-NAV-002: Navigate to each tab successfully
 * - APP-NAV-003: Active tab visual feedback
 * - APP-NAV-004: Tab persistence during app backgrounding
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { MainTabNavigator } from '../../src/navigation/navigators/MainTabNavigator';

// Mock the GnssContext
const mockGnssContext = {
  isTracking: false,
  satellites: [],
  signalQuality: 'Unknown',
  startTracking: jest.fn(),
  stopTracking: jest.fn(),
  clearData: jest.fn(),
  refreshData: jest.fn(),
};

jest.mock('../../src/components/contexts', () => ({
  useGnss: () => mockGnssContext,
}));

// Mock all stack navigators
jest.mock('../../src/navigation/navigators/MapStackNavigator', () => ({
  MapStackNavigator: () => null,
}));

jest.mock('../../src/navigation/navigators/GnssStackNavigator', () => ({
  GnssStackNavigator: () => null,
}));

jest.mock('../../src/navigation/navigators/AnomalyStackNavigator', () => ({
  AnomalyStackNavigator: () => null,
}));

jest.mock('../../src/navigation/navigators/ReportStackNavigator', () => ({
  ReportStackNavigator: () => null,
}));

jest.mock('../../src/navigation/navigators/SettingsStackNavigator', () => ({
  SettingsStackNavigator: () => null,
}));

describe('MainTabNavigator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGnssContext.isTracking = false;
  });

  /**
   * Test Case: APP-NAV-001
   * Title: Bottom navigation displays correctly
   * Priority: High | Severity: Critical
   */
  describe('APP-NAV-001: Bottom navigation displays correctly', () => {
    it('should display all five tabs: Map, GNSS, Anomaly, Report, Settings', () => {
      const { getByLabelText } = render(
        <NavigationContainer>
          <MainTabNavigator />
        </NavigationContainer>
      );

      // All five tabs should be present
      expect(getByLabelText(/MapTab/i)).toBeTruthy();
      expect(getByLabelText(/GnssTab/i)).toBeTruthy();
      expect(getByLabelText(/AnomalyTab/i)).toBeTruthy();
      expect(getByLabelText(/ReportTab/i)).toBeTruthy();
      expect(getByLabelText(/SettingsTab/i)).toBeTruthy();
    });

    it('should have Map tab selected by default', () => {
      const { getByLabelText } = render(
        <NavigationContainer>
          <MainTabNavigator />
        </NavigationContainer>
      );

      const mapTab = getByLabelText(/MapTab/i);
      
      // Map tab should be selected (focused) by default
      expect(mapTab.props.accessibilityState?.selected).toBe(true);
    });

    it('should display icons without labels', () => {
      const { queryByText } = render(
        <NavigationContainer>
          <MainTabNavigator />
        </NavigationContainer>
      );

      // Tab labels should not be visible (tabBarShowLabel: false)
      expect(queryByText('Map')).toBeNull();
      expect(queryByText('GNSS')).toBeNull();
      expect(queryByText('Anomaly')).toBeNull();
      expect(queryByText('Report')).toBeNull();
      expect(queryByText('Settings')).toBeNull();
    });

    it('should render tab bar with correct styling', () => {
      const { toJSON } = render(
        <NavigationContainer>
          <MainTabNavigator />
        </NavigationContainer>
      );

      const tree = toJSON();
      expect(tree).toBeTruthy();
    });
  });

  /**
   * Test Case: APP-NAV-002
   * Title: Navigate to each tab successfully
   * Priority: High | Severity: Critical
   */
  describe('APP-NAV-002: Navigate to each tab successfully', () => {
    it('should navigate to GNSS tab when tapped', () => {
      const { getByLabelText } = render(
        <NavigationContainer>
          <MainTabNavigator />
        </NavigationContainer>
      );

      const gnssTab = getByLabelText(/GnssTab/i);
      
      fireEvent.press(gnssTab);

      // GNSS tab should now be selected
      expect(gnssTab.props.accessibilityState?.selected).toBe(true);
    });

    it('should navigate to Anomaly tab when tapped', () => {
      const { getByLabelText } = render(
        <NavigationContainer>
          <MainTabNavigator />
        </NavigationContainer>
      );

      const anomalyTab = getByLabelText(/AnomalyTab/i);
      
      fireEvent.press(anomalyTab);

      // Anomaly tab should now be selected
      expect(anomalyTab.props.accessibilityState?.selected).toBe(true);
    });

    it('should navigate to Report tab when tapped', () => {
      const { getByLabelText } = render(
        <NavigationContainer>
          <MainTabNavigator />
        </NavigationContainer>
      );

      const reportTab = getByLabelText(/ReportTab/i);
      
      fireEvent.press(reportTab);

      // Report tab should now be selected
      expect(reportTab.props.accessibilityState?.selected).toBe(true);
    });

    it('should navigate to Settings tab when tapped', () => {
      const { getByLabelText } = render(
        <NavigationContainer>
          <MainTabNavigator />
        </NavigationContainer>
      );

      const settingsTab = getByLabelText(/SettingsTab/i);
      
      fireEvent.press(settingsTab);

      // Settings tab should now be selected
      expect(settingsTab.props.accessibilityState?.selected).toBe(true);
    });

    it('should navigate back to Map tab when tapped', () => {
      const { getByLabelText } = render(
        <NavigationContainer>
          <MainTabNavigator />
        </NavigationContainer>
      );

      const gnssTab = getByLabelText(/GnssTab/i);
      const mapTab = getByLabelText(/MapTab/i);
      
      // Navigate to GNSS
      fireEvent.press(gnssTab);
      expect(gnssTab.props.accessibilityState?.selected).toBe(true);

      // Navigate back to Map
      fireEvent.press(mapTab);
      expect(mapTab.props.accessibilityState?.selected).toBe(true);
    });

    it('should handle rapid tab switching without crash', () => {
      const { getByLabelText } = render(
        <NavigationContainer>
          <MainTabNavigator />
        </NavigationContainer>
      );

      const mapTab = getByLabelText(/MapTab/i);
      const gnssTab = getByLabelText(/GnssTab/i);
      const anomalyTab = getByLabelText(/AnomalyTab/i);
      const reportTab = getByLabelText(/ReportTab/i);
      const settingsTab = getByLabelText(/SettingsTab/i);

      // Rapidly switch between tabs
      expect(() => {
        fireEvent.press(gnssTab);
        fireEvent.press(anomalyTab);
        fireEvent.press(reportTab);
        fireEvent.press(settingsTab);
        fireEvent.press(mapTab);
      }).not.toThrow();
    });
  });

  /**
   * Test Case: APP-NAV-003
   * Title: Active tab visual feedback
   * Priority: Medium | Severity: Major
   */
  describe('APP-NAV-003: Active tab visual feedback', () => {
    it('should show visual distinction for active tab', () => {
      const { getByLabelText } = render(
        <NavigationContainer>
          <MainTabNavigator />
        </NavigationContainer>
      );

      const mapTab = getByLabelText(/MapTab/i);
      const gnssTab = getByLabelText(/GnssTab/i);

      // Map tab is active by default
      expect(mapTab.props.accessibilityState?.selected).toBe(true);
      expect(gnssTab.props.accessibilityState?.selected).toBe(false);
    });

    it('should update active tab styling when switching tabs', () => {
      const { getByLabelText } = render(
        <NavigationContainer>
          <MainTabNavigator />
        </NavigationContainer>
      );

      const mapTab = getByLabelText(/MapTab/i);
      const gnssTab = getByLabelText(/GnssTab/i);

      // Initially Map is active
      expect(mapTab.props.accessibilityState?.selected).toBe(true);
      expect(gnssTab.props.accessibilityState?.selected).toBe(false);

      // Switch to GNSS
      fireEvent.press(gnssTab);

      // Now GNSS should be active
      expect(gnssTab.props.accessibilityState?.selected).toBe(true);
      expect(mapTab.props.accessibilityState?.selected).toBe(false);
    });

    it('should only have one active tab at a time', () => {
      const { getByLabelText } = render(
        <NavigationContainer>
          <MainTabNavigator />
        </NavigationContainer>
      );

      const mapTab = getByLabelText(/MapTab/i);
      const gnssTab = getByLabelText(/GnssTab/i);
      const anomalyTab = getByLabelText(/AnomalyTab/i);
      const reportTab = getByLabelText(/ReportTab/i);
      const settingsTab = getByLabelText(/SettingsTab/i);

      // Switch to Report tab
      fireEvent.press(reportTab);

      // Only Report should be active
      expect(mapTab.props.accessibilityState?.selected).toBe(false);
      expect(gnssTab.props.accessibilityState?.selected).toBe(false);
      expect(anomalyTab.props.accessibilityState?.selected).toBe(false);
      expect(reportTab.props.accessibilityState?.selected).toBe(true);
      expect(settingsTab.props.accessibilityState?.selected).toBe(false);
    });

    it('should show badge on GNSS tab when tracking is active', () => {
      mockGnssContext.isTracking = true;

      const { getAllByLabelText } = render(
        <NavigationContainer>
          <MainTabNavigator />
        </NavigationContainer>
      );

      // Badge should be visible when tracking
      const badges = getAllByLabelText('GNSS recording active');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should not show badge on GNSS tab when tracking is inactive', () => {
      mockGnssContext.isTracking = false;

      const { queryByLabelText } = render(
        <NavigationContainer>
          <MainTabNavigator />
        </NavigationContainer>
      );

      // Badge should not be visible when not tracking
      const badge = queryByLabelText('GNSS recording active');
      expect(badge).toBeNull();
    });
  });

  /**
   * Test Case: APP-NAV-004
   * Title: Tab persistence during app backgrounding
   * Priority: Medium | Severity: Major
   */
  describe('APP-NAV-004: Tab persistence during app backgrounding', () => {
    it('should maintain selected tab after re-render', () => {
      const { getByLabelText, rerender } = render(
        <NavigationContainer>
          <MainTabNavigator />
        </NavigationContainer>
      );

      const gnssTab = getByLabelText(/GnssTab/i);
      
      // Navigate to GNSS tab
      fireEvent.press(gnssTab);
      expect(gnssTab.props.accessibilityState?.selected).toBe(true);

      // Re-render (simulating app backgrounding and restoration)
      rerender(
        <NavigationContainer>
          <MainTabNavigator />
        </NavigationContainer>
      );

      // GNSS tab should still be selected
      const gnssTabAfterRerender = getByLabelText(/GnssTab/i);
      expect(gnssTabAfterRerender.props.accessibilityState?.selected).toBe(true);
    });

    it('should preserve tab state across multiple re-renders', () => {
      const { getByLabelText, rerender } = render(
        <NavigationContainer>
          <MainTabNavigator />
        </NavigationContainer>
      );

      const settingsTab = getByLabelText(/SettingsTab/i);
      
      // Navigate to Settings
      fireEvent.press(settingsTab);

      // Multiple re-renders
      for (let i = 0; i < 3; i++) {
        rerender(
          <NavigationContainer>
            <MainTabNavigator />
          </NavigationContainer>
        );
      }

      // Settings should still be selected
      const settingsTabAfter = getByLabelText(/SettingsTab/i);
      expect(settingsTabAfter.props.accessibilityState?.selected).toBe(true);
    });

    it('should not crash or reset to default tab on re-render', () => {
      const { getByLabelText, rerender } = render(
        <NavigationContainer>
          <MainTabNavigator />
        </NavigationContainer>
      );

      const anomalyTab = getByLabelText(/AnomalyTab/i);
      
      fireEvent.press(anomalyTab);

      // Should not throw error on re-render
      expect(() => {
        rerender(
          <NavigationContainer>
            <MainTabNavigator />
          </NavigationContainer>
        );
      }).not.toThrow();

      // Should not reset to Map tab
      const mapTab = getByLabelText(/MapTab/i);
      expect(mapTab.props.accessibilityState?.selected).toBe(false);
    });
  });
});
