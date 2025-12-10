/**
 * MapScreen Component Tests
 * Test file location: __tests__/screens/MapScreen.test.tsx
 *
 * Test Coverage:
 * - MAPSCREEN-INIT-001: MapScreen renders without crashing
 * - MAPSCREEN-INIT-002: MapScreen renders Map and VesselDetailsScreen
 * - MAPSCREEN-NOTIF-001: Notification modal shows after delay when prompt enabled
 * - MAPSCREEN-NOTIF-002: Notification modal hidden when permission prompt disabled
 * - MAPSCREEN-NOTIF-003: Allow button opens settings and checks permissions
 * - MAPSCREEN-NOTIF-004: Deny button closes modal without opening settings
 * - MAPSCREEN-LAYOUT-001: SafeAreaWrapper applied with correct props
 * - MAPSCREEN-CONTEXT-001: VesselDetailsProvider wraps Map component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { MapScreen } from '../../src/screens/MapScreen/MapScreen';
import { useAppContext } from '../../src/contexts';
import { usePermissions } from '../../src/hooks';
import Map from '../../src/map/Map';
import { VesselDetailsScreen } from '../../src/screens/VesselDetailsScreen';
import { VesselDetailsProvider } from '../../src/components/contexts/VesselDetailsContext';

// ============================================================================
// SETUP: Mocks
// ============================================================================

jest.mock('../../src/hooks');
jest.mock('../../src/contexts');
jest.mock('../../src/map/Map', () => {
  return function MockMap() {
    return <div testID="MockMap" />;
  };
});

jest.mock('../../src/screens/VesselDetailsScreen', () => {
  return {
    VesselDetailsScreen: function MockVesselDetailsScreen() {
      return <div testID="MockVesselDetailsScreen" />;
    },
  };
});

jest.mock('../../src/components/contexts/VesselDetailsContext', () => {
  const React = require('react');
  return {
    VesselDetailsProvider: ({ children }: any) => (
      <div testID="VesselDetailsProviderWrapper">{children}</div>
    ),
    useVesselDetails: jest.fn(),
  };
});

jest.mock('../../src/components/common/SafeAreaWrapper', () => {
  const React = require('react');
  return {
    SafeAreaWrapper: ({ children, backgroundColor, barStyle, edges }: any) => (
      <div
        testID="SafeAreaWrapper"
        data-background-color={backgroundColor}
        data-bar-style={barStyle}
        data-edges={edges?.join(',')}
      >
        {children}
      </div>
    ),
  };
});

jest.mock('../../src/components/modals/PermissionModals', () => {
  const React = require('react');
  const { View, Button } = require('react-native');

  return {
    NotificationPermissionModal: ({ visible, onAllow, onDeny }: any) =>
      visible ? (
        <View testID="notificationPermissionModal">
          <Button
            title="Allow"
            testID="notificationPermissionModalAllow"
            onPress={() => onAllow && onAllow()}
          />
          <Button
            title="Deny"
            testID="notificationPermissionModalDeny"
            onPress={() => onDeny && onDeny()}
          />
        </View>
      ) : null,
  };
});

// ============================================================================
// TYPE DEFINITIONS & MOCK SETUP
// ============================================================================

const mockUseAppContext = useAppContext as jest.Mock;
const mockUsePermissions = usePermissions as jest.Mock;

// ============================================================================
// TEST SUITE
// ============================================================================

describe('MapScreen Component', () => {
  // Setup/Teardown
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.spyOn(console, 'log').mockImplementation(() => {});

    // Default mock values
    mockUseAppContext.mockReturnValue({
      shouldShowNotificationPrompt: false,
      openSettings: jest.fn(),
      checkPermissions: jest.fn(),
    });

    mockUsePermissions.mockReturnValue({
      hasLocationPermission: false,
      requestLocation: jest.fn(),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  // =========================================================================
  // MAPSCREEN-INIT: Initial Render Tests
  // =========================================================================

  describe('MAPSCREEN-INIT: Initial Render', () => {
    it('MAPSCREEN-INIT-001: should render MapScreen without crashing', () => {
      const { root } = render(<MapScreen />);
      expect(root).toBeTruthy();
    });

    it('MAPSCREEN-INIT-002: should render Map and VesselDetailsScreen components', () => {
      render(<MapScreen />);

      expect(screen.getByTestId('MockMap')).toBeTruthy();
      expect(screen.getByTestId('MockVesselDetailsScreen')).toBeTruthy();
    });
  });

  // =========================================================================
  // MAPSCREEN-LAYOUT: Layout & Structure Tests
  // =========================================================================

  describe('MAPSCREEN-LAYOUT: Layout and Structure', () => {
    it('MAPSCREEN-LAYOUT-001: should wrap content with SafeAreaWrapper', () => {
      render(<MapScreen />);

      const safeAreaWrapper = screen.getByTestId('SafeAreaWrapper');
      expect(safeAreaWrapper).toBeTruthy();
    });

    it('should apply correct SafeAreaWrapper props', () => {
      render(<MapScreen />);

      const safeAreaWrapper = screen.getByTestId('SafeAreaWrapper');
      expect(safeAreaWrapper).toHaveAttribute('data-background-color', 'transparent');
      expect(safeAreaWrapper).toHaveAttribute('data-bar-style', 'dark-content');
      expect(safeAreaWrapper).toHaveAttribute('data-edges', 'bottom,left,right');
    });

    it('MAPSCREEN-CONTEXT-001: should wrap Map with VesselDetailsProvider', () => {
      render(<MapScreen />);

      const providerWrapper = screen.getByTestId('VesselDetailsProviderWrapper');
      expect(providerWrapper).toBeTruthy();

      // Verify Map is inside provider
      const providerContent = providerWrapper.innerHTML;
      expect(providerContent).toContain('MockMap');
    });
  });

  // =========================================================================
  // MAPSCREEN-NOTIF: Notification Modal Tests
  // =========================================================================

  describe('MAPSCREEN-NOTIF: Notification Modal', () => {
    it('MAPSCREEN-NOTIF-001: should show notification modal after delay when prompt enabled', async () => {
      const mockCheckPermissions = jest.fn();

      mockUseAppContext.mockReturnValue({
        shouldShowNotificationPrompt: true,
        openSettings: jest.fn(),
        checkPermissions: mockCheckPermissions,
      });

      render(<MapScreen />);

      // Modal should not be visible immediately
      expect(screen.queryByTestId('notificationPermissionModal')).toBeNull();

      // Advance timers to trigger the effect
      jest.advanceTimersByTime(2000);

      // Now modal should appear
      await waitFor(() => {
        expect(screen.getByTestId('notificationPermissionModal')).toBeTruthy();
      });

      // Verify checkPermissions was called
      expect(mockCheckPermissions).toHaveBeenCalled();
    });

    it('MAPSCREEN-NOTIF-002: should hide notification modal when prompt disabled', async () => {
      const mockCheckPermissions = jest.fn();

      mockUseAppContext.mockReturnValue({
        shouldShowNotificationPrompt: false,
        openSettings: jest.fn(),
        checkPermissions: mockCheckPermissions,
      });

      render(<MapScreen />);

      jest.advanceTimersByTime(2000);

      // Modal should remain hidden
      await waitFor(() => {
        expect(screen.queryByTestId('notificationPermissionModal')).toBeNull();
      });
    });

    it('MAPSCREEN-NOTIF-003: should open settings and check permissions when Allow pressed', async () => {
      const mockCheckPermissions = jest.fn();
      const mockOpenSettings = jest.fn().mockResolvedValue(true);

      mockUseAppContext.mockReturnValue({
        shouldShowNotificationPrompt: true,
        openSettings: mockOpenSettings,
        checkPermissions: mockCheckPermissions,
      });

      render(<MapScreen />);

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByTestId('notificationPermissionModal')).toBeTruthy();
      });

      // Press Allow button
      fireEvent.press(screen.getByTestId('notificationPermissionModalAllow'));

      // Verify openSettings was called
      expect(mockOpenSettings).toHaveBeenCalled();

      // Verify modal is closed
      await waitFor(() => {
        expect(screen.queryByTestId('notificationPermissionModal')).toBeNull();
      });

      // Verify checkPermissions is called after delay
      jest.advanceTimersByTime(500);
      expect(mockCheckPermissions).toHaveBeenCalled();
    });

    it('MAPSCREEN-NOTIF-004: should close modal without opening settings when Deny pressed', async () => {
      const mockOpenSettings = jest.fn();
      const mockCheckPermissions = jest.fn();

      mockUseAppContext.mockReturnValue({
        shouldShowNotificationPrompt: true,
        openSettings: mockOpenSettings,
        checkPermissions: mockCheckPermissions,
      });

      render(<MapScreen />);

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByTestId('notificationPermissionModal')).toBeTruthy();
      });

      // Press Deny button
      fireEvent.press(screen.getByTestId('notificationPermissionModalDeny'));

      // Verify openSettings was NOT called
      expect(mockOpenSettings).not.toHaveBeenCalled();

      // Verify modal is closed
      await waitFor(() => {
        expect(screen.queryByTestId('notificationPermissionModal')).toBeNull();
      });
    });

    it('should cleanup timer on unmount', () => {
      const mockCheckPermissions = jest.fn();
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      mockUseAppContext.mockReturnValue({
        shouldShowNotificationPrompt: true,
        openSettings: jest.fn(),
        checkPermissions: mockCheckPermissions,
      });

      const { unmount } = render(<MapScreen />);

      unmount();

      // Verify timeout was cleared
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });
  });

  // =========================================================================
  // MAPSCREEN-BEHAVIOR: User Interaction Tests
  // =========================================================================

  describe('MAPSCREEN-BEHAVIOR: User Interactions', () => {
    it('should log message when notification permission denied', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log');

      mockUseAppContext.mockReturnValue({
        shouldShowNotificationPrompt: true,
        openSettings: jest.fn(),
        checkPermissions: jest.fn(),
      });

      render(<MapScreen />);

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByTestId('notificationPermissionModal')).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId('notificationPermissionModalDeny'));

      expect(consoleLogSpy).toHaveBeenCalledWith('Notification permission denied');

      consoleLogSpy.mockRestore();
    });

    it('should handle rapid Allow button clicks (only process first)', async () => {
      const mockOpenSettings = jest.fn().mockResolvedValue(true);
      const mockCheckPermissions = jest.fn();

      mockUseAppContext.mockReturnValue({
        shouldShowNotificationPrompt: true,
        openSettings: mockOpenSettings,
        checkPermissions: mockCheckPermissions,
      });

      render(<MapScreen />);

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByTestId('notificationPermissionModal')).toBeTruthy();
      });

      const allowButton = screen.getByTestId('notificationPermissionModalAllow');

      // Click multiple times quickly
      fireEvent.press(allowButton);
      fireEvent.press(allowButton);

      // openSettings should still only be called once (due to modal state closing)
      expect(mockOpenSettings).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // MAPSCREEN-EDGE-CASES: Edge Cases and Error Handling
  // =========================================================================

  describe('MAPSCREEN-EDGE-CASES: Edge Cases', () => {
    it('should handle checkPermissions errors gracefully', async () => {
      const mockCheckPermissions = jest
        .fn()
        .mockRejectedValue(new Error('Permission check failed'));

      mockUseAppContext.mockReturnValue({
        shouldShowNotificationPrompt: true,
        openSettings: jest.fn(),
        checkPermissions: mockCheckPermissions,
      });

      render(<MapScreen />);

      jest.advanceTimersByTime(2000);

      // Component should still render without crashing
      expect(screen.getByTestId('MockMap')).toBeTruthy();
    });

    it('should handle openSettings errors gracefully', async () => {
      const mockOpenSettings = jest.fn().mockRejectedValue(new Error('Settings open failed'));
      const mockCheckPermissions = jest.fn();

      mockUseAppContext.mockReturnValue({
        shouldShowNotificationPrompt: true,
        openSettings: mockOpenSettings,
        checkPermissions: mockCheckPermissions,
      });

      render(<MapScreen />);

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByTestId('notificationPermissionModal')).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId('notificationPermissionModalAllow'));

      // Component should still render without crashing
      expect(screen.getByTestId('MockMap')).toBeTruthy();
    });

    it('should handle undefined context values', () => {
      mockUseAppContext.mockReturnValue(undefined);

      // This should throw or handle gracefully
      expect(() => render(<MapScreen />)).not.toThrow();
    });
  });
});
