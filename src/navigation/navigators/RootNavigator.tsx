import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Routes, RootStackParamList } from '../routes';

// Import navigators and screens
import { OnboardingNavigator } from './OnboardingNavigator';
import { WelcomeScreen } from '../../screens/OnboardingScreens/WelcomeScreen';

// Create placeholders using the WelcomeScreen
const SplashScreen = () => <WelcomeScreen />;
const MainNavigator = () => <WelcomeScreen />;

const Stack = createStackNavigator<RootStackParamList>();

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
        component={MainNavigator}
      />
    </Stack.Navigator>
  );
};