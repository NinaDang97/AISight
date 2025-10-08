/**
 * Navigation helpers for imperative navigation outside React components.
 *
 * This module provides imperative navigation helpers for use outside React components.
 * Common use cases: navigation from Redux actions, push notifications, deep links.
 * Type safety is maintained through RootStackParamList.
 * The navigationRef must be attached to NavigationContainer in `App.tsx`.
 */
import { createNavigationContainerRef, StackActions } from '@react-navigation/native';
import { RootStackParamList } from '../routes/index';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * Navigate to any route in the app with type-safe params.
 */
export function navigate<RouteName extends keyof RootStackParamList>(
  name: RouteName,
  params?: RootStackParamList[RouteName]
) {
  if (navigationRef.isReady()) {
    navigationRef.navigate({
        name,
        params,
      } as any);
  } else {
    console.warn('Navigation attempted before navigator was ready');
  }
}

/**
 * Go back to the previous screen if possible.
 */
export function goBack() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}

/**
 * Replace current screen with a new one (useful for auth flows).
 */
export function replace<RouteName extends keyof RootStackParamList>(
  name: RouteName,
  params?: RootStackParamList[RouteName]
) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(StackActions.replace(name, params));
  }
}

/**
 * Reset the navigation state (useful for logout, onboarding completion).
 */
export function reset(state: any) {
  if (navigationRef.isReady()) {
    navigationRef.reset(state);
  }
}

/**
 * Get the current active route name and params.
 */
export function getCurrentRoute() {
  if (navigationRef.isReady()) {
    return navigationRef.getCurrentRoute();
  }
  return null;
}

/**
 * Get the current screen's navigation options.
 */
export function getCurrentOptions() {
  if (navigationRef.isReady()) {
    return navigationRef.getCurrentOptions();
  }
  return null;
}
