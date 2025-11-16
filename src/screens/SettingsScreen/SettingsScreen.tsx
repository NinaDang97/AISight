import React, { useEffect } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaWrapper } from '../../components/common/SafeAreaWrapper';
import { Button } from '../../components/common/Button';
import { colors, spacing, typography } from '../../styles';
import { usePermissions } from '../../hooks';
import { RESULTS } from 'react-native-permissions';

const Licenses = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={[styles.item, { marginTop: spacing.xlarge }]}>
        <Text style={typography.body}>Insert licences here</Text>
      </View>
    </ScrollView>
  );
};

export const SettingsScreen = () => {
  const appState = React.useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = React.useState(appState.current);
  const [licencesVisible, setLicencesVisible] = React.useState(false);
  const [notificationsEnabled, setNotifications] = React.useState(false);
  const [locationEnabled, setLocation] = React.useState(false);

  const { hasNotificationPermission, permissionState, checkPermissions, openSettings } =
    usePermissions();

  useEffect(() => {
    if (permissionState.notification === RESULTS.GRANTED) {
      setLocation(true);
    }
    if (permissionState.location === RESULTS.GRANTED) {
      setNotifications(true);
    }
    const sub = AppState.addEventListener('change', async nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App has come to the foreground!');
        await checkPermissions();
        console.log(hasNotificationPermission);
        if (permissionState.notification === RESULTS.GRANTED) {
          setLocation(true);
        }
        if (permissionState.location === RESULTS.GRANTED) {
          setNotifications(true);
        }
      }
      appState.current = nextAppState;
      setAppStateVisible(appState.current);
      console.log('AppState', appState.current);
    });
    return () => {
      sub.remove();
    };
  }, []);

  const showLicences = () => {
    setLicencesVisible(true);
  };

  const handleBack = () => {
    setLicencesVisible(false);
  };

  return (
    <SafeAreaWrapper backgroundColor={colors.background} barStyle="dark-content">
      {licencesVisible && (
        <>
          <Licenses />
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

      {!licencesVisible && (
        <ScrollView style={styles.container}>
          <Text style={[typography.heading2, styles.header]}>Settings</Text>
          <Text style={[typography.heading5, styles.sectionTitle]}>Preferences</Text>
          <Pressable onPress={openSettings}>
            <View style={styles.item}>
              <Text style={typography.body}>Push Notifications</Text>
              <Text style={typography.body}>{notificationsEnabled ? 'Enabled' : 'Disabled'}</Text>
            </View>
          </Pressable>
          <Pressable onPress={openSettings}>
            <View style={styles.item}>
              <Text style={typography.body}>Location services</Text>
              <Text style={typography.body}>{locationEnabled ? 'Enabled' : 'Disabled'}</Text>
            </View>
          </Pressable>
          <Text style={[typography.heading5, styles.sectionTitle]}>About</Text>
          <View style={styles.item}>
            <Text style={typography.body}>Version</Text>
            <Text style={typography.body}>1.0.0</Text>
          </View>
          <Pressable onPress={showLicences}>
            <View style={styles.item}>
              <Text style={typography.body}>Licences</Text>
              <Text style={typography.body}>{'>'}</Text>
            </View>
          </Pressable>
          <Button
            title="Clear Cache"
            variant="outline"
            onPress={openSettings}
            style={{ borderColor: colors.error, marginTop: spacing.large }}
            textStyle={{ color: colors.error }}
          />
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
});
