import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Routes, MainTabParamList } from '../routes';
import Map from '../../map/Map';

// Basic placeholder screens for each tab. Replace with real navigators/screens later.
const CenteredPlaceholder: React.FC<{ label: string }> = ({ label }) => (
  <View style={styles.container}>
    <Text style={styles.text}>{label}</Text>
  </View>
);

const MapScreen = () => <Map />;
const SettingsScreen = () => <CenteredPlaceholder label="Settings" />;

const Tab = createBottomTabNavigator<MainTabParamList>();

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName={Routes.Tabs.MAP}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name={Routes.Tabs.MAP} component={MapScreen} options={{ title: 'Map' }} />
      <Tab.Screen
        name={Routes.Tabs.SETTINGS}
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'white',
  },
  text: {
    fontSize: 18,
    color: '#222',
  },
});
