import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Routes, MapStackParamList } from '../routes';

// Import screens
import { MapScreen } from '../../screens/MapScreen';

const Stack = createStackNavigator<MapStackParamList>();

/**
 * Stack navigator for the Map tab.
 * 
 * This navigator wraps the Map screen in a stack for future extensibility.
 * For example, to add screens like VesselDetails or MapFilters, you would:
 * 1. Add the route to Routes.Map in src/navigation/routes/index.ts
 * 2. Add the param to MapStackParamList
 * 3. Import and add a Stack.Screen for the new screen
 * 4. Navigate using navigation.navigate(Routes.Map.VESSEL_DETAILS, params)
 * 
 * The header is hidden because the tab navigator manages the top-level navigation.
 * Individual screens within this stack can override screenOptions to show headers if needed.
 */
export const MapStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName={Routes.Map.MAP}
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'white' },
      }}
    >
      <Stack.Screen
        name={Routes.Map.MAP}
        component={MapScreen}
      />
    </Stack.Navigator>
  );
};