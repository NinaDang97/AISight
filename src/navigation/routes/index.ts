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
    HOME: 'HomeTab',
    MAP: 'MapTab',
    PROFILE: 'ProfileTab',
    SETTINGS: 'SettingsTab',
  },

  // Home stack routes
  Home: {
    HOME: 'Home',
  },

  // Map stack routes
  Map: {
    MAP: 'Map',
  },

  // Profile stack routes
  Profile: {
    PROFILE: 'Profile',
  },

  // Settings stack routes
  Settings: {
    SETTINGS: 'Settings',
  },
} as const;

// Create types from the route name constants
export type OnboardingRoutes = typeof Routes.Onboarding[keyof typeof Routes.Onboarding];
export type TabRoutes = typeof Routes.Tabs[keyof typeof Routes.Tabs];
export type HomeRoutes = typeof Routes.Home[keyof typeof Routes.Home];
export type MapRoutes = typeof Routes.Map[keyof typeof Routes.Map];
export type ProfileRoutes = typeof Routes.Profile[keyof typeof Routes.Profile];
export type SettingsRoutes = typeof Routes.Settings[keyof typeof Routes.Settings];
export type RootRoutes = typeof Routes.Root[keyof typeof Routes.Root];

// Define param lists for each navigator
export type OnboardingStackParamList = {
  [Routes.Onboarding.WELCOME]: undefined;
  [Routes.Onboarding.PERMISSIONS]: undefined;
  [Routes.Onboarding.TUTORIAL]: undefined;
};

export type HomeStackParamList = {
  [Routes.Home.HOME]: undefined;
};

export type MapStackParamList = {
  [Routes.Map.MAP]: undefined;
};

export type ProfileStackParamList = {
  [Routes.Profile.PROFILE]: undefined;
};

export type SettingsStackParamList = {
  [Routes.Settings.SETTINGS]: undefined;
};

export type MainTabParamList = {
  [Routes.Tabs.HOME]: NavigatorScreenParams<HomeStackParamList>;
  [Routes.Tabs.MAP]: NavigatorScreenParams<MapStackParamList>;
  [Routes.Tabs.PROFILE]: NavigatorScreenParams<ProfileStackParamList>;
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
