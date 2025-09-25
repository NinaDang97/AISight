import { NavigatorScreenParams } from '@react-navigation/native';

// Main Tab Navigator Param List
export type MainTabParamList = {
  MapTab: undefined;
  VesselListTab: undefined;
  SearchTab: undefined;
  SettingsTab: undefined;
};

// Stack Navigator Param Lists
export type OnboardingStackParamList = {
  Welcome: undefined;
  Permissions: undefined;
  Tutorial: undefined;
};

export type MapStackParamList = {
  Map: undefined;
  VesselDetails: { vesselId: string };
};

export type VesselStackParamList = {
  VesselList: undefined;
  VesselDetails: { vesselId: string };
  VesselFilter: undefined;
};

export type SearchStackParamList = {
  Search: undefined;
  SearchResults: { query: string };
  VesselDetails: { vesselId: string };
};

export type SettingsStackParamList = {
  Settings: undefined;
  About: undefined;
  Preferences: undefined;
  Help: undefined;
};

// Root Stack Navigator Param List
export type RootStackParamList = {
  Splash: undefined;
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  // Direct routes that bypass the tab navigator
  VesselDetails: { vesselId: string };
  // Modal screens
  FilterModal: undefined;
  // Individual onboarding screens for direct navigation
  Welcome: undefined;
  Permissions: undefined;
  Tutorial: undefined;
};
