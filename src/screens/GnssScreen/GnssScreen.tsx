import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaWrapper } from '../../components/common/SafeAreaWrapper';
import { colors, typography, spacing, theme } from '../../styles';
import { useGnss } from '../../components/contexts';
import { GnssExportManager } from '../../components/gnss';

// Types for satellite display
interface SatelliteSignal {
  id: string;
  displayId: string;
  system: string;
  strength: string;
  dbValue: number;
}

export const GnssScreen: React.FC = () => {
  // Use GnssContext
  const {
    isTracking,
    isLogging,
    location,
    status,
    measurements,
    isGpsEnabled,
    loggingState,
    startTracking,
    stopTracking,
    startLogging,
    stopLogging,
    checkGpsEnabled,
  } = useGnss();

  // Frontend display state
  const [recordingTime, setRecordingTime] = useState(0);
  const [signalQuality, setSignalQuality] = useState('Unknown');
  const [satelliteSignals, setSatelliteSignals] = useState<SatelliteSignal[]>([]);

  // Refs for stable measurements
  const gpsCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check GPS status on mount and periodically
  useEffect(() => {
    checkGpsEnabled();

    // Set up periodic GPS status check
    gpsCheckIntervalRef.current = setInterval(() => {
      checkGpsEnabled();
    }, 3000);

    return () => {
      if (gpsCheckIntervalRef.current) {
        clearInterval(gpsCheckIntervalRef.current);
      }
    };
  }, [checkGpsEnabled]);

  // Timer for recording duration display
  useEffect(() => {
    let interval: any;
    if (isLogging) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isLogging]);

  // Update satellite displays when measurements change
  useEffect(() => {
    if (measurements.length > 0) {
      updateSatelliteDisplays(measurements);
    }
  }, [measurements]);

  const handleStartTracking = async () => {
    const success = await startTracking();
    if (!success) {
      if (!isGpsEnabled) {
        Alert.alert(
          'GPS Required',
          'GPS is disabled. Please enable GPS in your device settings to collect GNSS data.',
          [{ text: 'OK' }],
        );
      }
    }
  };

  const handleStopTracking = async () => {
    await stopTracking();
    setSatelliteSignals([]);
    setSignalQuality('Unknown');
  };

  const handleToggleLogging = async () => {
    if (isLogging) {
      await stopLogging();
    } else {
      if (!isTracking) {
        Alert.alert(
          'Start Tracking First',
          'Please start GNSS tracking before logging',
        );
        return;
      }

      try {
        const filePath = await startLogging();
        if (!filePath) {
          throw new Error('Failed to start logging');
        }
        setRecordingTime(0);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        Alert.alert('Error', `Failed to start logging: ${errorMessage}`);
      }
    }
  };

  // Frontend display functions
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSignalColor = (dbValue: number) => {
    if (dbValue >= 40) return colors.success;
    if (dbValue >= 35) return colors.warning;
    return colors.error;
  };

  const getSignalQuality = (signals: SatelliteSignal[]): string => {
    if (signals.length === 0) return 'Unknown';
    const validSignals = signals.filter(s => s.dbValue > 0);
    if (validSignals.length === 0) return 'Unknown';
    
    const avgStrength = validSignals.reduce((sum, signal) => sum + signal.dbValue, 0) / validSignals.length;
    if (avgStrength >= 40) return 'Excellent';
    if (avgStrength >= 35) return 'Good';
    if (avgStrength >= 30) return 'Fair';
    return 'Poor';
  };

  const getConstellationDisplayId = (svid: number, constellation: string): string => {
    const prefixMap: { [key: string]: string } = {
      'GPS': 'G',
      'GLONASS': 'R', 
      'GALILEO': 'E',
      'BEIDOU': 'C',
      'QZSS': 'J',
      'SBAS': 'S'
    };
    
    const prefix = prefixMap[constellation] || 'X';
    return `${prefix}${svid.toString().padStart(2, '0')}`;
  };

  // Convert GnssMeasurement data to display format
  const updateSatelliteDisplays = (gnssMeasurements: any[]) => {
    const signals: SatelliteSignal[] = [];

    // Filter and sort measurements by signal strength
    const validMeasurements = gnssMeasurements
      .filter(m => m.cn0DbHz !== undefined && m.cn0DbHz > 0)
      .sort((a, b) => (b.cn0DbHz || 0) - (a.cn0DbHz || 0));

    validMeasurements.forEach((measurement) => {
      const dbValue = measurement.cn0DbHz || 0;
      const constellation = measurement.constellation || 'UNKNOWN';
      const svid = measurement.svid || 0;
      
      const displayId = getConstellationDisplayId(svid, constellation);
      const uniqueId = `${constellation}-${svid}`;

      // Create signal entry
      signals.push({
        id: uniqueId,
        displayId,
        system: constellation,
        strength: `${dbValue.toFixed(1)} dB-Hz`,
        dbValue,
      });
    });

    setSatelliteSignals(signals);
    setSignalQuality(getSignalQuality(signals));
  };

  // Calculate constellation counts for stable rendering
  const getConstellationCounts = () => {
    const counts: { [key: string]: number } = {};
    satelliteSignals.forEach(signal => {
      counts[signal.system] = (counts[signal.system] || 0) + 1;
    });
    return counts;
  };

  const constellationCounts = getConstellationCounts();

  return (
    <SafeAreaWrapper backgroundColor={colors.background} barStyle="dark-content">
      <ScrollView style={styles.container}>
        {/* Header - Centered with icon */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Image 
              source={require('../../../assets/images/icons/gnss-icon.png')} 
              style={styles.headerIcon}
            />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>GNSS Logger</Text>
              <Text style={styles.headerSubtitle}>Real time satellite tracking</Text>
            </View>
          </View>
        </View>

        {/* GPS Status Warning */}
        {!isGpsEnabled && (
          <View style={styles.section}>
            <View style={[styles.card, styles.warningCard]}>
              <Text style={styles.warningText}>
                GPS is disabled. Please enable GPS to start tracking.
              </Text>
            </View>
          </View>
        )}

        {/* Tracking Control*/}
        <View style={styles.section}>
          <View style={styles.controlRow}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                isTracking ? styles.stopButton : styles.startButton,
                !isGpsEnabled && styles.disabledButton,
              ]}
              onPress={isTracking ? handleStopTracking : handleStartTracking}
              disabled={!isGpsEnabled}
            >
              <Text style={styles.controlButtonText}>
                {isTracking ? 'Stop Tracking' : 'Start Tracking'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.controlButton,
                styles.secondaryButton,
                (!isTracking || satelliteSignals.length === 0) && styles.disabledButton,
              ]}
              onPress={handleStopTracking}
              disabled={!isTracking || satelliteSignals.length === 0}
            >
              <Text style={styles.controlButtonText}>Clear Data</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logging Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Image 
              source={require('../../../assets/images/icons/antenna-icon.png')} 
              style={styles.sectionIcon}
            />
            <Text style={styles.sectionTitle}>Logging Status</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.statusRow}>
              <TouchableOpacity
                style={[
                  styles.recordButton,
                  isLogging ? styles.recordingActive : styles.recordingStopped,
                  !isTracking && styles.disabledButton,
                ]}
                onPress={handleToggleLogging}
                disabled={!isTracking}
              >
                <Text style={styles.recordButtonText}>
                  {isLogging ? `Recording - ${formatTime(recordingTime)}` : 'Start Recording'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.signalQuality}>Signal Quality: {signalQuality}</Text>
            </View>
            {loggingState && loggingState.linesWritten > 0 && (
              <Text style={styles.exportInfo}>
                {loggingState.linesWritten} data points recorded
              </Text>
            )}
          </View>
        </View>

        {/* Position Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Image 
              source={require('../../../assets/images/icons/black-location-icon.png')} 
              style={styles.sectionIcon}
            />
            <Text style={styles.sectionTitle}>Position Information</Text>
          </View>
          <View style={styles.card}>
            {!isTracking ? (
              <Text style={styles.noDataText}>
                Start tracking to see position data
              </Text>
            ) : !location ? (
              <Text style={styles.noDataText}>
                Waiting for GPS fix...
              </Text>
            ) : (
              <View>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Latitude:</Text>
                  <Text style={styles.dataValue}>
                    {location.latitude.toFixed(6)}°
                  </Text>
                </View>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Longitude:</Text>
                  <Text style={styles.dataValue}>
                    {location.longitude.toFixed(6)}°
                  </Text>
                </View>
                {location.altitude && (
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Altitude:</Text>
                    <Text style={styles.dataValue}>
                      {location.altitude.toFixed(1)}m
                    </Text>
                  </View>
                )}
                {location.accuracy && (
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Accuracy:</Text>
                    <Text style={[styles.dataValue, { 
                      color: location.accuracy < 10 ? colors.success : 
                            location.accuracy < 50 ? colors.warning : colors.error 
                    }]}>
                      ±{location.accuracy.toFixed(1)}m
                    </Text>
                  </View>
                )}
                {location.speed !== undefined && location.speed > 0 && (
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Speed:</Text>
                    <Text style={styles.dataValue}>
                      {location.speed.toFixed(1)} m/s
                    </Text>
                  </View>
                )}
                {location.bearing !== undefined && (
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Bearing:</Text>
                    <Text style={styles.dataValue}>
                      {location.bearing.toFixed(0)}°
                    </Text>
                  </View>
                )}
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Provider:</Text>
                  <Text style={[styles.dataValue, { color: colors.success }]}>
                    {location.provider.toUpperCase()}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* GNSS Signal Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Image 
              source={require('../../../assets/images/icons/bar-graph-icon.png')} 
              style={styles.sectionIcon}
            />
            <Text style={styles.sectionTitle}>
              GNSS Signal Overview {satelliteSignals.length > 0 && `(${satelliteSignals.length} satellites)`}
            </Text>
          </View>
          <View style={styles.card}>
            {!isTracking ? (
              <Text style={styles.noDataText}>
                Start tracking to see signal data
              </Text>
            ) : satelliteSignals.length === 0 ? (
              <Text style={styles.noDataText}>
                Waiting for satellite measurements...
              </Text>
            ) : (
              <View>
                {/* Overview Row */}
                <View style={styles.overviewRow}>
                  <View style={styles.overviewItem}>
                    <Text style={styles.overviewLabel}>Avg Signal</Text>
                    <Text style={styles.overviewValue}>
                      {satelliteSignals.length > 0 
                        ? `${(satelliteSignals.reduce((sum, s) => sum + s.dbValue, 0) / satelliteSignals.length).toFixed(1)} dB-Hz`
                        : 'N/A'
                      }
                    </Text>
                  </View>
                  <View style={styles.overviewItem}>
                    <Text style={styles.overviewLabel}>In View</Text>
                    <Text style={styles.overviewValue}>{satelliteSignals.length}</Text>
                  </View>
                  <View style={styles.overviewItem}>
                    <Text style={styles.overviewLabel}>Used in Fix</Text>
                    <Text style={[
                      styles.overviewValue,
                      { color: status && status.satellitesUsed >= 4 ? colors.success : colors.warning }
                    ]}>
                      {status?.satellitesUsed || 'N/A'}
                    </Text>
                  </View>
                </View>

                {/* Constellation Counts */}
                {satelliteSignals.length > 0 && (
                  <View style={styles.constellationSection}>
                    <Text style={styles.dataLabel}>Constellations:</Text>
                    <View style={styles.constellationRow}>
                      {Object.entries(constellationCounts).map(([name, count]) => (
                        <View key={name} style={styles.constellationItem}>
                          <Text style={styles.constellationName}>{name}</Text>
                          <Text style={styles.constellationCount}>{count}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Satellite Signals */}
                <View style={styles.signalSection}>
                  <Text style={styles.dataLabel}>Satellite Signals (C/No):</Text>
                  {satelliteSignals.map((satellite, index) => (
                    <View
                      key={satellite.id}
                      style={[
                        styles.signalItem,
                        index === satelliteSignals.length - 1 && styles.lastItem,
                      ]}
                    >
                      <Text style={styles.satelliteId}>{satellite.displayId}</Text>
                      <Text style={styles.satelliteSystem}>{satellite.system}</Text>
                      <View style={styles.signalBarContainer}>
                        <View 
                          style={[
                            styles.signalBar,
                            { 
                              width: `${Math.min(100, (satellite.dbValue / 50) * 100)}%`,
                              backgroundColor: getSignalColor(satellite.dbValue)
                            }
                          ]} 
                        />
                      </View>
                      <Text
                        style={[styles.signalStrength, { color: getSignalColor(satellite.dbValue) }]}
                      >
                        {satellite.strength}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Data Quality Info */}
        {isTracking && location && (
          <View style={styles.section}>
            <View style={[styles.card]}>
              <Text style={styles.exportInfo}>
                All logged data is GPS-only. No network location fallback is used.
              </Text>
            </View>
          </View>
        )}

        {/* Export Data */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Image 
              source={require('../../../assets/images/icons/database-download-icon.png')} 
              style={styles.sectionIcon}
            />
            <Text style={styles.sectionTitle}>Export & File Management</Text>
          </View>
          <View style={styles.card}>
            <GnssExportManager/>
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    width: 40,
    height: 40,
    marginRight: spacing.medium,
  },
  headerTextContainer: {
    alignItems: 'center',
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  sectionIcon: {
    width: 24,
    height: 24,
    marginRight: spacing.small,
  },
  sectionTitle: {
    ...typography.heading4,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.medium,
    padding: spacing.medium,
    ...theme.shadows.small,
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
  exportButton: {
    backgroundColor: colors.primary,
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
  exportButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportButtonIcon: {
    width: 20,
    height: 20,
    marginRight: spacing.small,
    tintColor: colors.textInverse,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordButton: {
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderRadius: theme.borderRadius.medium,
    minWidth: 140,
    alignItems: 'center',
  },
  recordingActive: {
    backgroundColor: colors.error,
  },
  recordingStopped: {
    backgroundColor: colors.success,
  },
  recordButtonText: {
    ...typography.body,
    color: colors.textInverse,
    fontWeight: '600',
  },
  signalQuality: {
    ...typography.body,
    color: colors.textSecondary,
  },
  // Data display styles
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dataLabel: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  dataValue: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  noDataText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: spacing.medium,
  },
  // Overview styles
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.medium,
  },
  overviewItem: {
    alignItems: 'center',
    flex: 1,
  },
  overviewLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xsmall,
  },
  overviewValue: {
    ...typography.heading5,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  // Constellation styles
  constellationSection: {
    marginBottom: spacing.medium,
  },
  constellationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.small,
    minHeight: 60, // Fixed minimum height to prevent layout jumps
  },
  constellationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.small,
    paddingVertical: spacing.xsmall,
    borderRadius: theme.borderRadius.small,
    marginRight: spacing.small,
    marginBottom: spacing.small,
  },
  constellationName: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
    marginRight: spacing.xsmall,
  },
  constellationCount: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  // Signal display styles
  signalSection: {
    marginTop: spacing.medium,
  },
  signalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  satelliteId: {
    ...typography.body,
    fontWeight: '600',
    width: 50,
    color: colors.textPrimary,
  },
  satelliteSystem: {
    ...typography.body,
    color: colors.textSecondary,
    width: 70,
  },
  signalBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginHorizontal: spacing.small,
    overflow: 'hidden',
  },
  signalBar: {
    height: '100%',
    borderRadius: 4,
  },
  signalStrength: {
    ...typography.body,
    fontWeight: '600',
    width: 80,
    textAlign: 'right',
  },
  // Warning styles
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
  exportInfo: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});