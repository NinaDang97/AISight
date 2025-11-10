import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Pressable } from 'react-native';
import { SafeAreaWrapper } from '../../components/common/SafeAreaWrapper';
import { Button } from '../../components/common/Button';
import { colors, typography, spacing } from '../../styles';
import { usePermissions } from '../../hooks';

const Licenses = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={[styles.item, {marginTop: spacing.xlarge}]}>
        <Text style={typography.body}>Insert licences here</Text>
      </View>
    </ScrollView>
  );
};

export const SettingsScreen = () => {
  const [darkMode, setDarkMode] = React.useState(false);
  const [licencesVisible, setLicencesVisible] = React.useState(false);

  const { openSettings } = usePermissions();

  const handleDarkMode = () => {
    setDarkMode(prev => !prev);
    // switch to batman
  };

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
            title={'< Back'}
            variant={'outline'}
            onPress={handleBack}
            style={{
              marginTop: spacing.large,
              marginBottom:spacing.small,
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
              <Text style={typography.body}>{'>'}</Text>
            </View>
          </Pressable>
          <Pressable onPress={openSettings}>
            <View style={styles.item}>
              <Text style={typography.body}>Location services</Text>
              <Text style={typography.body}>{'>'}</Text>
            </View>
          </Pressable>
          <View style={styles.item}>
            <Text style={typography.body}>Dark Mode</Text>
            <Switch
              value={darkMode}
              onValueChange={handleDarkMode}
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
