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

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer ref={navigationRef}>
          <RootNavigator />
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}

export default App;
