import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaWrapper } from '../../components/common/SafeAreaWrapper';
import { colors, typography, spacing } from '../../styles';

export const AnomalyScreen = () => {
  return (
    <SafeAreaWrapper backgroundColor={colors.background} barStyle="dark-content">
      <ScrollView style={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={typography.heading2}>Anomaly Detection</Text>
          <Text style={[typography.bodyLarge, { color: colors.textSecondary }]}>
            Monitor navigation anomalies
          </Text>
        </View>

        {/* Quick Actions Section */}
        <View style={styles.quickActions}>
          <View style={styles.actionCard}>
            <Text style={typography.body}>Track Vessels</Text>
          </View>
          <View style={styles.actionCard}>
            <Text style={typography.body}>View Map</Text>
          </View>
          <View style={styles.actionCard}>
            <Text style={typography.body}>Search</Text>
          </View>
          <View style={styles.actionCard}>
            <Text style={typography.body}>Settings</Text>
          </View>
        </View>

        {/* Recent Activity Section */}
        <View style={styles.section}>
          <Text style={typography.heading3}>Recent Activity</Text>
          <View style={styles.activityItem}>
            <View style={styles.icon} />
            <View>
              <Text style={typography.body}>Vessel spotted near port</Text>
              <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
                2 hours ago
              </Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <View style={styles.icon} />
            <View>
              <Text style={typography.body}>New tracking data received</Text>
              <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
                4 hours ago
              </Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <View style={styles.icon} />
            <View>
              <Text style={typography.body}>Alert: Vessel off course</Text>
              <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
                6 hours ago
              </Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <View style={styles.icon} />
            <View>
              <Text style={typography.body}>Map view updated</Text>
              <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
                8 hours ago
              </Text>
            </View>
          </View>
        </View>

        {/* Statistics Section */}
        <View style={styles.statistics}>
          <View style={styles.statCard}>
            <Text style={typography.heading3}>150</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              Total Vessels
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={typography.heading3}>42</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              Active Now
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={typography.heading3}>28</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              Tracked Today
            </Text>
          </View>
        </View>
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
    marginTop: spacing.large,
    marginBottom: spacing.large,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.large,
  },
  actionCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.medium,
    marginBottom: spacing.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  section: {
    marginBottom: spacing.large,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  icon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    marginRight: spacing.small,
  },
  statistics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.large,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.medium,
    marginHorizontal: spacing.small,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
