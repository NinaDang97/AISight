/**
 * Test utilities and helper functions
 * Shared testing utilities for all test files
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * Custom render function that wraps components with common providers
 * Use this instead of the default render from @testing-library/react-native
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 375, height: 812 },
          insets: { top: 44, left: 0, right: 0, bottom: 34 },
        }}
      >
        <NavigationContainer>{children}</NavigationContainer>
      </SafeAreaProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Wait for a condition to be true
 * Useful for waiting for async operations
 */
export const waitFor = async (
  condition: () => boolean,
  timeout = 5000
): Promise<void> => {
  const startTime = Date.now();
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
};

/**
 * Create a mock navigation object for testing
 */
export const createMockNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
  replace: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  isFocused: jest.fn(() => true),
  canGoBack: jest.fn(() => true),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  getParent: jest.fn(),
  getState: jest.fn(),
});

/**
 * Create a mock route object for testing
 */
export const createMockRoute = (params = {}) => ({
  key: 'test-route-key',
  name: 'TestScreen',
  params,
  path: undefined,
});

/**
 * Delay execution for testing async operations
 */
export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Suppress console errors/warnings during a test
 */
export const suppressConsole = (fn: () => void | Promise<void>) => {
  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = jest.fn();
  console.warn = jest.fn();

  const result = fn();

  if (result instanceof Promise) {
    return result.finally(() => {
      console.error = originalError;
      console.warn = originalWarn;
    });
  }

  console.error = originalError;
  console.warn = originalWarn;
  return result;
};

// Re-export everything from @testing-library/react-native
export * from '@testing-library/react-native';
