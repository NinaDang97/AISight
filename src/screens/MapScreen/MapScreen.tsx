import React, {useEffect, useState} from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaWrapper } from '../../components/common/SafeAreaWrapper';
import { Button } from '../../components/common/Button';
import { colors, typography, spacing } from '../../styles';
import Map from '../../map/Map';
import {NotificationPermissionModal} from '../../components/modals/PermissionModals';
import {usePermissions} from '../../hooks';
import {RESULTS} from 'react-native-permissions';
import { MapStackParamList, Routes } from '../../navigation/routes';

type MapScreenNavigationProp = StackNavigationProp<MapStackParamList, typeof Routes.Map.MAP>;

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
  const navigation = useNavigation<MapScreenNavigationProp>();
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const {
    shouldShowNotificationPrompt,
    requestNotification,
    checkPermissions,
  } = usePermissions();

  // Show notification permission modal after delay (only for new users)
  useEffect(() => {
    const checkAndShowNotificationPrompt = async () => {
      // Wait 2 seconds after map loads
      const timer = setTimeout(async () => {
        await checkPermissions();
        if (shouldShowNotificationPrompt) {
          setShowNotificationModal(true);
        }
      }, 2000);

      return () => clearTimeout(timer);
    };

    checkAndShowNotificationPrompt();
  }, [shouldShowNotificationPrompt, checkPermissions]);

  const handleAllowNotification = async () => {
    setShowNotificationModal(false);
    const result = await requestNotification();
    if (result === RESULTS.GRANTED) {
      console.log('Notification permission granted');
    }
  };

  const handleDenyNotification = () => {
    setShowNotificationModal(false);
    console.log('Notification permission denied');
  };

  const handleSearchPress = () => {
    navigation.navigate(Routes.Map.SEARCH);
  };

  return (
    <SafeAreaWrapper backgroundColor="transparent" barStyle="dark-content" edges={['bottom', 'left', 'right']}>
      <View style={styles.container}>
        <Map onSearchPress={handleSearchPress} />

        {/* Map Controls Overlay */}
        {/* Vessel Info Card */}
        {/* Legend Section */}

        {/* Notification Permission Modal */}
        <NotificationPermissionModal
          visible={showNotificationModal}
          onAllow={handleAllowNotification}
          onDeny={handleDenyNotification}
        />
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
