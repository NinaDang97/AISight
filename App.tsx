/**
 * AISight - Marine Traffic Tracker
 * React Native Application
 *
 * @format
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/navigators/RootNavigator';
import { navigationRef } from './src/navigation/helpers/navigationRef';
import { GnssProvider, AnomalyProvider } from './src/components/contexts';
import { VesselMqttProvider } from './src/components/contexts/VesselMqttContext';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <GnssProvider>
        <AnomalyProvider>
          <NavigationContainer ref={navigationRef}>
            <VesselMqttProvider>
              <RootNavigator />
            </VesselMqttProvider>
          </NavigationContainer>
        </AnomalyProvider>
      </GnssProvider>
    </SafeAreaProvider>
  );
}

export default App;
