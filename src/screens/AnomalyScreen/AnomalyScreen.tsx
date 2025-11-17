import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaWrapper } from '../../components/common/SafeAreaWrapper';
import { colors, typography, spacing, theme } from '../../styles';
import { useAnomaly } from '../../components/contexts';
import { useGnss } from '../../components/contexts';
import { calculatePathDistance, formatDuration, formatLocation } from '../../services/anomaly';
import { GnssAnomalyEvent } from '../../native/GnssModule';

// Type alias for filtering
type SeverityFilter = 'All' | 'High' | 'Medium' | 'Low';

export const AnomalyScreen = () => {
  const gnss = useGnss();
  const anomalyContext = useAnomaly();
  const [filter, setFilter] = useState<SeverityFilter>('All');

  // Combine active and detected anomalies
  const allAnomalies: GnssAnomalyEvent[] = anomalyContext.activeAnomaly
    ? [anomalyContext.activeAnomaly, ...anomalyContext.detectedAnomalies]
    : anomalyContext.detectedAnomalies;

  // Filter anomalies based on selected filter
  const filteredAnomalies = filter === 'All'
    ? allAnomalies
    : allAnomalies.filter(a => a.severity === filter);

  // Calculate stats
  const stats = {
    totalVessels: 1, // Current device
    activeNow: anomalyContext.activeAnomaly ? 1 : 0,
    totalAnomalies: allAnomalies.length,
    highSeverity: allAnomalies.filter(a => a.severity === 'High').length,
    mediumSeverity: allAnomalies.filter(a => a.severity === 'Medium').length,
    lowSeverity: allAnomalies.filter(a => a.severity === 'Low').length,
  };

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
      case 'completed': return colors.success;
      default: return colors.textSecondary;
    }
  };

  // Format timestamp to relative time
  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (hours > 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (minutes > 0) {
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else {
      return 'Just now';
    }
  };

  // Validate signal quality before starting calibration
  const validateSignalQuality = (): { isValid: boolean; message?: string } => {
    const MIN_SATELLITES = 6;
    const MIN_CN0 = 35.0;

    if (!anomalyContext.currentEpoch) {
      return {
        isValid: false,
        message: 'No GNSS measurements available yet. Please wait a moment and try again.'
      };
    }

    if (anomalyContext.currentEpoch.satelliteCount < MIN_SATELLITES) {
      return {
        isValid: false,
        message: `Poor signal quality: Only ${anomalyContext.currentEpoch.satelliteCount} satellites visible (minimum: ${MIN_SATELLITES}). Please move to an area with clear sky view.`
      };
    }

    if (anomalyContext.currentEpoch.avgCn0DbHz < MIN_CN0) {
      return {
        isValid: false,
        message: `Poor signal quality: C/N0 is ${anomalyContext.currentEpoch.avgCn0DbHz.toFixed(1)} dB-Hz (minimum: ${MIN_CN0} dB-Hz). Please move to an area with clear sky view.`
      };
    }

    return { isValid: true };
  };

  // Handle start/stop detection
  const toggleDetection = () => {
    if (!gnss.isTracking) {
      Alert.alert(
        'Start GNSS Tracking First',
        'Please start GNSS tracking from the GNSS screen before enabling anomaly detection.'
      );
      return;
    }

    if (anomalyContext.isDetecting) {
      anomalyContext.stopDetection();
    } else {
      // Validate signal quality before starting
      const validation = validateSignalQuality();
      if (!validation.isValid) {
        Alert.alert(
          'Signal Quality Too Low',
          validation.message,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Start Anyway',
              style: 'destructive',
              onPress: () => anomalyContext.startDetection(),
            },
          ]
        );
        return;
      }

      anomalyContext.startDetection();
    }
  };

  // Handle recalibration
  const handleRecalibrate = () => {
    Alert.alert(
      'Recalibrate Baseline',
      'This will reset the baseline reference. Use this if you have moved from a poor signal area to a location with better sky view. Any active anomaly will be marked as completed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Recalibrate',
          style: 'default',
          onPress: () => anomalyContext.recalibrate(),
        },
      ]
    );
  };

  return (
    <SafeAreaWrapper backgroundColor={colors.background} barStyle="dark-content">
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Anomaly Detection</Text>
          <Text style={styles.headerSubtitle}>
            {anomalyContext.isDetecting
              ? 'Monitoring GNSS signals for anomalies'
              : 'Monitor navigation anomalies'}
          </Text>
        </View>

        {/* GNSS Status Warning */}
        {!gnss.isGpsEnabled && (
          <View style={styles.section}>
            <View style={[styles.card, styles.warningCard]}>
              <Text style={styles.warningText}>
                GPS is disabled. Please enable GPS to use anomaly detection.
              </Text>
            </View>
          </View>
        )}

        {/* Calibration Progress */}
        {anomalyContext.isDetecting && !anomalyContext.detectorReady && (
          <View style={styles.section}>
            <View style={[styles.card, styles.infoCard]}>
              <Text style={styles.infoText}>
                Calibrating baseline... {anomalyContext.remainingEpochs} epochs remaining
              </Text>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${anomalyContext.calibrationProgress}%` }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {anomalyContext.calibrationProgress}% complete
              </Text>
              {anomalyContext.currentEpoch && (
                <View style={styles.calibrationStats}>
                  <Text style={styles.calibrationStatText}>
                    Current Signal - Satellites: {anomalyContext.currentEpoch.satelliteCount}, C/N0: {anomalyContext.currentEpoch.avgCn0DbHz.toFixed(1)} dB-Hz
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Baseline Statistics */}
        {anomalyContext.isDetecting && anomalyContext.baselineStats && (
          <View style={styles.section}>
            <View style={styles.card}>
              <View style={styles.baselineHeader}>
                <Text style={styles.baselineTitle}>Baseline Statistics</Text>
                {anomalyContext.isBaselineFrozen && (
                  <View style={styles.frozenBadge}>
                    <Text style={styles.frozenText}>FROZEN</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardText}>
                Avg C/N0: {anomalyContext.baselineStats.avgCn0.toFixed(1)} dB-Hz
              </Text>
              {anomalyContext.baselineStats.avgAgc !== undefined && (
                <Text style={styles.cardText}>
                  Avg AGC: {anomalyContext.baselineStats.avgAgc.toFixed(1)} dB
                </Text>
              )}
              <Text style={styles.cardText}>
                Avg Satellites: {anomalyContext.baselineStats.satelliteCount}
              </Text>
              <Text style={styles.cardText}>
                Based on {anomalyContext.baselineStats.epochCount} epochs
              </Text>
            </View>
          </View>
        )}

        {/* Control Buttons */}
        <View style={styles.section}>
          <View style={styles.controlRow}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                anomalyContext.isDetecting ? styles.stopButton : styles.startButton,
                !gnss.isGpsEnabled && styles.disabledButton,
              ]}
              onPress={toggleDetection}
              disabled={!gnss.isGpsEnabled}
            >
              <Text style={styles.controlButtonText}>
                {anomalyContext.isDetecting ? 'Stop Detection' : 'Start Detection'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.controlButton,
                styles.secondaryButton,
                (allAnomalies.length === 0) && styles.disabledButton,
              ]}
              onPress={() => {
                if (allAnomalies.length > 0) {
                  Alert.alert(
                    'Clear Anomalies',
                    'Are you sure you want to clear all detected anomalies?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Clear',
                        style: 'destructive',
                        onPress: anomalyContext.clearAnomalies,
                      },
                    ]
                  );
                }
              }}
              disabled={allAnomalies.length === 0}
            >
              <Text style={styles.controlButtonText}>Clear Data</Text>
            </TouchableOpacity>
          </View>

          {/* Recalibrate button - shown when detecting and baseline established */}
          {anomalyContext.isDetecting && anomalyContext.detectorReady && (
            <TouchableOpacity
              style={[styles.controlButton, styles.recalibrateButton, styles.fullWidthButton]}
              onPress={handleRecalibrate}
            >
              <Text style={styles.controlButtonText}>Recalibrate Baseline</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Statistics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalVessels}</Text>
              <Text style={styles.statLabel}>Your Device</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: stats.activeNow > 0 ? colors.error : colors.success }]}>
                {stats.activeNow}
              </Text>
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
            Detected Anomalies {filteredAnomalies.length > 0 && `(${filteredAnomalies.length})`}
          </Text>
          <View style={styles.anomaliesCard}>
            {!anomalyContext.isDetecting && allAnomalies.length === 0 ? (
              <Text style={styles.noDataText}>
                No anomalies detected. Start detection to monitor GNSS signals.
              </Text>
            ) : filteredAnomalies.length === 0 ? (
              <Text style={styles.noDataText}>
                No {filter.toLowerCase()} severity anomalies found.
              </Text>
            ) : (
              filteredAnomalies.map((anom, index) => (
                <View
                  key={anom.id}
                  style={[
                    styles.anomalyItem,
                    index === filteredAnomalies.length - 1 && styles.lastItem
                  ]}
                >
                  <View style={styles.anomalyHeader}>
                    <Text style={styles.anomalyTitle}>{anom.type.replace(/_/g, ' ')}</Text>
                    <View style={[
                      styles.severityBadge,
                      { backgroundColor: getSeverityColor(anom.severity) }
                    ]}>
                      <Text style={styles.severityText}>{anom.severity}</Text>
                    </View>
                  </View>

                  <View style={styles.anomalyDetails}>
                    <Text style={styles.vesselName}>Current Device</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(anom.status) }
                    ]}>
                      <Text style={styles.statusText}>{anom.status}</Text>
                    </View>
                  </View>

                  <Text style={styles.anomalyLocation}>
                    Start: {formatLocation(anom.startLocation)}
                  </Text>

                  {anom.endLocation && (
                    <Text style={styles.anomalyLocation}>
                      End: {formatLocation(anom.endLocation)}
                    </Text>
                  )}

                  <Text style={styles.anomalyDescription}>{anom.description}</Text>

                  <View style={styles.anomalyMetrics}>
                    <Text style={styles.metricText}>
                      Duration: {formatDuration(
                        (anom.endTime || Date.now()) - anom.startTime
                      )}
                    </Text>
                    <Text style={styles.metricText}>
                      Path: {anom.path.length} points ({calculatePathDistance(anom.path).toFixed(1)}m)
                    </Text>
                  </View>

                  <Text style={styles.timestamp}>{formatTimestamp(anom.startTime)}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Current Epoch Info (for debugging/monitoring) */}
        {anomalyContext.isDetecting && anomalyContext.currentEpoch && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Measurements</Text>
            <View style={styles.card}>
              <Text style={styles.cardText}>
                Satellites: {anomalyContext.currentEpoch.satelliteCount}
              </Text>
              <Text style={styles.cardText}>
                Avg C/N0: {anomalyContext.currentEpoch.avgCn0DbHz.toFixed(1)} dB-Hz
              </Text>
              {anomalyContext.currentEpoch.avgAgcLevelDb !== undefined && (
                <Text style={styles.cardText}>
                  Avg AGC: {anomalyContext.currentEpoch.avgAgcLevelDb.toFixed(1)} dB
                </Text>
              )}
              <Text style={styles.cardText}>
                Detector Status: {anomalyContext.detectorReady ? 'Ready' : 'Collecting baseline...'}
              </Text>
            </View>
          </View>
        )}
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.medium,
    padding: spacing.medium,
    ...theme.shadows.small,
  },
  warningCard: {
    backgroundColor: colors.error + '20',
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  warningText: {
    ...typography.body,
    color: colors.error,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: colors.info + '20',
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  infoText: {
    ...typography.body,
    color: colors.info,
    fontWeight: '500',
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
  startButton: {
    backgroundColor: colors.success,
  },
  stopButton: {
    backgroundColor: colors.error,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
  },
  recalibrateButton: {
    backgroundColor: colors.warning,
    marginTop: spacing.small,
  },
  fullWidthButton: {
    flex: undefined,
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
  anomalyMetrics: {
    marginTop: spacing.xsmall,
    marginBottom: spacing.xsmall,
  },
  metricText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  timestamp: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  noDataText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: spacing.medium,
  },
  cardText: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.xsmall,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: theme.borderRadius.small,
    marginTop: spacing.small,
    marginBottom: spacing.xsmall,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.info,
    borderRadius: theme.borderRadius.small,
  },
  progressText: {
    ...typography.caption,
    color: colors.info,
    textAlign: 'center',
    fontWeight: '600',
  },
  calibrationStats: {
    marginTop: spacing.small,
    paddingTop: spacing.small,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  calibrationStatText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  baselineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  baselineTitle: {
    ...typography.heading4,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  frozenBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.small,
    paddingVertical: spacing.xsmall,
    borderRadius: theme.borderRadius.small,
  },
  frozenText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '700',
  },
});
