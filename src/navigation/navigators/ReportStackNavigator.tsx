import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Routes, ReportStackParamList } from '../routes';
import { ReportScreen } from '../../screens/ReportScreen';

const Stack = createStackNavigator<ReportStackParamList>();

export const ReportStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName={Routes.Report.REPORT}
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'white' },
      }}
    >
      <Stack.Screen
        name={Routes.Report.REPORT}
        component={ReportScreen}
      />
    </Stack.Navigator>
  );
};
