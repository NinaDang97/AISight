import { NavigatorScreenParams } from '@react-navigation/native';

// Define route names as const objects for type safety
export const Routes = {
  // Root routes
  Root: {
    SPLASH: 'Splash',
    ONBOARDING: 'Onboarding',
    MAIN: 'Main',
  },

  // Onboarding routes
  Onboarding: {
    WELCOME: 'Welcome',
    PERMISSIONS: 'Permissions',
    TUTORIAL: 'Tutorial',
  },

  // Main tab routes
  Tabs: {
    MAP: 'MapTab',
    GNSS: 'GnssTab',
    ANOMALY: 'AnomalyTab',
    REPORT: 'ReportTab',
    SETTINGS: 'SettingsTab',
  },

  // Map stack routes
  Map: {
    MAP: 'Map',
  },

  // GNSS stack routes
  Gnss: {
    GNSS: 'Gnss',
  },

  // Anomaly stack routes
  Anomaly: {
    ANOMALY: 'Anomaly',
  },

  // Report stack routes
  Report: {
    REPORT: 'Report',
  },

  // Settings stack routes
  Settings: {
    SETTINGS: 'Settings',
  },
} as const;

// Create types from the route name constants
export type OnboardingRoutes = typeof Routes.Onboarding[keyof typeof Routes.Onboarding];
export type TabRoutes = typeof Routes.Tabs[keyof typeof Routes.Tabs];
export type MapRoutes = typeof Routes.Map[keyof typeof Routes.Map];
export type GnssRoutes = typeof Routes.Gnss[keyof typeof Routes.Gnss];
export type AnomalyRoutes = typeof Routes.Anomaly[keyof typeof Routes.Anomaly];
export type ReportRoutes = typeof Routes.Report[keyof typeof Routes.Report];
export type SettingsRoutes = typeof Routes.Settings[keyof typeof Routes.Settings];
export type RootRoutes = typeof Routes.Root[keyof typeof Routes.Root];

// Define param lists for each navigator
export type OnboardingStackParamList = {
  [Routes.Onboarding.WELCOME]: undefined;
  [Routes.Onboarding.PERMISSIONS]: undefined;
  [Routes.Onboarding.TUTORIAL]: undefined;
};

export type MapStackParamList = {
  [Routes.Map.MAP]: undefined;
};

export type GnssStackParamList = {
  [Routes.Gnss.GNSS]: undefined;
};

export type AnomalyStackParamList = {
  [Routes.Anomaly.ANOMALY]: undefined;
};

export type ReportStackParamList = {
  [Routes.Report.REPORT]: undefined;
};

export type SettingsStackParamList = {
  [Routes.Settings.SETTINGS]: undefined;
};

export type MainTabParamList = {
  [Routes.Tabs.MAP]: NavigatorScreenParams<MapStackParamList>;
  [Routes.Tabs.GNSS]: NavigatorScreenParams<GnssStackParamList>;
  [Routes.Tabs.ANOMALY]: NavigatorScreenParams<AnomalyStackParamList>;
  [Routes.Tabs.REPORT]: NavigatorScreenParams<ReportStackParamList>;
  [Routes.Tabs.SETTINGS]: NavigatorScreenParams<SettingsStackParamList>;
};

export type RootStackParamList = {
  [Routes.Root.SPLASH]: undefined;
  [Routes.Root.ONBOARDING]: NavigatorScreenParams<OnboardingStackParamList>;
  [Routes.Root.MAIN]: NavigatorScreenParams<MainTabParamList>;
  // Individual onboarding screens for direct navigation
  [Routes.Onboarding.WELCOME]: undefined;
  [Routes.Onboarding.PERMISSIONS]: undefined;
  [Routes.Onboarding.TUTORIAL]: undefined;
};
