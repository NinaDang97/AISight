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
    VESSEL_LIST: 'VesselListTab',
    SEARCH: 'SearchTab',
    SETTINGS: 'SettingsTab',
  },
  
  // Map stack routes
  Map: {
    MAP: 'Map',
    VESSEL_DETAILS: 'VesselDetails',
  },
  
  // Vessel stack routes
  Vessel: {
    VESSEL_LIST: 'VesselList',
    VESSEL_DETAILS: 'VesselDetails',
    VESSEL_FILTER: 'VesselFilter',
  },
  
  // Search stack routes
  Search: {
    SEARCH: 'Search',
    SEARCH_RESULTS: 'SearchResults',
    VESSEL_DETAILS: 'VesselDetails',
  },
  
  // Settings stack routes
  Settings: {
    SETTINGS: 'Settings',
    ABOUT: 'About',
    PREFERENCES: 'Preferences',
    HELP: 'Help',
  },
  
  // Modal routes
  Modals: {
    FILTER_MODAL: 'FilterModal',
  },
} as const;

// Create types from the route name constants
export type OnboardingRoutes = typeof Routes.Onboarding[keyof typeof Routes.Onboarding];
export type TabRoutes = typeof Routes.Tabs[keyof typeof Routes.Tabs];
export type MapRoutes = typeof Routes.Map[keyof typeof Routes.Map];
export type VesselRoutes = typeof Routes.Vessel[keyof typeof Routes.Vessel];
export type SearchRoutes = typeof Routes.Search[keyof typeof Routes.Search];
export type SettingsRoutes = typeof Routes.Settings[keyof typeof Routes.Settings];
export type ModalRoutes = typeof Routes.Modals[keyof typeof Routes.Modals];
export type RootRoutes = typeof Routes.Root[keyof typeof Routes.Root];

// Define param lists for each navigator
export type OnboardingStackParamList = {
  [Routes.Onboarding.WELCOME]: undefined;
  [Routes.Onboarding.PERMISSIONS]: undefined;
  [Routes.Onboarding.TUTORIAL]: undefined;
};

export type MapStackParamList = {
  [Routes.Map.MAP]: undefined;
  [Routes.Map.VESSEL_DETAILS]: { vesselId: string };
};

export type VesselStackParamList = {
  [Routes.Vessel.VESSEL_LIST]: undefined;
  [Routes.Vessel.VESSEL_DETAILS]: { vesselId: string };
  [Routes.Vessel.VESSEL_FILTER]: undefined;
};

export type SearchStackParamList = {
  [Routes.Search.SEARCH]: undefined;
  [Routes.Search.SEARCH_RESULTS]: { query: string };
  [Routes.Search.VESSEL_DETAILS]: { vesselId: string };
};

export type SettingsStackParamList = {
  [Routes.Settings.SETTINGS]: undefined;
  [Routes.Settings.ABOUT]: undefined;
  [Routes.Settings.PREFERENCES]: undefined;
  [Routes.Settings.HELP]: undefined;
};

export type MainTabParamList = {
  [Routes.Tabs.MAP]: NavigatorScreenParams<MapStackParamList>;
  [Routes.Tabs.VESSEL_LIST]: NavigatorScreenParams<VesselStackParamList>;
  [Routes.Tabs.SEARCH]: NavigatorScreenParams<SearchStackParamList>;
  [Routes.Tabs.SETTINGS]: NavigatorScreenParams<SettingsStackParamList>;
};

export type RootStackParamList = {
  [Routes.Root.SPLASH]: undefined;
  [Routes.Root.ONBOARDING]: NavigatorScreenParams<OnboardingStackParamList>;
  [Routes.Root.MAIN]: NavigatorScreenParams<MainTabParamList>;
  // Direct routes that bypass the tab navigator
  [Routes.Map.VESSEL_DETAILS]: { vesselId: string };
  // Modal screens
  [Routes.Modals.FILTER_MODAL]: undefined;
  // Individual onboarding screens for direct navigation
  [Routes.Onboarding.WELCOME]: undefined;
  [Routes.Onboarding.PERMISSIONS]: undefined;
  [Routes.Onboarding.TUTORIAL]: undefined;
};
