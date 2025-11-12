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
import { GnssProvider } from './src/components/contexts';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <GnssProvider>
        <NavigationContainer ref={navigationRef}>
          <RootNavigator />
        </NavigationContainer>
      </GnssProvider>
    </SafeAreaProvider>
  );
}

export default App;
