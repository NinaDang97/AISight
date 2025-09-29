import React, { useEffect } from 'react';
import { StatusBar, LogBox, View, Text } from 'react-native';
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
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ textAlign: 'center' }}>
          This view is just for test purposes
        </Text>
      </View>
      {/* There was some problem with the navigator, so temporarily removing it
      <NavigationContainer ref={navigationRef}>
        <RootNavigator />
      </NavigationContainer>
      */}
    </SafeAreaProvider>
  );
};

export default App;
