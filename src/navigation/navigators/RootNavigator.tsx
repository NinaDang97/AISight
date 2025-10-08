import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Routes, RootStackParamList } from '../routes';

// Import navigators and screens
import { OnboardingNavigator } from './OnboardingNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { SplashScreen } from '../../screens/SplashScreen';

const Stack = createStackNavigator<RootStackParamList>();

/**
 * Root navigator that orchestrates the entire app navigation hierarchy.
 *
 * **Navigation Hierarchy:**
 * - Root Stack Navigator (this component)
 *   - Splash Screen (animated splash with AISight branding)
 *   - Onboarding Navigator (stack of onboarding screens)
 *   - Main Tab Navigator (bottom tabs with individual stacks)
 *     - Home Stack Navigator
 *     - Map Stack Navigator
 *     - Profile Stack Navigator
 *     - Settings Stack Navigator
 *
 * **App Flow:**
 * 1. Splash →Shows on app launch with animated logo
 * 2. Onboarding → Guided setup for new users
 * 3. Main → Primary app interface with 4 bottom tabs (Home, Map, Profile, Settings)
 *
 * **Why This Structure:**
 * - Root stack allows modal overlays and auth flows
 * - Tab navigator provides main navigation with icons
 * - Individual stacks enable nested navigation within each tab
 * - Type-safe navigation with RootStackParamList
 *
 * **Future Enhancements:**
 * - Add authentication stack between Splash and Main
 * - Add modal screens at root level (e.g., notifications, alerts)
 */
export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName={Routes.Root.SPLASH}
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'white' },
      }}
    >
      <Stack.Screen
        name={Routes.Root.SPLASH}
        component={SplashScreen}
      />
      <Stack.Screen
        name={Routes.Root.ONBOARDING}
        component={OnboardingNavigator}
      />
      <Stack.Screen
        name={Routes.Root.MAIN}
        component={MainTabNavigator}
      />
    </Stack.Navigator>
  );
};
