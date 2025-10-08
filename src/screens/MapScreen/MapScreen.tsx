import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaWrapper } from '../../components/common/SafeAreaWrapper';
import { Button } from '../../components/common/Button';
import { colors, typography, spacing } from '../../styles';
import Map from '../../map/Map';

const MapControls: React.FC = () => (
  <View style={styles.controlsOverlay}>
    <Button title="Zoom In" variant="secondary" size="small" />
    <Button title="Zoom Out" variant="secondary" size="small" />
    <Button title="Center" variant="secondary" size="small" />
  </View>
);

const VesselInfoCard: React.FC = () => (
  <View style={styles.vesselCard}>
    <Text style={typography.heading4}>MV Ocean Explorer</Text>
    <View style={styles.statusBadge}>
      <Text style={[typography.caption, { color: colors.textInverse }]}>Active</Text>
    </View>
    <View style={styles.detailRow}>
      <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Speed:</Text>
      <Text style={typography.body}>12.5 knots</Text>
    </View>
    <View style={styles.detailRow}>
      <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Course:</Text>
      <Text style={typography.body}>245°</Text>
    </View>
    <View style={styles.detailRow}>
      <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Last Update:</Text>
      <Text style={typography.body}>2 min ago</Text>
    </View>
    <Button title="View Details" variant="primary" size="medium" />
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

        {/* Map Controls Overlay */}
        {/* Vessel Info Card */}
        {/* Legend Section */}
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
});
