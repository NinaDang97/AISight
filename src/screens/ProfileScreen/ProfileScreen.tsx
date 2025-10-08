import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaWrapper } from '../../components/common/SafeAreaWrapper';
import { Button } from '../../components/common/Button';
import { colors, typography, spacing } from '../../styles';

export const ProfileScreen = () => {
  return (
    <SafeAreaWrapper backgroundColor={colors.background} barStyle="dark-content">
      <ScrollView style={styles.container}>
        {/* Profile Header Section */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={typography.heading1}>JD</Text>
          </View>
          <Text style={typography.heading3}>John Doe</Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            john.doe@example.com
          </Text>
        </View>

        {/* Statistics Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={typography.heading4}>24</Text>
            <Text style={typography.caption}>Vessels Tracked</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={typography.heading4}>156</Text>
            <Text style={typography.caption}>Hours Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={typography.heading4}>8</Text>
            <Text style={typography.caption}>Favorites</Text>
          </View>
        </View>

        {/* Profile Information Section */}
        <Text style={typography.heading5}>Profile Information</Text>
        <View style={styles.infoRow}>
          <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
            Name
          </Text>
          <Text style={[typography.body, { color: colors.textPrimary }]}>
            John Doe
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
            Email
          </Text>
          <Text style={[typography.body, { color: colors.textPrimary }]}>
            john.doe@example.com
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
            Phone
          </Text>
          <Text style={[typography.body, { color: colors.textPrimary }]}>
            +1 234 567 890
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
            Location
          </Text>
          <Text style={[typography.body, { color: colors.textPrimary }]}>
            New York, USA
          </Text>
        </View>

        {/* Preferences Section */}
        <Text style={typography.heading5}>Preferences</Text>
        <View style={styles.infoRow}>
          <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
            Notifications
          </Text>
          <Text style={[typography.body, { color: colors.textPrimary }]}>
            Enabled
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
            Dark Mode
          </Text>
          <Text style={[typography.body, { color: colors.textPrimary }]}>
            Disabled
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
            Language
          </Text>
          <Text style={[typography.body, { color: colors.textPrimary }]}>
            English
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
            Units
          </Text>
          <Text style={[typography.body, { color: colors.textPrimary }]}>
            Metric
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button title="Edit Profile" variant="primary" />
          <Button title="Sign Out" variant="outline" />
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.medium,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.large,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.large,
  },
  statCard: {
    alignItems: 'center',
    padding: spacing.medium,
    backgroundColor: colors.surface,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  buttonContainer: {
    marginTop: spacing.large,
    gap: spacing.medium,
  },
});
