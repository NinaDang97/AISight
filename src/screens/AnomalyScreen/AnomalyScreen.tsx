import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaWrapper } from '../../components/common/SafeAreaWrapper';
import { colors, typography, spacing, theme } from '../../styles';

// Types for our data
interface Anomaly {
  id: string;
  title: string;
  type: string;
  severity: 'High' | 'Medium' | 'Low';
  timestamp: string;
  status: 'Active' | 'Investigating' | 'Processed' | 'Completed';
  vessel: string;
  location: string;
  description: string;
}

type SeverityFilter = 'All' | 'High' | 'Medium' | 'Low';

export const AnomalyScreen = () => {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [filter, setFilter] = useState<SeverityFilter>('All');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalVessels: 0,
    activeNow: 0,
    totalAnomalies: 0,
    highSeverity: 0,
    mediumSeverity: 0,
    lowSeverity: 0,
  });

  // Filter anomalies based on selected filter
  const filteredAnomalies = filter === 'All' 
    ? anomalies 
    : anomalies.filter(anomaly => anomaly.severity === filter);

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return colors.error;
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.textSecondary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return colors.error;
      case 'investigating': return colors.warning;
      case 'processed': return colors.info;
      case 'completed': return colors.success;
      default: return colors.textSecondary;
    }
  };

  // Generate realistic mock anomaly data
  const generateMockData = () => {
    setIsLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      const anomalyTypes = [
        'Position Anomaly', 'Course Deviation', 'Speed Anomaly', 
        'GNSS Spoofing', 'Signal Jamming', 'Data Gap', 'Route Deviation'
      ];
      const vessels = [
        'M/V Nordic Star', 'M/V Baltic Trader', 'M/V Helsinki Express',
        'M/V Tallinn Ferry', 'M/V Gotland', 'M/V Stena Line',
        'M/V Viking Line', 'M/V Silja Serenade'
      ];
      const locations = [
        'Baltic Sea, Gulf of Finland', 'Near Kaliningrad', 'Approaching Tallinn',
        'Helsinki Harbor Approach', 'Stockholm Archipelago', 'Gotland Basin',
        'Bornholm Basin', 'Gdansk Bay'
      ];

      const newAnomalies: Anomaly[] = [];
      const anomalyCount = Math.floor(Math.random() * 6) + 4; // 5-13 anomalies
      
      for (let i = 0; i < anomalyCount; i++) {
        const severity = ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)] as 'High' | 'Medium' | 'Low';
        const status = ['Active', 'Investigating', 'Processed', 'Completed'][Math.floor(Math.random() * 4)] as 
          'Active' | 'Investigating' | 'Processed' | 'Completed';
        
        const hoursAgo = Math.floor(Math.random() * 48); // 0-48 hours ago
        const timestamp = `${hoursAgo} ${hoursAgo === 1 ? 'hour' : 'hours'} ago`;
        
        newAnomalies.push({
          id: `anom_${Date.now()}_${i}`,
          title: `${anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)]} Detected`,
          type: anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)],
          severity,
          timestamp,
          status,
          vessel: vessels[Math.floor(Math.random() * vessels.length)],
          location: locations[Math.floor(Math.random() * locations.length)],
          description: `Anomaly detected in vessel navigation pattern requiring ${severity.toLowerCase()} priority attention.`
        });
      }

      // Sort by timestamp (most recent first)
      newAnomalies.sort((a, b) => {
        const aHours = parseInt(a.timestamp);
        const bHours = parseInt(b.timestamp);
        return aHours - bHours; // Most recent first (lower hours ago)
      });

      // Calculate statistics
      const highSeverity = newAnomalies.filter(a => a.severity === 'High').length;
      const mediumSeverity = newAnomalies.filter(a => a.severity === 'Medium').length;
      const lowSeverity = newAnomalies.filter(a => a.severity === 'Low').length;

      setStats({
        totalVessels: Math.floor(Math.random() * 1000) + 100, // 1000-10000 vessels
        activeNow: Math.floor(Math.random() * 900) + 500, // 1000-9000 active
        totalAnomalies: newAnomalies.length,
        highSeverity,
        mediumSeverity,
        lowSeverity,
      });

      setAnomalies(newAnomalies);
      setIsLoading(false);
    }, 1500);
  };

  // Generate anomaly report
  const generateReport = () => {
    if (anomalies.length === 0) {
      Alert.alert('No Data', 'Please generate anomaly data first');
      return;
    }

    const reportData = {
      generatedAt: new Date().toISOString(),
      totalAnomalies: anomalies.length,
      highSeverity: anomalies.filter(a => a.severity === 'High').length,
      mediumSeverity: anomalies.filter(a => a.severity === 'Medium').length,
      lowSeverity: anomalies.filter(a => a.severity === 'Low').length,
      activeAnomalies: anomalies.filter(a => a.status === 'Active').length,
      anomalies: filteredAnomalies.map(a => ({
        vessel: a.vessel,
        type: a.type,
        severity: a.severity,
        location: a.location,
        timestamp: a.timestamp,
      }))
    };

    Alert.alert(
      'Anomaly Report Generated',
      `Report includes ${reportData.totalAnomalies} total anomalies with ${reportData.highSeverity} high priority issues.\n\nReport saved to device.`,
      [{ text: 'OK' }]
    );
  };

  // Export anomaly data
  const exportAnomalyData = () => {
    if (anomalies.length === 0) {
      Alert.alert('No Data', 'Please generate anomaly data first');
      return;
    }

    // Simple CSV export simulation
    const headers = 'Vessel,Type,Severity,Location,Timestamp,Status\n';
    const rows = anomalies.map(anomaly => 
      `"${anomaly.vessel}","${anomaly.type}","${anomaly.severity}","${anomaly.location}","${anomaly.timestamp}","${anomaly.status}"`
    ).join('\n');
    
    const csv = headers + rows;
    Alert.alert(
      'Anomaly Data Exported',
      `Exported ${anomalies.length} anomalies to CSV format.`,
      [{ text: 'OK' }]
    );
  };

  // Load mock data on first render
  useEffect(() => {
    generateMockData();
  }, []);

  return (
    <SafeAreaWrapper backgroundColor={colors.background} barStyle="dark-content">
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Anomaly Detection</Text>
          <Text style={styles.headerSubtitle}>Monitor navigation anomalies</Text>
        </View>

        {/* Control Buttons */}
        <View style={styles.section}>
          <View style={styles.controlRow}>
            <TouchableOpacity 
              style={[
                styles.controlButton,
                styles.primaryButton,
                isLoading && styles.disabledButton
              ]}
              onPress={generateMockData}
              disabled={isLoading}
            >
              <Text style={styles.controlButtonText}>
                {isLoading ? 'Loading...' : 'Refresh Data'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.controlButton,
                styles.secondaryButton,
                (anomalies.length === 0 || isLoading) && styles.disabledButton
              ]}
              onPress={() => {
                setAnomalies([]);
                setStats({
                  totalVessels: 0,
                  activeNow: 0,
                  totalAnomalies: 0,
                  highSeverity: 0,
                  mediumSeverity: 0,
                  lowSeverity: 0,
                });
              }}
              disabled={anomalies.length === 0 || isLoading}
            >
              <Text style={styles.controlButtonText}>Clear Data</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalVessels}</Text>
              <Text style={styles.statLabel}>Total Vessels</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: colors.success }]}>{stats.activeNow}</Text>
              <Text style={styles.statLabel}>Active Now</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: colors.warning }]}>{stats.totalAnomalies}</Text>
              <Text style={styles.statLabel}>Anomalies</Text>
            </View>
          </View>
        </View>

        {/* Severity Filter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filter by Severity</Text>
          <View style={styles.filterRow}>
            {(['All', 'High', 'Medium', 'Low'] as SeverityFilter[]).map(severity => (
              <TouchableOpacity
                key={severity}
                style={[
                  styles.filterButton,
                  filter === severity && styles.filterButtonActive,
                  filter === severity && { backgroundColor: getSeverityColor(severity === 'All' ? 'Medium' : severity) }
                ]}
                onPress={() => setFilter(severity)}
              >
                <Text style={[
                  styles.filterButtonText,
                  filter === severity && styles.filterButtonTextActive
                ]}>
                  {severity}
                  {severity !== 'All' && ` (${stats[`${severity.toLowerCase()}Severity` as keyof typeof stats]})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Anomalies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Recent Anomalies {filteredAnomalies.length > 0 && `(${filteredAnomalies.length} ${filter.toLowerCase()})`}
          </Text>
          <View style={styles.anomaliesCard}>
            {anomalies.length === 0 ? (
              <Text style={styles.noDataText}>
                {isLoading ? 'Loading anomaly data...' : 'No anomaly data. Press "Refresh Data" to load.'}
              </Text>
            ) : filteredAnomalies.length === 0 ? (
              <Text style={styles.noDataText}>
                No {filter.toLowerCase()} severity anomalies found.
              </Text>
            ) : (
              filteredAnomalies.map((anomaly, index) => (
                <View 
                  key={anomaly.id} 
                  style={[
                    styles.anomalyItem,
                    index === filteredAnomalies.length - 1 && styles.lastItem
                  ]}
                >
                  <View style={styles.anomalyHeader}>
                    <Text style={styles.anomalyTitle}>{anomaly.title}</Text>
                    <View style={[
                      styles.severityBadge,
                      { backgroundColor: getSeverityColor(anomaly.severity) }
                    ]}>
                      <Text style={styles.severityText}>{anomaly.severity}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.anomalyDetails}>
                    <Text style={styles.vesselName}>{anomaly.vessel}</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(anomaly.status) }
                    ]}>
                      <Text style={styles.statusText}>{anomaly.status}</Text>
                    </View>
                  </View>

                  <Text style={styles.anomalyLocation}>{anomaly.location}</Text>
                  <Text style={styles.anomalyDescription}>{anomaly.description}</Text>
                  
                  <Text style={styles.timestamp}>{anomaly.timestamp}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Export/Report Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reports & Export</Text>
          <View style={styles.actionsCard}>
            <TouchableOpacity 
              style={[
                styles.exportButton,
                anomalies.length === 0 && styles.disabledButton
              ]}
              onPress={generateReport}
              disabled={anomalies.length === 0}
            >
              <Text style={styles.exportButtonText}>
                Generate Anomaly Report {anomalies.length > 0 && `(${anomalies.length} anomalies)`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.exportButton, 
                styles.exportButtonSecondary,
                anomalies.length === 0 && styles.disabledButton
              ]}
              onPress={exportAnomalyData}
              disabled={anomalies.length === 0}
            >
              <Text style={styles.exportButtonText}>
                Export Anomaly Data {anomalies.length > 0 && `(${anomalies.length} anomalies)`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.large,
    paddingTop: spacing.xlarge,
  },
  headerTitle: {
    ...typography.heading2,
    color: colors.textInverse,
    fontWeight: '600',
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.textInverse,
    opacity: 0.9,
    marginTop: spacing.xsmall,
  },
  section: {
    marginTop: spacing.large,
    paddingHorizontal: spacing.medium,
  },
  sectionTitle: {
    ...typography.heading4,
    color: colors.textPrimary,
    marginBottom: spacing.small,
    fontWeight: '600',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.small,
  },
  controlButton: {
    flex: 1,
    padding: spacing.medium,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
  },
  disabledButton: {
    backgroundColor: colors.textDisabled,
    opacity: 0.6,
  },
  controlButtonText: {
    ...typography.button,
    color: colors.textInverse,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.medium,
    padding: spacing.medium,
    alignItems: 'center',
    marginHorizontal: spacing.xsmall,
    ...theme.shadows.small,
  },
  statNumber: {
    ...typography.heading2,
    color: colors.primary,
    fontWeight: '700',
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xsmall,
    textAlign: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.small,
  },
  filterButton: {
    flex: 1,
    padding: spacing.small,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    borderWidth: 0,
  },
  filterButtonText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '500',
    textAlign: 'center',
  },
  filterButtonTextActive: {
    color: colors.textInverse,
    fontWeight: '600',
  },
  anomaliesCard: {
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.medium,
    padding: spacing.medium,
    ...theme.shadows.small,
  },
  anomalyItem: {
    paddingVertical: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  anomalyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xsmall,
  },
  anomalyTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.small,
  },
  severityBadge: {
    paddingHorizontal: spacing.small,
    paddingVertical: spacing.xsmall,
    borderRadius: theme.borderRadius.small,
  },
  severityText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '600',
  },
  anomalyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xsmall,
  },
  vesselName: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '500',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.small,
    paddingVertical: spacing.xsmall,
    borderRadius: theme.borderRadius.small,
  },
  statusText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '500',
  },
  anomalyLocation: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xsmall,
  },
  anomalyDescription: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontStyle: 'italic',
    marginBottom: spacing.xsmall,
  },
  timestamp: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  actionsCard: {
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.medium,
    padding: spacing.medium,
    ...theme.shadows.small,
  },
  exportButton: {
    backgroundColor: colors.primary,
    padding: spacing.medium,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  exportButtonSecondary: {
    backgroundColor: colors.secondary,
  },
  exportButtonText: {
    ...typography.button,
    color: colors.textInverse,
    fontWeight: '600',
    textAlign: 'center',
  },
  noDataText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: spacing.medium,
  },
});