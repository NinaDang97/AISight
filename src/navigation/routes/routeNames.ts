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
  MAP_TAB: 'MapTab',
  GNSS_TAB: 'GnssTab',
  ANOMALY_TAB: 'AnomalyTab',
  REPORT_TAB: 'ReportTab',
  SETTINGS_TAB: 'SettingsTab',
};

// Map stack routes
export const MAP_ROUTES = {
  MAP: 'Map',
};

// GNSS stack routes
export const GNSS_ROUTES = {
  GNSS: 'Gnss',
};

// Anomaly stack routes (formerly Home)
export const ANOMALY_ROUTES = {
  ANOMALY: 'Anomaly',
};

// Report stack routes (formerly Profile)
export const REPORT_ROUTES = {
  REPORT: 'Report',
};

// Settings stack routes
export const SETTINGS_ROUTES = {
  SETTINGS: 'Settings',
};
