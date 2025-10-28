import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaWrapper } from '../../components/common/SafeAreaWrapper';
import { Button } from '../../components/common/Button';
import { colors, typography, spacing } from '../../styles';
import Map from '../../map/Map';
import { VesselDetailsScreen } from '../VesselDetailsScreen';

const MapControls: React.FC = () => (
  <View style={styles.controlsOverlay}>
    <Button title="Zoom In" variant="secondary" size="small" />
    <Button title="Zoom Out" variant="secondary" size="small" />
    <Button title="Center" variant="secondary" size="small" />
  </View>
);

const LegendSection: React.FC = () => (
  <View style={styles.legend}>
    <View style={styles.legendItem}>
      <View style={[styles.legendCircle, { backgroundColor: colors.primary }]} />
      <Text style={typography.caption}>Cargo</Text>
    </View>
    <View style={styles.legendItem}>
      <View style={[styles.legendCircle, { backgroundColor: colors.secondary }]} />
      <Text style={typography.caption}>Passenger</Text>
    </View>
  </View>
);

export const MapScreen: React.FC = () => {
  return (
    <SafeAreaWrapper backgroundColor={colors.background} barStyle="dark-content">
      <View style={styles.container}>
        <Map />
        <VesselDetailsScreen />
        {/*<MapControls />*/}
        {/*<LegendSection />*/}
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: colors.water,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsOverlay: {
    position: 'absolute',
    top: spacing.large,
    right: spacing.medium,
    gap: spacing.small,
  },
  vesselCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.large,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  statusBadge: {
    backgroundColor: colors.online,
    borderRadius: 12,
    paddingHorizontal: spacing.small,
    paddingVertical: spacing.tiny,
    alignSelf: 'flex-start',
    marginVertical: spacing.small,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.tiny,
  },
  legend: {
    position: 'absolute',
    bottom: spacing.large,
    left: spacing.medium,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.tiny,
  },
  legendCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.small,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 50,
    alignItems: 'left',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
});
