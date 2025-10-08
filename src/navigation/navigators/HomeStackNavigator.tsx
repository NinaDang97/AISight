import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Routes, HomeStackParamList } from '../routes';

// Import screens
import { HomeScreen } from '../../screens/HomeScreen';

const Stack = createStackNavigator<HomeStackParamList>();

/**
 * Stack navigator for the Home tab.
 * 
 * This navigator wraps the Home screen in a stack for future extensibility.
 * For example, to add a HomeDetails screen, you would:
 * 1. Add the route to Routes.Home in src/navigation/routes/index.ts
 * 2. Add the param to HomeStackParamList
 * 3. Import and add a Stack.Screen for HomeDetails
 * 4. Navigate using navigation.navigate(Routes.Home.HOME_DETAILS, params)
 * 
 * The header is hidden because the tab navigator manages the top-level navigation.
 * Individual screens within this stack can override screenOptions to show headers if needed.
 */
export const HomeStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName={Routes.Home.HOME}
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'white' },
      }}
    >
      <Stack.Screen
        name={Routes.Home.HOME}
        component={HomeScreen}
      />
    </Stack.Navigator>
  );
};