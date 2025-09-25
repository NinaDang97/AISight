import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { navigationRef } from './src/navigation/helpers/navigationRef';
import { RootNavigator } from './src/navigation/navigators/RootNavigator';
import BootSplash from 'react-native-bootsplash';

// Ignore specific warnings that are not relevant
LogBox.ignoreLogs([
  'ViewPropTypes will be removed',
  'ColorPropType will be removed',
]);

const App = () => {
  useEffect(() => {
    // Hide the native splash screen
    const init = async () => {
      await BootSplash.hide({ fade: true });
    };

    init();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <NavigationContainer ref={navigationRef}>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
