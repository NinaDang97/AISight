import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Platform, PlatformColor } from 'react-native';
import { SafeAreaWrapper } from '../../components/common/SafeAreaWrapper';
import { Button } from '../../components/common/Button';
import { colors, typography, spacing } from '../../styles';
import { RESULTS } from 'react-native-permissions';
import { usePermissions } from '../../hooks';
import {
  LocationPermissionModal,
  NotificationPermissionModal,
} from '../../components/modals/PermissionModals';

export const SettingsScreen = () => {
  const [notifications, setNotifications] = React.useState(false);
  const [location, setLocation] = React.useState(false);
  const [darkMode, setDarkMode] = React.useState(false);
  const [showNotificationModal, setShowNotificationModal] = React.useState(false);
  const [showLocationModal, setShowLocationModal] = React.useState(false);


  const {
    checkPermissions,
    shouldShowLocationPrompt,
    shouldShowNotificationPrompt,
    hasLocationPermission,
    requestLocation,
    hasNotificationPermission,
    requestNotification,
  } = usePermissions();

  useEffect(() => {
    if (hasNotificationPermission) setNotifications(true);
    if (hasLocationPermission) setLocation(true);
  }, []);

  const handleNotificationSwitch = async () => {
    /* todo. problems with android version */
    await checkPermissions();
    if (!notifications) {
      const res = await requestNotification();
      if (res !== RESULTS.GRANTED) {
        console.log('Notifications not granted');
      } else {
        setNotifications(true);
      }
    } else {
      // needs something to revoke the notifications from system
      setNotifications(false);
    }
  };

  const handleLocationSwitch = async () => {
    /* todo */
    if (!location) {
      const res = await requestLocation();
      if (res !== RESULTS.GRANTED) {
        console.log('Location not granted');
      } else {
        setLocation(true);
      }
    } else {
      // same as notifs
      setLocation(false);
    }
  };

  // Handle "Continue" button - show native permission dialog
  const handleContinue = async () => {
    setShowLocationModal(false);
    // Request permission - this will show the native system dialog
    const result = await requestLocation();
    if (result === RESULTS.GRANTED) {
      // Permission granted, center on user location
      //await centerOnUserLocation();
    } else {
      console.log('Location permission denied in native dialog');
    }
  };

  // Handle "Not now" button - just close the modal
  const handleNotNow = () => {
    setShowLocationModal(false);
    console.log('User declined location permission');
  };

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
    <SafeAreaWrapper backgroundColor={colors.background} barStyle="dark-content">
      <ScrollView style={styles.container}>
        <Text style={[typography.heading2, styles.header]}>Settings</Text>
        <Text style={[typography.heading5, styles.sectionTitle]}>Preferences</Text>
        <View style={styles.item}>
          <Text style={typography.body}>Push Notifications</Text>
          <Switch
            value={notifications}
            onValueChange={handleNotificationSwitch}
            trackColor={{ false: colors.textDisabled, true: colors.primary }}
            thumbColor={colors.background}
          />
        </View>
        <View style={styles.item}>
          <Text style={typography.body}>Location services</Text>
          <Switch
            value={location}
            onValueChange={handleLocationSwitch}
            trackColor={{ false: colors.textDisabled, true: colors.primary }}
            thumbColor={colors.background}
          />
        </View>
        <View style={styles.item}>
          <Text style={typography.body}>Dark Mode</Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: colors.textDisabled, true: colors.primary }}
            thumbColor={colors.background}
          />
        </View>
        <Text style={[typography.heading5, styles.sectionTitle]}>App Settings</Text>
        <View style={styles.item}>
          <Text style={typography.body}>Language</Text>
          <Text style={typography.body}>English</Text>
        </View>
        <View style={styles.item}>
          <Text style={typography.body}>Map Style</Text>
          <Text style={typography.body}>Standard</Text>
        </View>
        <Text style={[typography.heading5, styles.sectionTitle]}>About</Text>
        <View style={styles.item}>
          <Text style={typography.body}>Version</Text>
          <Text style={typography.body}>1.0.0</Text>
        </View>
        <View style={styles.item}>
          <Text style={typography.body}>Help & Support</Text>
          <Text style={typography.body}>{'>'}</Text>
        </View>
        <Button
          title="Clear Cache"
          variant="outline"
          style={{ borderColor: colors.error, marginTop: spacing.large }}
          textStyle={{ color: colors.error }}
        />
        <NotificationPermissionModal
          visible={showNotificationModal}
          onAllow={handleAllowNotification}
          onDeny={handleDenyNotification}
        />
        <LocationPermissionModal
          visible={showLocationModal}
          onContinue={handleContinue}
          onNotNow={handleNotNow}
        />
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.medium,
  },
  header: {
    marginBottom: spacing.medium,
  },
  sectionTitle: {
    marginTop: spacing.xlarge,
    marginBottom: spacing.medium,
    color: colors.textSecondary,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.medium,
    backgroundColor: colors.surface,
    marginBottom: spacing.tiny,
    borderRadius: 8,
  },
});
