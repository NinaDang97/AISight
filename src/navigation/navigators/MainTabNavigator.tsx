import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Routes, MainTabParamList } from '../routes';
import { colors } from '../../styles/colors';
import { MapStackNavigator } from './MapStackNavigator';
import { GnssStackNavigator } from './GnssStackNavigator';
import { AnomalyStackNavigator } from './AnomalyStackNavigator';
import { ReportStackNavigator } from './ReportStackNavigator';
import { SettingsStackNavigator } from './SettingsStackNavigator';
import { useGnss } from '../../components/contexts';

// Import custom tab bar icons
const icons = {
  map: require('../../../assets/images/icons/map-icon.png'),
  gnss: require('../../../assets/images/icons/gnss-icon.png'),
  anomaly: require('../../../assets/images/icons/anomaly-icon.png'),
  report: require('../../../assets/images/icons/report-icon.png'),
  settings: require('../../../assets/images/icons/settings-icon.png'),
};

const Tab = createBottomTabNavigator<MainTabParamList>();

// Helper component to render tab icon with ellipse background when focused
const TabIcon: React.FC<{
  source: any;
  focused: boolean;
  size: number;
  showBadge?: boolean;
}> = ({ source, focused, size, showBadge }) => (
  <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
    <Image
      source={source}
      style={[styles.tabIcon, { width: size + 4, height: size + 4 }]}
      resizeMode="contain"
    />
    {showBadge && (
      <View accessible={true} accessibilityLabel="GNSS recording active" style={styles.badge} />
    )}
  </View>
);

/**
 * Main bottom tab navigator that orchestrates all four stack navigators (Home, Map, Profile, Settings).
 *
 * This navigator creates the primary navigation interface with bottom tabs, where each tab
 * contains a stack navigator for future nested navigation capabilities. The structure allows
 * for push/pop navigation within each tab while maintaining a consistent tab bar experience.
 *
 * **Tab Structure:**
 * - HomeTab: HomeStackNavigator (Home screen + future sub-screens)
 * - MapTab: MapStackNavigator (Map screen + future sub-screens like VesselDetails)
 * - ProfileTab: ProfileStackNavigator (Profile screen + future sub-screens like EditProfile)
 * - SettingsTab: SettingsStackNavigator (Settings screen + future sub-screens like About, Preferences)
 *
 * **Icon Naming Conventions:**
 * Uses Ionicons from react-native-vector-icons. Active tabs use filled icons (e.g., 'home'),
 * inactive tabs use outline icons (e.g., 'home-outline'). This provides clear visual feedback
 * for the current tab state.
 *
 * **Styling Approach:**
 * - Colors are sourced from the theme in src/styles/colors.ts for consistency
 * - Typography uses predefined styles from src/styles/typography.ts
 * - Tab bar styling includes proper spacing, borders, and background colors
 *
 * **Adding New Tabs:**
 * 1. Create a new stack navigator (e.g., NewTabStackNavigator.tsx)
 * 2. Add the tab route to Routes.Tabs in src/navigation/routes/index.ts
 * 3. Add the param list to MainTabParamList
 * 4. Import the new stack navigator here
 * 5. Add a new Tab.Screen with appropriate options
 *
 * **Why Stack Navigators:**
 * Each tab wraps its screen in a stack navigator to enable future nested navigation.
 * For example, tapping a vessel on the map could push a VesselDetails screen onto the Map stack,
 * while the tab bar remains visible at the bottom.
 */
export const MainTabNavigator: React.FC = () => {
  const { isTracking } = useGnss(); // get tracking state from GnssContext

  return (
    <Tab.Navigator
      initialRouteName={Routes.Tabs.MAP}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarShowLabel: false, // Hide all tab labels
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
      }}
    >
      <Tab.Screen
        name={Routes.Tabs.MAP}
        component={MapStackNavigator}
        options={{
          tabBarIcon: ({ focused, size }) => (
            <TabIcon source={icons.map} focused={focused} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name={Routes.Tabs.GNSS}
        component={GnssStackNavigator}
        options={{
          tabBarIcon: ({ focused, size }) => (
            <TabIcon source={icons.gnss} focused={focused} size={size} showBadge={isTracking} />
          ),
        }}
      />
      <Tab.Screen
        name={Routes.Tabs.ANOMALY}
        component={AnomalyStackNavigator}
        options={{
          tabBarIcon: ({ focused, size }) => (
            <TabIcon source={icons.anomaly} focused={focused} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name={Routes.Tabs.REPORT}
        component={ReportStackNavigator}
        options={{
          tabBarIcon: ({ focused, size }) => (
            <TabIcon source={icons.report} focused={focused} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name={Routes.Tabs.SETTINGS}
        component={SettingsStackNavigator}
        options={{
          tabBarIcon: ({ focused, size }) => (
            <TabIcon source={icons.settings} focused={focused} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 48,
    height: 48,
    borderRadius: 24, // Makes it circular (ellipse)
  },
  iconContainerFocused: {
    backgroundColor: '#23A6DA', // Ellipse background color when selected
  },
  tabIcon: {
    // Icon will be sized dynamically
  },
  badge: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error, // red
    borderWidth: 1,
    borderColor: colors.surface, // match the tab background or provide contrast
  },
});
