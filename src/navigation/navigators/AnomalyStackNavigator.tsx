import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Routes, AnomalyStackParamList } from '../routes';
import { AnomalyScreen } from '../../screens/AnomalyScreen';

const Stack = createStackNavigator<AnomalyStackParamList>();

export const AnomalyStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName={Routes.Anomaly.ANOMALY}
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'white' },
      }}
    >
      <Stack.Screen
        name={Routes.Anomaly.ANOMALY}
        component={AnomalyScreen}
      />
    </Stack.Navigator>
  );
};
