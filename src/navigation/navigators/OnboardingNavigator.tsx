import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Routes, OnboardingStackParamList } from '../routes';

// Import screens
import { WelcomeScreen } from '../../screens/OnboardingScreens/WelcomeScreen';

const Stack = createStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator: React.FC = () => {
    return (
      <Stack.Navigator
        initialRouteName={Routes.Onboarding.WELCOME}
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: 'white' },
        }}
      >
        <Stack.Screen
          name={Routes.Onboarding.WELCOME}
          component={WelcomeScreen}
        />
      </Stack.Navigator>
    );
  };
