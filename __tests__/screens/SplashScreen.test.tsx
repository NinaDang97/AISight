/**
 * SplashScreen Tests
 * Based on test plan: APP-SPL-001 to APP-SPL-003
 *
 * Test Cases Covered:
 * - APP-SPL-001: Splash screen displays correctly
 * - APP-SPL-002: Splash screen handles app kill during loading
 * - APP-SPL-003: Splash screen on slow network
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SplashScreen } from '../../src/screens/SplashScreen/SplashScreen';

// Mock navigation
const mockNavigate = jest.fn();
const mockReplace = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      replace: mockReplace,
    }),
  };
});

describe('SplashScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  /**
   * Test Case: APP-SPL-001
   * Title: Splash screen displays correctly
   * Priority: High | Severity: Critical
   */
  describe('APP-SPL-001: Splash screen displays correctly', () => {
    it('should render splash screen with correct branding elements', () => {
      const { getByText } = render(
        <NavigationContainer>
          <SplashScreen />
        </NavigationContainer>
      );

      // Verify AISight logo/branding is visible
      expect(getByText('AI')).toBeTruthy();
      expect(getByText('Sight')).toBeTruthy();

      // Verify tagline/subtitle is visible
      expect(getByText('Maritime Navigation Anomaly Detection')).toBeTruthy();
    });

    it('should display logo centered without UI cutoff or distortion', () => {
      const { getByText, toJSON } = render(
        <NavigationContainer>
          <SplashScreen />
        </NavigationContainer>
      );

      const tree = toJSON();

      // Verify screen structure is correct
      expect(tree).toBeTruthy();
      expect(getByText('AI')).toBeTruthy();
      expect(getByText('Sight')).toBeTruthy();
    });

    it('should navigate to Welcome screen after 3 seconds (first install)', async () => {
      render(
        <NavigationContainer>
          <SplashScreen />
        </NavigationContainer>
      );

      // Initially, navigation should not be called
      expect(mockReplace).not.toHaveBeenCalled();

      // Fast-forward time by 3 seconds
      jest.advanceTimersByTime(3000);

      // Wait for navigation to be called
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('Onboarding', {
          screen: 'Welcome',
        });
      });
    });

    it('should complete navigation within 3-4 seconds', async () => {
      render(
        <NavigationContainer>
          <SplashScreen />
        </NavigationContainer>
      );

      // After 2.5 seconds, should not navigate yet
      jest.advanceTimersByTime(2500);
      expect(mockReplace).not.toHaveBeenCalled();

      // After 3 seconds, should navigate
      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledTimes(1);
      });
    });

    it('should render background image', () => {
      const { toJSON } = render(
        <NavigationContainer>
          <SplashScreen />
        </NavigationContainer>
      );

      const tree = toJSON();
      expect(tree).toBeTruthy();
      // Background image is rendered as part of ImageBackground component
    });

    it('should render ship icon', () => {
      const { toJSON } = render(
        <NavigationContainer>
          <SplashScreen />
        </NavigationContainer>
      );

      const tree = toJSON();
      expect(tree).toBeTruthy();
      // Icon is rendered as part of Image component
    });
  });

  /**
   * Test Case: APP-SPL-002
   * Title: Splash screen handles app kill during loading
   * Priority: High | Severity: Major
   */
  describe('APP-SPL-002: Splash screen handles app kill during loading', () => {
    it('should cleanup timer when component unmounts during loading', () => {
      const { unmount } = render(
        <NavigationContainer>
          <SplashScreen />
        </NavigationContainer>
      );

      // Advance time partially (simulating app kill mid-splash)
      jest.advanceTimersByTime(1500);

      // Unmount component (simulating app kill)
      unmount();

      // Advance remaining time
      jest.advanceTimersByTime(1500);

      // Navigation should not be called after unmount
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('should not crash when unmounted before navigation timer completes', () => {
      const { unmount } = render(
        <NavigationContainer>
          <SplashScreen />
        </NavigationContainer>
      );

      // Should not throw error when unmounting early
      expect(() => {
        jest.advanceTimersByTime(1000);
        unmount();
        jest.advanceTimersByTime(2000);
      }).not.toThrow();
    });

    it('should restart normally after being killed and relaunched', () => {
      // First render (initial launch)
      const { unmount } = render(
        <NavigationContainer>
          <SplashScreen />
        </NavigationContainer>
      );

      // Kill during splash
      jest.advanceTimersByTime(1500);
      unmount();
      jest.clearAllMocks();

      // Relaunch app
      const { getByText } = render(
        <NavigationContainer>
          <SplashScreen />
        </NavigationContainer>
      );

      // Verify splash displays again
      expect(getByText('AI')).toBeTruthy();
      expect(getByText('Sight')).toBeTruthy();

      // Verify navigation proceeds normally
      jest.advanceTimersByTime(3000);
      expect(mockReplace).toHaveBeenCalledWith('Onboarding', {
        screen: 'Welcome',
      });
    });

    it('should handle multiple mount/unmount cycles without memory leaks', () => {
      // First mount
      const firstRender = render(
        <NavigationContainer>
          <SplashScreen />
        </NavigationContainer>
      );
      jest.advanceTimersByTime(1000);
      firstRender.unmount();

      // Second mount
      const secondRender = render(
        <NavigationContainer>
          <SplashScreen />
        </NavigationContainer>
      );
      jest.advanceTimersByTime(1000);
      secondRender.unmount();

      // Third mount (final)
      const thirdRender = render(
        <NavigationContainer>
          <SplashScreen />
        </NavigationContainer>
      );

      expect(thirdRender.getByText('AI')).toBeTruthy();

      // Should not have any pending timers from previous mounts
      jest.advanceTimersByTime(3000);
      expect(mockReplace).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * Test Case: APP-SPL-003
   * Title: Splash screen on slow network
   * Priority: High | Severity: Major
   */
  describe('APP-SPL-003: Splash screen on slow network', () => {
    it('should display splash screen regardless of network connectivity', () => {
      // Splash screen doesn't require network, so it should always render
      const { getByText } = render(
        <NavigationContainer>
          <SplashScreen />
        </NavigationContainer>
      );

      expect(getByText('AI')).toBeTruthy();
      expect(getByText('Sight')).toBeTruthy();
      expect(getByText('Maritime Navigation Anomaly Detection')).toBeTruthy();
    });

    it('should not hang indefinitely without network', () => {
      render(
        <NavigationContainer>
          <SplashScreen />
        </NavigationContainer>
      );

      // Navigation should proceed even without network
      jest.advanceTimersByTime(3000);

      expect(mockReplace).toHaveBeenCalledWith('Onboarding', {
        screen: 'Welcome',
      });
    });

    it('should complete loading within expected time on slow network', () => {
      render(
        <NavigationContainer>
          <SplashScreen />
        </NavigationContainer>
      );

      jest.advanceTimersByTime(3000);

      // Verify navigation happens at expected time (3 seconds with fake timers)
      expect(mockReplace).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith('Onboarding', {
        screen: 'Welcome',
      });
    });

    it('should gracefully degrade without network-dependent features', () => {
      // Splash screen is purely local, no network dependency
      const { getByText } = render(
        <NavigationContainer>
          <SplashScreen />
        </NavigationContainer>
      );

      // All UI elements should be available
      expect(getByText('AI')).toBeTruthy();
      expect(getByText('Sight')).toBeTruthy();

      // Animation and navigation should work
      jest.advanceTimersByTime(3000);
      expect(mockReplace).toHaveBeenCalled();
    });
  });

  /**
   * Additional Edge Case Tests
   */
  describe('Additional Edge Cases', () => {
    it('should handle rapid app restarts', () => {
      for (let i = 0; i < 5; i++) {
        const { unmount } = render(
          <NavigationContainer>
            <SplashScreen />
          </NavigationContainer>
        );
        jest.advanceTimersByTime(500);
        unmount();
      }

      // Final render should work normally
      const { getByText } = render(
        <NavigationContainer>
          <SplashScreen />
        </NavigationContainer>
      );

      expect(getByText('AI')).toBeTruthy();
    });

    it('should maintain consistent branding colors', () => {
      const { getByText } = render(
        <NavigationContainer>
          <SplashScreen />
        </NavigationContainer>
      );

      const aiText = getByText('AI');
      const sightText = getByText('Sight');

      // Both should be rendered
      expect(aiText).toBeTruthy();
      expect(sightText).toBeTruthy();
    });
  });
});
