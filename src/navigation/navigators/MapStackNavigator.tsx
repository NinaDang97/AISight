import React from 'react';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { Routes, MapStackParamList } from '../routes';

// Import screens
import { MapScreen } from '../../screens/MapScreen';
import { SearchScreen } from '../../screens/SearchScreen';

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
      <Stack.Screen
        name={Routes.Map.SEARCH}
        component={SearchScreen}
        options={{
          headerShown: false,
          cardStyle: { backgroundColor: '#2C2C2E' },
          ...TransitionPresets.SlideFromRightIOS,
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 250,
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 200,
              },
            },
          },
        }}
      />
    </Stack.Navigator>
  );
};