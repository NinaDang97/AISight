import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { Routes, MainTabParamList } from '../routes';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { HomeStackNavigator } from './HomeStackNavigator';
import { MapStackNavigator } from './MapStackNavigator';
import { ProfileStackNavigator } from './ProfileStackNavigator';
import { SettingsStackNavigator } from './SettingsStackNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

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
  return (
    <Tab.Navigator
      initialRouteName={Routes.Tabs.HOME}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: typography.caption.fontSize,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name={Routes.Tabs.HOME}
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused, color, size }) => (
            <Icon
              name={focused ? 'home' : 'home-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name={Routes.Tabs.MAP}
        component={MapStackNavigator}
        options={{
          tabBarLabel: 'Map',
          tabBarIcon: ({ focused, color, size }) => (
            <Icon
              name={focused ? 'map' : 'map-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name={Routes.Tabs.PROFILE}
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, color, size }) => (
            <Icon
              name={focused ? 'person' : 'person-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name={Routes.Tabs.SETTINGS}
        component={SettingsStackNavigator}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ focused, color, size }) => (
            <Icon
              name={focused ? 'settings' : 'settings-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};