import React, {useEffect, useState} from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaWrapper } from '../../components/common/SafeAreaWrapper';
import { colors } from '../../styles';
import Map from '../../map/Map';
import {NotificationPermissionModal} from '../../components/modals/PermissionModals';
import {usePermissions} from '../../hooks';
import {RESULTS} from 'react-native-permissions';
import { VesselDetailsScreen } from '../VesselDetailsScreen';
import { VesselDetailsProvider } from '../../components/contexts/VesselDetailsContext';

export const MapScreen: React.FC = () => {
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

  return (
    <SafeAreaWrapper backgroundColor="transparent" barStyle="dark-content" edges={['bottom', 'left', 'right']}>
      <View style={styles.container}>
        {/* Wrap Map with VesselDetailsProvider for vessel popup functionality */}
        <VesselDetailsProvider>
          <Map />
          <VesselDetailsScreen />
        </VesselDetailsProvider>

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
});
