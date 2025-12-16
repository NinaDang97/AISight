import React, { useCallback } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaWrapper } from '../../components/common/SafeAreaWrapper';
import { Button } from '../../components/common/Button';
import { useAppContext } from '../../contexts';
import { colors, spacing, typography } from '../../styles';
import { ReactNativeLegal } from 'react-native-legal';

const MapCopyrights = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={[styles.item, { marginTop: spacing.xlarge }]}>
        <Text style={typography.body}>
          Map copyright notices{'\n\n'}
          Map data hosting{'\n'}
          Copyright (c) MapTiler https://www.maptiler.com/copyright/{'\n\n'}
          Map data{'\n'}
          Copyright (c) OpenStreetMap contributors https://www.openstreetmap.org/copyright{'\n'}
          Licensed under Open Database License (ODbL) https://opendatacommons.org/licenses/odbl/
        </Text>
      </View>
    </ScrollView>
  );
};

export const SettingsScreen = () => {
  const [mapCopyrightsVisible, setMapCopyrightsVisible] = React.useState(false);

  const {
    permissions,
    hasNotificationPermission,
    hasLocationPermission,
    isNotificationBlocked,
    isLocationBlocked,
    openSettings: openSystemSettings,
    checkPermissions,
  } = useAppContext();

  // Check permissions when screen comes into focus
  // This runs every time the user navigates to this screen or returns from system settings
  useFocusEffect(
    useCallback(() => {
      checkPermissions();
    }, [checkPermissions]),
  );

  const showMapCopyrights = () => {
    setMapCopyrightsVisible(true);
  };

  const handleBack = () => {
    setMapCopyrightsVisible(false);
  };

  const handleNotificationToggle = async (value: boolean) => {
    try {
      if (value) {
        // User wants to enable notifications - guide to system settings
        const title = isNotificationBlocked ? 'Permission Blocked' : 'Enable Notifications';
        const message = isNotificationBlocked
          ? 'Notification permission is blocked. Please enable it in your device settings.'
          : 'Please enable notifications in your device settings.';

        Alert.alert(title, message, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: async () => {
              await openSystemSettings();
              setTimeout(() => checkPermissions(), 500);
            },
          },
        ]);
      } else {
        // User wants to disable notifications - guide to system settings
        Alert.alert(
          'Disable Notifications',
          'To disable notifications, please go to your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: async () => {
                await openSystemSettings();
                setTimeout(() => checkPermissions(), 500);
              },
            },
          ],
        );
      }
    } catch (err) {
      logger.error('Error in handleNotificationToggle:', err);
      Alert.alert('Error', 'Failed to update notification permission. Please try again.', [
        { text: 'OK' },
      ]);
    }
  };

  const handleLocationToggle = async (value: boolean) => {
    try {
      if (value) {
        // User wants to enable location
        const title = isLocationBlocked ? 'Permission Blocked' : 'Enable Location';
        const message = isLocationBlocked
          ? 'Location permission is blocked. Please enable it in your device settings.'
          : 'Please enable location services in your device settings.';

        Alert.alert(title, message, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: async () => {
              await openSystemSettings();
              setTimeout(() => checkPermissions(), 500);
            },
          },
        ]);
      } else {
        Alert.alert(
          'Disable Location',
          'To disable location services, please go to your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: async () => {
                await openSystemSettings();
                setTimeout(() => checkPermissions(), 500);
              },
            },
          ],
        );
      }
    } catch (err) {
      logger.error('Error in handleLocationToggle:', err);
      Alert.alert('Error', 'Failed to update location permission. Please try again.', [
        { text: 'OK' },
      ]);
    }
  };

  return (
    <SafeAreaWrapper backgroundColor={colors.background} barStyle="dark-content">
      {mapCopyrightsVisible && (
        <>
          <MapCopyrights />
          <Button
            title="< Back"
            variant="outline"
            onPress={handleBack}
            style={{
              marginTop: spacing.large,
              marginBottom: spacing.small,
              marginStart: spacing.small,
              marginEnd: spacing.small,
            }}
          />
        </>
      )}

      {!mapCopyrightsVisible && (
        <ScrollView style={styles.container}>
          <Text style={[typography.heading2, styles.header]}>Settings</Text>
          <Text style={[typography.heading5, styles.sectionTitle]}>Permissions</Text>
          <View style={styles.item}>
            <View style={styles.itemContent}>
              <Text style={typography.body}>Push Notifications</Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>
                {isNotificationBlocked
                  ? 'Blocked - Open Settings'
                  : hasNotificationPermission
                    ? 'Enabled'
                    : 'Disabled'}
              </Text>
            </View>
            <Switch
              value={hasNotificationPermission}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: colors.textSecondary, true: colors.primary }}
              thumbColor={hasNotificationPermission ? colors.surface : colors.surface}
            />
          </View>
          <View style={styles.item}>
            <View style={styles.itemContent}>
              <Text style={typography.body}>Location Services</Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>
                {isLocationBlocked
                  ? 'Blocked - Open Settings'
                  : hasLocationPermission
                    ? 'Enabled'
                    : 'Disabled'}
              </Text>
            </View>
            <Switch
              value={hasLocationPermission}
              onValueChange={handleLocationToggle}
              trackColor={{ false: colors.textSecondary, true: colors.primary }}
              thumbColor={hasLocationPermission ? colors.surface : colors.surface}
            />
          </View>
          <Text style={[typography.heading5, styles.sectionTitle]}>About</Text>
          <View style={styles.item}>
            <Text style={typography.body}>Version</Text>
            <Text style={typography.body}>1.0.0</Text>
          </View>
          <Pressable onPress={showMapCopyrights}>
            <View style={styles.item}>
              <Text style={typography.body}>Map copyrights</Text>
              <Text style={typography.body}>{'>'}</Text>
            </View>
          </Pressable>
          <Pressable onPress={() => ReactNativeLegal.launchLicenseListScreen('3rd Party Licenses')}>
            <View style={styles.item}>
              <Text style={typography.body}>3rd party licenses</Text>
              <Text style={typography.body}>{'>'}</Text>
            </View>
          </Pressable>
          {/* 
          <Button
            title="Clear Cache"
            variant="outline"
            onPress={() => {
              Alert.alert('Clear Cache', 'This feature will be available soon.', [{ text: 'OK' }]);
            }}
            style={{ borderColor: colors.error, marginTop: spacing.large }}
            textStyle={{ color: colors.error }}
          />
          TODO: Remove comments when implementing offline maps etc. */}
        </ScrollView>
      )}
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
  itemContent: {
    flex: 1,
    marginRight: spacing.medium,
  },
});
