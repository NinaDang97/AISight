import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaWrapper } from '../../components/common/SafeAreaWrapper';
import { colors } from '../../styles';
import Map from '../../map/Map';
import { VesselDetailsScreen } from '../VesselDetailsScreen';
import { VesselDetailsProvider } from '../../components/contexts/VesselDetailsContext';

export const MapScreen: React.FC = () => {
  return (
    <SafeAreaWrapper backgroundColor={colors.background} barStyle="dark-content">
      <View style={styles.container}>
        <VesselDetailsProvider>
          <Map />
          <VesselDetailsScreen />
        </VesselDetailsProvider>
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
