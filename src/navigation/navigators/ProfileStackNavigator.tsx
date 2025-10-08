import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Routes, ProfileStackParamList } from '../routes';

// Import screens
import { ProfileScreen } from '../../screens/ProfileScreen';

const Stack = createStackNavigator<ProfileStackParamList>();

/**
 * Stack navigator for the Profile tab.
 * 
 * This navigator wraps the Profile screen in a stack for future extensibility.
 * For example, to add an EditProfile or ProfileSettings screen, you would:
 * 1. Add the route to Routes.Profile in src/navigation/routes/index.ts
 * 2. Add the param to ProfileStackParamList
 * 3. Import and add a Stack.Screen for the new screen
 * 4. Navigate using navigation.navigate(Routes.Profile.EDIT_PROFILE, params)
 * 
 * The header is hidden because the tab navigator manages the top-level navigation.
 * Individual screens within this stack can override screenOptions to show headers if needed.
 */
export const ProfileStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName={Routes.Profile.PROFILE}
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'white' },
      }}
    >
      <Stack.Screen
        name={Routes.Profile.PROFILE}
        component={ProfileScreen}
      />
    </Stack.Navigator>
  );
};