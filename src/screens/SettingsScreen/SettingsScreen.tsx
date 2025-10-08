import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { SafeAreaWrapper } from '../../components/common/SafeAreaWrapper';
import { Button } from '../../components/common/Button';
import { colors, typography, spacing } from '../../styles';

export const SettingsScreen = () => {
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);
  const [autoRefresh, setAutoRefresh] = React.useState(true);

  return (
    <SafeAreaWrapper backgroundColor={colors.background} barStyle="dark-content">
      <ScrollView style={styles.container}>
        <Text style={[typography.heading2, styles.header]}>Settings</Text>
        <Text style={[typography.heading5, styles.sectionTitle]}>Account</Text>
        <View style={styles.item}>
          <Text style={typography.body}>Profile</Text>
          <Text style={typography.body}>{'>'}</Text>
        </View>
        <View style={styles.item}>
          <Text style={typography.body}>Privacy</Text>
          <Text style={typography.body}>{'>'}</Text>
        </View>
        <View style={styles.item}>
          <Text style={typography.body}>Security</Text>
          <Text style={typography.body}>{'>'}</Text>
        </View>
        <Text style={[typography.heading5, styles.sectionTitle]}>Preferences</Text>
        <View style={styles.item}>
          <Text style={typography.body}>Push Notifications</Text>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
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
        <View style={styles.item}>
          <Text style={typography.body}>Auto Refresh</Text>
          <Switch
            value={autoRefresh}
            onValueChange={setAutoRefresh}
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
          <Text style={typography.body}>Units</Text>
          <Text style={typography.body}>Metric</Text>
        </View>
        <View style={styles.item}>
          <Text style={typography.body}>Map Style</Text>
          <Text style={typography.body}>Standard</Text>
        </View>
        <Text style={[typography.heading5, styles.sectionTitle]}>Data</Text>
        <View style={styles.item}>
          <Text style={typography.body}>Clear Cache</Text>
          <Text style={typography.body}>{'>'}</Text>
        </View>
        <View style={styles.item}>
          <Text style={typography.body}>Download Offline Maps</Text>
          <Text style={typography.body}>{'>'}</Text>
        </View>
        <View style={styles.item}>
          <Text style={typography.body}>Data Usage</Text>
          <Text style={typography.body}>{'>'}</Text>
        </View>
        <Text style={[typography.heading5, styles.sectionTitle]}>About</Text>
        <View style={styles.item}>
          <Text style={typography.body}>Version</Text>
          <Text style={typography.body}>1.0.0</Text>
        </View>
        <View style={styles.item}>
          <Text style={typography.body}>Terms of Service</Text>
          <Text style={typography.body}>{'>'}</Text>
        </View>
        <View style={styles.item}>
          <Text style={typography.body}>Privacy Policy</Text>
          <Text style={typography.body}>{'>'}</Text>
        </View>
        <View style={styles.item}>
          <Text style={typography.body}>Help & Support</Text>
          <Text style={typography.body}>{'>'}</Text>
        </View>
        <Button
          title="Sign Out"
          variant="outline"
          style={{ borderColor: colors.error, marginTop: spacing.large }}
          textStyle={{ color: colors.error }}
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
