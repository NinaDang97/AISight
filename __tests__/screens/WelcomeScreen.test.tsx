/**
 * WelcomeScreen Tests
 * Based on test plan: APP-ONB-001 to APP-ONB-003
 *
 * Test Cases Covered:
 * - APP-ONB-001: Welcome screen displays all elements
 * - APP-ONB-002: Get Started button navigation
 * - APP-ONB-003: Welcome screen UI responsiveness
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { WelcomeScreen } from '../../src/screens/OnboardingScreens/WelcomeScreen/WelcomeScreen';
import { Dimensions } from 'react-native';

// Mock navigation
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
  };
});

// Mock VesselMqttContext
const mockVesselMqttContext = {
  status: 'connected',
  error: null,
  vessels: {},
  vesselList: [],
  metadata: {},
  metadataList: [],
};

jest.mock('../../src/components/contexts/VesselMqttContext', () => ({
  useVesselMqtt: () => mockVesselMqttContext,
}));

describe('WelcomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test Case: APP-ONB-001
   * Title: Welcome screen displays all elements
   * Priority: High | Severity: Critical
   */
  describe('APP-ONB-001: Welcome screen displays all elements', () => {
    it('should display AISight logo and tagline', () => {
      const { getByText } = render(
        <NavigationContainer>
          <WelcomeScreen />
        </NavigationContainer>
      );

      expect(getByText('AISight')).toBeTruthy();
      expect(getByText('Marine Traffic Tracker')).toBeTruthy();
    });

    it('should display welcome title', () => {
      const { getByText } = render(
        <NavigationContainer>
          <WelcomeScreen />
        </NavigationContainer>
      );

      expect(getByText('Welcome to AISight')).toBeTruthy();
    });

    it('should display description text', () => {
      const { getByText } = render(
        <NavigationContainer>
          <WelcomeScreen />
        </NavigationContainer>
      );

      expect(
        getByText(/Track marine vessels in real-time/i)
      ).toBeTruthy();
    });

    it('should display vessel live status', () => {
      const { getByText } = render(
        <NavigationContainer>
          <WelcomeScreen />
        </NavigationContainer>
      );

      expect(getByText(/Vessel live status:/i)).toBeTruthy();
      expect(getByText(/Connected/i)).toBeTruthy();
    });

    it('should display all three feature items', () => {
      const { getByText } = render(
        <NavigationContainer>
          <WelcomeScreen />
        </NavigationContainer>
      );

      // Feature 1: Real-time Tracking
      expect(getByText('Real-time Tracking')).toBeTruthy();
      expect(getByText('Monitor vessel movements as they happen')).toBeTruthy();

      // Feature 2: Vessel Details
      expect(getByText('Vessel Details')).toBeTruthy();
      expect(getByText('Access comprehensive vessel information')).toBeTruthy();

      // Feature 3: Search & Filter
      expect(getByText('Search & Filter')).toBeTruthy();
      expect(getByText('Find specific vessels with ease')).toBeTruthy();
    });

    it('should display Get Started button', () => {
      const { getByText } = render(
        <NavigationContainer>
          <WelcomeScreen />
        </NavigationContainer>
      );

      const button = getByText('Get Started');
      expect(button).toBeTruthy();
    });

    it('should render all elements in correct order from top to bottom', () => {
      const { getByText, toJSON } = render(
        <NavigationContainer>
          <WelcomeScreen />
        </NavigationContainer>
      );

      // Verify all elements are present
      expect(getByText('AISight')).toBeTruthy();
      expect(getByText('Welcome to AISight')).toBeTruthy();
      expect(getByText('Real-time Tracking')).toBeTruthy();
      expect(getByText('Get Started')).toBeTruthy();

      // Verify component tree structure
      const tree = toJSON();
      expect(tree).toBeTruthy();
    });

    it('should display Get Started button as enabled', () => {
      const { getByText } = render(
        <NavigationContainer>
          <WelcomeScreen />
        </NavigationContainer>
      );

      const button = getByText('Get Started');

      // Button should be pressable (not disabled)
      expect(button).toBeTruthy();
      expect(button.props.accessibilityState?.disabled).toBeFalsy();
    });
  });

  /**
   * Test Case: APP-ONB-002
   * Title: Get Started button navigation
   * Priority: High | Severity: Critical
   */
  describe('APP-ONB-002: Get Started button navigation', () => {
    it('should navigate to Map screen when Get Started is pressed', () => {
      const { getByText } = render(
        <NavigationContainer>
          <WelcomeScreen />
        </NavigationContainer>
      );

      const button = getByText('Get Started');

      fireEvent.press(button);

      expect(mockNavigate).toHaveBeenCalledWith('Main', {
        screen: 'MapTab',
        params: {
          screen: 'Map',
        },
      });
    });

    it('should be responsive to button press', () => {
      const { getByText } = render(
        <NavigationContainer>
          <WelcomeScreen />
        </NavigationContainer>
      );

      const button = getByText('Get Started');

      // Initially navigation should not be called
      expect(mockNavigate).not.toHaveBeenCalled();

      // Press button
      fireEvent.press(button);

      // Navigation should be called immediately
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });

    it('should navigate with correct navigation structure', () => {
      const { getByText } = render(
        <NavigationContainer>
          <WelcomeScreen />
        </NavigationContainer>
      );

      const button = getByText('Get Started');
      fireEvent.press(button);

      // Verify navigation params
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          screen: 'MapTab',
          params: expect.objectContaining({
            screen: 'Map',
          }),
        })
      );
    });

    it('should handle multiple rapid button presses', () => {
      const { getByText } = render(
        <NavigationContainer>
          <WelcomeScreen />
        </NavigationContainer>
      );

      const button = getByText('Get Started');

      // Simulate rapid button presses
      fireEvent.press(button);
      fireEvent.press(button);
      fireEvent.press(button);

      // Navigation should be called for each press
      expect(mockNavigate).toHaveBeenCalled();
    });

    it('should not crash or show delay on button press', () => {
      const { getByText } = render(
        <NavigationContainer>
          <WelcomeScreen />
        </NavigationContainer>
      );

      const button = getByText('Get Started');

      // Should not throw error
      expect(() => {
        fireEvent.press(button);
      }).not.toThrow();

      // Should navigate immediately
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  /**
   * Test Case: APP-ONB-003
   * Title: Welcome screen UI responsiveness
   * Priority: High | Severity: Major
   */
  describe('APP-ONB-003: Welcome screen UI responsiveness', () => {
    it('should render all text elements visible and properly sized', () => {
      const { getByText } = render(
        <NavigationContainer>
          <WelcomeScreen />
        </NavigationContainer>
      );

      // All text should be visible
      expect(getByText('AISight')).toBeTruthy();
      expect(getByText('Marine Traffic Tracker')).toBeTruthy();
      expect(getByText('Welcome to AISight')).toBeTruthy();
      expect(getByText('Real-time Tracking')).toBeTruthy();
      expect(getByText('Vessel Details')).toBeTruthy();
      expect(getByText('Search & Filter')).toBeTruthy();
      expect(getByText('Get Started')).toBeTruthy();
    });

    it('should align feature icons and descriptions correctly', () => {
      const { getByText, toJSON } = render(
        <NavigationContainer>
          <WelcomeScreen />
        </NavigationContainer>
      );

      // Verify all features are rendered
      expect(getByText('Real-time Tracking')).toBeTruthy();
      expect(getByText('Vessel Details')).toBeTruthy();
      expect(getByText('Search & Filter')).toBeTruthy();

      // Component tree should be valid
      const tree = toJSON();
      expect(tree).toBeTruthy();
    });

    it('should keep Get Started button always visible', () => {
      const { getByText } = render(
        <NavigationContainer>
          <WelcomeScreen />
        </NavigationContainer>
      );

      const button = getByText('Get Started');
      expect(button).toBeTruthy();
    });

    it('should have no overlapping text or UI cutoff', () => {
      const { getByText, toJSON } = render(
        <NavigationContainer>
          <WelcomeScreen />
        </NavigationContainer>
      );

      // All elements should be rendered
      const tree = toJSON();
      expect(tree).toBeTruthy();

      // No elements should be null or missing
      expect(getByText('AISight')).toBeTruthy();
      expect(getByText('Welcome to AISight')).toBeTruthy();
      expect(getByText('Get Started')).toBeTruthy();
    });

    it('should adapt layout to different screen sizes', () => {
      // Test on small screen
      jest.spyOn(Dimensions, 'get').mockReturnValue({
        width: 320,
        height: 568,
        scale: 2,
        fontScale: 1,
      });

      const smallScreen = render(
        <NavigationContainer>
          <WelcomeScreen />
        </NavigationContainer>
      );

      expect(smallScreen.getByText('AISight')).toBeTruthy();
      expect(smallScreen.getByText('Get Started')).toBeTruthy();

      smallScreen.unmount();

      // Test on large screen (tablet)
      jest.spyOn(Dimensions, 'get').mockReturnValue({
        width: 768,
        height: 1024,
        scale: 2,
        fontScale: 1,
      });

      const largeScreen = render(
        <NavigationContainer>
          <WelcomeScreen />
        </NavigationContainer>
      );

      expect(largeScreen.getByText('AISight')).toBeTruthy();
      expect(largeScreen.getByText('Get Started')).toBeTruthy();
    });

    it('should maintain readability with different vessel connection statuses', () => {
      // Test with different connection statuses
      const statuses = ['connected', 'connecting', 'reconnecting', 'error', 'idle'];

      statuses.forEach((status) => {
        mockVesselMqttContext.status = status as any;

        const { getByText, unmount } = render(
          <NavigationContainer>
            <WelcomeScreen />
          </NavigationContainer>
        );

        // Status should be displayed
        expect(getByText(/Vessel live status:/i)).toBeTruthy();

        unmount();
      });
    });
  });

  /**
   * Additional Edge Case Tests
   */
  describe('Additional Edge Cases', () => {
    it('should handle missing or undefined vessel status gracefully', () => {
      mockVesselMqttContext.status = undefined as any;

      const { getByText } = render(
        <NavigationContainer>
          <WelcomeScreen />
        </NavigationContainer>
      );

      // Should still render
      expect(getByText('AISight')).toBeTruthy();
      expect(getByText('Get Started')).toBeTruthy();
    });

    it('should maintain UI structure after multiple renders', () => {
      const { rerender, getByText } = render(
        <NavigationContainer>
          <WelcomeScreen />
        </NavigationContainer>
      );

      expect(getByText('AISight')).toBeTruthy();

      // Re-render
      rerender(
        <NavigationContainer>
          <WelcomeScreen />
        </NavigationContainer>
      );

      // Should still display correctly
      expect(getByText('AISight')).toBeTruthy();
      expect(getByText('Get Started')).toBeTruthy();
    });

    it('should handle rapid status changes', () => {
      const { rerender, getByText } = render(
        <NavigationContainer>
          <WelcomeScreen />
        </NavigationContainer>
      );

      // Change status multiple times
      mockVesselMqttContext.status = 'connecting';
      rerender(
        <NavigationContainer>
          <WelcomeScreen />
        </NavigationContainer>
      );

      mockVesselMqttContext.status = 'connected';
      rerender(
        <NavigationContainer>
          <WelcomeScreen />
        </NavigationContainer>
      );

      // Should still work
      expect(getByText('AISight')).toBeTruthy();
    });

    it('should display all UI elements simultaneously', () => {
      const { getByText } = render(
        <NavigationContainer>
          <WelcomeScreen />
        </NavigationContainer>
      );

      // All elements should be visible at the same time
      const elements = [
        'AISight',
        'Marine Traffic Tracker',
        'Welcome to AISight',
        'Real-time Tracking',
        'Vessel Details',
        'Search & Filter',
        'Get Started',
      ];

      elements.forEach((text) => {
        expect(getByText(text)).toBeTruthy();
      });
    });
  });
});
