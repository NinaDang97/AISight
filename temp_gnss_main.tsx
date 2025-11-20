import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaWrapper } from '../../components/common/SafeAreaWrapper';
import { colors, typography, spacing, theme } from '../../styles';

// Types for our data
interface SatelliteSignal {
  id: string;
  system: string;
  strength: string;
  dbValue: number;
}

interface SatelliteDetail {
  id: string;
  elevation: string;
  azimuth: string;
  cno: string;
  dbValue: number;
}

export const GnssScreen: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [signalQuality, setSignalQuality] = useState('Excellent');
  const [satelliteSignals, setSatelliteSignals] = useState<SatelliteSignal[]>([]);
  const [satelliteDetails, setSatelliteDetails] = useState<SatelliteDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Timer for recording
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Format recording time
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

  const getSignalQuality = (signals: SatelliteSignal[]) => {
    if (signals.length === 0) return 'Unknown';
    const avgStrength = signals.reduce((sum, signal) => sum + signal.dbValue, 0) / signals.length;
    if (avgStrength >= 40) return 'Excellent';
    if (avgStrength >= 35) return 'Good';
    if (avgStrength >= 30) return 'Fair';
    return 'Poor';
  };

  // Generate unique satellite IDs to fix duplicate key warnings
  const generateUniqueSatelliteId = (system: string, existingIds: Set<string>) => {
    let attempts = 0;
    while (attempts < 50) {
      // Prevent infinite loop
      const idNumber = Math.floor(Math.random() * 32);
      const id = `${system.charAt(0)}${idNumber.toString().padStart(2, '0')}`;

      if (!existingIds.has(id)) {
        return id;
      }
      attempts++;
    }
    // Fallback: add timestamp to ensure uniqueness
    return `${system.charAt(0)}${Math.floor(Math.random() * 32)
      .toString()
      .padStart(2, '0')}_${Date.now()}`;
  };

  // Generate realistic mock data
  const generateMockData = () => {
    setIsLoading(true);

    // Simulate API delay
    setTimeout(() => {
      const systems = ['GPS', 'GLONASS', 'Galileo', 'BeiDou'];
      const newSignals: SatelliteSignal[] = [];
      const newDetails: SatelliteDetail[] = [];
      const usedIds = new Set<string>();

      // Generate 8-12 random satellites
      const satelliteCount = Math.floor(Math.random() * 5) + 8;

      for (let i = 0; i < satelliteCount; i++) {
        const system = systems[Math.floor(Math.random() * systems.length)];
        const dbValue = Math.floor(Math.random() * 20) + 25; // 25-45 dB
        const id = generateUniqueSatelliteId(system, usedIds);
        usedIds.add(id);

        newSignals.push({
          id,
          system,
          strength: `${dbValue} dB-Hz`,
          dbValue,
        });

        // Only add to details if we have room (max 6 for display)
        if (newDetails.length < 6) {
          newDetails.push({
            id,
            elevation: `${Math.floor(Math.random() * 90)}°`,
            azimuth: `${Math.floor(Math.random() * 360)}°`,
            cno: dbValue.toString(),
            dbValue,
          });
        }
      }

      // Sort by signal strength (strongest first)
      newSignals.sort((a, b) => b.dbValue - a.dbValue);
      newDetails.sort((a, b) => b.dbValue - a.dbValue);

      setSatelliteSignals(newSignals);
      setSatelliteDetails(newDetails);
      setSignalQuality(getSignalQuality(newSignals));
      setIsLoading(false);
    }, 1000);
  };

  // Toggle recording
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      Alert.alert('Recording Stopped', `Recorded for ${formatTime(recordingTime)}`);
    } else {
      setIsRecording(true);
      setRecordingTime(0);
      // Generate new data when starting recording
      if (satelliteSignals.length === 0) {
        generateMockData();
      }
    }
  };

  // Export data functions
  const exportCSV = () => {
    if (satelliteSignals.length === 0) {
      Alert.alert('No Data', 'Please generate data first');
      return;
    }

    // Simple CSV export simulation
    const headers = 'Satellite ID,System,Signal Strength (dB-Hz),Elevation,Azimuth\n';
    const rows = satelliteSignals
      .map(signal => {
        const detail = satelliteDetails.find(d => d.id === signal.id);
        return `"${signal.id}","${signal.system}","${signal.strength}","${
          detail?.elevation || 'N/A'
        }","${detail?.azimuth || 'N/A'}"`;
      })
      .join('\n');

    const csv = headers + rows;
    Alert.alert(
      'CSV Export Ready',
      `Exported ${satelliteSignals.length} satellites to CSV format.`,
      [{ text: 'OK' }],
    );
  };

  const exportRINEX = () => {
    if (satelliteSignals.length === 0) {
      Alert.alert('No Data', 'Please generate data first');
      return;
    }

    // Simple RINEX export simulation
    Alert.alert(
      'RINEX Export Ready',
      `Exported ${satelliteSignals.length} satellites in RINEX format.`,
      [{ text: 'OK' }],
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
          <Text style={styles.headerTitle}>GNSS Logger</Text>
          <Text style={styles.headerSubtitle}>Real time satellite tracking</Text>
        </View>

        {/* Control Buttons */}
        <View style={styles.section}>
          <View style={styles.controlRow}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                styles.primaryButton,
                isLoading && styles.disabledButton,
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
                (satelliteSignals.length === 0 || isLoading) && styles.disabledButton,
              ]}
              onPress={() => {
                setSatelliteSignals([]);
                setSatelliteDetails([]);
                setIsRecording(false);
                setRecordingTime(0);
                setSignalQuality('Unknown');
              }}
              disabled={satelliteSignals.length === 0 || isLoading}
            >
              <Text style={styles.controlButtonText}>Clear Data</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logging Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Logging Status</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recording</Text>
            <View style={styles.statusRow}>
              <TouchableOpacity
                style={[
                  styles.recordButton,
                  isRecording ? styles.recordingActive : styles.recordingStopped,
                ]}
                onPress={toggleRecording}
              >
                <Text style={styles.recordButtonText}>
                  {isRecording ? `Recording - ${formatTime(recordingTime)}` : 'Start Recording'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.signalQuality}>Signal Quality: {signalQuality}</Text>
            </View>
          </View>
        </View>

        {/* Signal Strength */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Signal Strength (C/No){' '}
            {satelliteSignals.length > 0 && `(${satelliteSignals.length} satellites)`}
          </Text>
          <View style={styles.card}>
            {satelliteSignals.length === 0 ? (
              <Text style={styles.noDataText}>
                {isLoading
                  ? 'Loading satellite data...'
                  : 'No satellite data. Press "Refresh Data" to load.'}
              </Text>
            ) : (
              satelliteSignals.map((satellite, index) => (
                <View
                  key={satellite.id}
                  style={[
                    styles.signalItem,
                    index === satelliteSignals.length - 1 && styles.lastItem,
                  ]}
                >
                  <Text style={styles.satelliteId}>{satellite.id}</Text>
                  <Text style={styles.satelliteSystem}>{satellite.system}</Text>
                  <Text
                    style={[styles.signalStrength, { color: getSignalColor(satellite.dbValue) }]}
                  >
                    {satellite.strength}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Satellite Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Satellite Details {satelliteDetails.length > 0 && `(${satelliteDetails.length} shown)`}
          </Text>
          <View style={styles.card}>
            {satelliteDetails.length === 0 ? (
              <Text style={styles.noDataText}>No satellite details available</Text>
            ) : (
              <>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={styles.tableHeaderText}>ID</Text>
                  <Text style={styles.tableHeaderText}>Elev</Text>
                  <Text style={styles.tableHeaderText}>Azim</Text>
                  <Text style={styles.tableHeaderText}>C/No</Text>
                </View>
                {/* Table Rows */}
                {satelliteDetails.map((satellite, index) => (
                  <View
                    key={satellite.id}
                    style={[
                      styles.tableRow,
                      index === satelliteDetails.length - 1 && styles.lastItem,
                    ]}
                  >
                    <Text style={styles.tableCell}>{satellite.id}</Text>
                    <Text style={styles.tableCell}>{satellite.elevation}</Text>
                    <Text style={styles.tableCell}>{satellite.azimuth}</Text>
                    <Text style={[styles.tableCell, { color: getSignalColor(satellite.dbValue) }]}>
                      {satellite.cno}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </View>
        </View>

        {/* Export Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Data</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={[styles.exportButton, satelliteSignals.length === 0 && styles.disabledButton]}
              onPress={exportCSV}
              disabled={satelliteSignals.length === 0}
            >
              <Text style={styles.exportButtonText}>
                Export as CSV {satelliteSignals.length > 0 && `(${satelliteSignals.length} sats)`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.exportButton,
                styles.exportButtonSecondary,
                satelliteSignals.length === 0 && styles.disabledButton,
              ]}
              onPress={exportRINEX}
              disabled={satelliteSignals.length === 0}
            >
              <Text style={styles.exportButtonText}>
                Export as RINEX {satelliteSignals.length > 0 && `(${satelliteSignals.length} sats)`}
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.medium,
    padding: spacing.medium,
    ...theme.shadows.small,
  },
  cardTitle: {
    ...typography.heading5,
    color: colors.textPrimary,
    marginBottom: spacing.medium,
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
  statusText: {
    ...typography.bodySmall,
    color: colors.textInverse,
    fontWeight: '500',
  },
  signalQuality: {
    ...typography.body,
    color: colors.textSecondary,
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
    width: 60,
    color: colors.textPrimary,
  },
  satelliteSystem: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
    marginLeft: spacing.small,
  },
  signalStrength: {
    ...typography.body,
    fontWeight: '600',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primaryDark,
    padding: spacing.small,
    borderTopLeftRadius: theme.borderRadius.small,
    borderTopRightRadius: theme.borderRadius.small,
    marginHorizontal: -spacing.small,
    marginTop: -spacing.small,
    marginBottom: spacing.small,
  },
  tableHeaderText: {
    ...typography.bodySmall,
    color: colors.textInverse,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableCell: {
    ...typography.body,
    flex: 1,
    textAlign: 'center',
    color: colors.textPrimary,
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
  },
  noDataText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: spacing.medium,
    marginBottom: spacing.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.small,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.small,
  },
  warningBox: {
    marginTop: spacing.medium,
    padding: spacing.small,
    backgroundColor: colors.error + '20',
    borderRadius: 8,
  },
  controlSection: {
    marginBottom: spacing.medium,
  },
  buttonSpacing: {
    marginTop: spacing.small,
  },
  trackingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '20',
    padding: spacing.small,
    borderRadius: 8,
    marginBottom: spacing.medium,
  },
  trackingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: spacing.small,
  },
  loggingCard: {
    backgroundColor: colors.info + '20',
    borderRadius: 12,
    padding: spacing.medium,
    marginBottom: spacing.medium,
  },
  dataCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.medium,
    marginBottom: spacing.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.small,
  },
  noDataContainer: {
    paddingVertical: spacing.large,
    alignItems: 'center',
  },
  constellationSection: {
    marginTop: spacing.small,
  },
  constellationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: spacing.medium,
    marginTop: spacing.xsmall,
  },
  infoCard: {
    backgroundColor: colors.primary + '10',
    borderRadius: 8,
    padding: spacing.small,
    marginBottom: spacing.large,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: spacing.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  fileInfo: {
    flex: 1,
  },
  fileMetadata: {
    flexDirection: 'row',
    marginTop: spacing.xsmall,
  },
  fileActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: spacing.xsmall,
  },
  emptyList: {
    padding: spacing.large,
    alignItems: 'center',
  },
});
