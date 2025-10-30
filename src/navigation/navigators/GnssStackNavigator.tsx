import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Routes, GnssStackParamList } from '../routes';
import { GnssScreen } from '../../screens/GnssScreen';

const Stack = createStackNavigator<GnssStackParamList>();

export const GnssStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name={Routes.Gnss.GNSS}
        component={GnssScreen}
      />
    </Stack.Navigator>
  );
};
