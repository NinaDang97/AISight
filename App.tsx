/**
 * AISight - Marine Traffic Tracker
 * React Native Application
 *
 * @format
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/contexts';
import { navigationRef } from './src/navigation/helpers/navigationRef';
import { RootNavigator } from './src/navigation/navigators/RootNavigator';
import { GnssProvider, AnomalyProvider } from './src/components/contexts';
import { VesselMqttProvider } from './src/components/contexts/VesselMqttContext';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <GnssProvider>
          <AnomalyProvider>
            <NavigationContainer ref={navigationRef}>
              <VesselMqttProvider>
                <RootNavigator />
              </VesselMqttProvider>
            </NavigationContainer>
          </AnomalyProvider>
        </GnssProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}

export default App;
