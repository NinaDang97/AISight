// This file provides string constants for route names.
// These constants are used in `src/navigation/routes/index.ts` to build the Routes object.
// Using constants prevents typos and enables IDE autocomplete.
// The naming convention: SCREEN_ROUTES for route groups, SCREEN_NAME for individual routes.

// Root level routes
export const ROOT_ROUTES = {
  SPLASH: 'Splash',
  ONBOARDING: 'Onboarding',
  MAIN: 'Main',
};

// Onboarding routes
export const ONBOARDING_ROUTES = {
  WELCOME: 'Welcome',
  PERMISSIONS: 'Permissions',
  TUTORIAL: 'Tutorial',
};

// Main tab routes
export const TAB_ROUTES = {
  HOME_TAB: 'HomeTab',
  MAP_TAB: 'MapTab',
  PROFILE_TAB: 'ProfileTab',
  SETTINGS_TAB: 'SettingsTab',
};

// Home stack routes
export const HOME_ROUTES = {
  HOME: 'Home',
};

// Map stack routes
export const MAP_ROUTES = {
  MAP: 'Map',
};

// Profile stack routes
export const PROFILE_ROUTES = {
  PROFILE: 'Profile',
};

// Settings stack routes
export const SETTINGS_ROUTES = {
  SETTINGS: 'Settings',
};
