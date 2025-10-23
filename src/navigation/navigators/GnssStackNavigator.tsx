import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Routes, GnssStackParamList } from '../routes';
import GnssScreen from '../../screens/GnssScreen/GnssScreen';

/**
 * A stack dedicated to the GNSS tab.
 * We hide the header at the stack level to match your other stacks,
 * but you can enable it per-screen if you want a top bar.
 */
const Stack = createStackNavigator<GnssStackParamList>();

export const GnssStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName={Routes.Gnss.GNSS}
      screenOptions={{ headerShown: false, cardStyle: { backgroundColor: 'white' } }}
    >
      <Stack.Screen name={Routes.Gnss.GNSS} component={GnssScreen} />
    </Stack.Navigator>
  );
};
