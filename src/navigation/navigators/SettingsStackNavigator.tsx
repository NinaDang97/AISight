import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Routes, SettingsStackParamList } from '../routes';

// Import screens
import { SettingsScreen } from '../../screens/SettingsScreen';

const Stack = createStackNavigator<SettingsStackParamList>();

/**
 * Stack navigator for the Settings tab.
 * 
 * This navigator wraps the Settings screen in a stack for future extensibility.
 * For example, to add sub-screens like About, Preferences, Help, or Privacy, you would:
 * 1. Add the route to Routes.Settings in src/navigation/routes/index.ts
 * 2. Add the param to SettingsStackParamList
 * 3. Import and add a Stack.Screen for the new screen
 * 4. Navigate using navigation.navigate(Routes.Settings.ABOUT, params)
 * 
 * The header is hidden because the tab navigator manages the top-level navigation.
 * Individual screens within this stack can override screenOptions to show headers if needed.
 */
export const SettingsStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName={Routes.Settings.SETTINGS}
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'white' },
      }}
    >
      <Stack.Screen
        name={Routes.Settings.SETTINGS}
        component={SettingsScreen}
      />
    </Stack.Navigator>
  );
};