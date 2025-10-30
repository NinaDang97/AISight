import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  DeviceEventEmitter,
  PermissionsAndroid,
  Modal,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaWrapper } from '../../components/common/SafeAreaWrapper';
import { Button } from '../../components/common/Button';
import { colors, typography, spacing } from '../../styles';
import {
  GnssModule,
  GnssExportModule,
  GnssLocation,
  GnssStatus,
  LoggingState,
  LogFileInfo,
} from '../../native/GnssModule';

export const GnssScreen: React.FC = () => {
  // State
  const [isTracking, setIsTracking] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [location, setLocation] = useState<GnssLocation | null>(null);
  const [status, setStatus] = useState<GnssStatus | null>(null);
  const [loggingState, setLoggingState] = useState<LoggingState | null>(null);
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [logFiles, setLogFiles] = useState<LogFileInfo[]>([]);
  const [hasLogFiles, setHasLogFiles] = useState(false);

  // Check GPS and permission status on mount
  useEffect(() => {
    checkGpsAndPermissions();
    checkLoggingState();
    checkForLogFiles();
  }, []);

  const checkForLogFiles = async () => {
    try {
      const files = await GnssModule.listLogFiles();
      setHasLogFiles(files.length > 0);
    } catch (error) {
      console.error('Error checking log files:', error);
    }
  };

  // Listen to GNSS events
  useEffect(() => {
    const locationListener = DeviceEventEmitter.addListener(
      'gnssLocation',
      (data: GnssLocation) => {
        setLocation(data);
      },
    );

    const statusListener = DeviceEventEmitter.addListener(
      'gnssStatus',
      (data: GnssStatus) => {
        setStatus(data);
      },
    );

    const gpsStateListener = DeviceEventEmitter.addListener(
      'gpsStateChanged',
      (data: { enabled: boolean }) => {
        setGpsEnabled(data.enabled);
        if (!data.enabled && isTracking) {
          Alert.alert(
            'GPS Disabled',
            'GPS has been disabled. GNSS tracking is paused.',
          );
        }
      },
    );

    return () => {
      locationListener.remove();
      statusListener.remove();
      gpsStateListener.remove();
    };
  }, [isTracking]);

  // Update logging state periodically when logging
  useEffect(() => {
    if (isLogging) {
      const interval = setInterval(async () => {
        const state = await GnssModule.getLoggingState();
        setLoggingState(state);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isLogging]);

  const checkGpsAndPermissions = async () => {
    // Check GPS
    const enabled = await GnssModule.isGpsEnabled();
    setGpsEnabled(enabled);

    // Check permission
    const permission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    setHasPermission(permission);
  };

  const checkLoggingState = async () => {
    const state = await GnssModule.getLoggingState();
    setLoggingState(state);
    setIsLogging(state.isLogging);
  };

  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'AISight needs GPS access for GNSS data collection',
          buttonPositive: 'OK',
          buttonNegative: 'Cancel',
        },
      );
      const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
      setHasPermission(isGranted);
      return isGranted;
    } catch (err) {
      return false;
    }
  };

  const handleStartTracking = async () => {
    // Check permission
    if (!hasPermission) {
      const granted = await requestLocationPermission();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Location permission is required for GNSS tracking',
        );
        return;
      }
    }

    // Check GPS
    if (!gpsEnabled) {
      Alert.alert(
        'GPS Required',
        'GPS is disabled. Please enable GPS in your device settings to collect GNSS data.',
        [{ text: 'OK' }],
      );
      return;
    }

    // Start tracking
    try {
      await GnssModule.start();
      setIsTracking(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to start GNSS tracking');
    }
  };

  const handleStopTracking = async () => {
    await GnssModule.stop();
    setIsTracking(false);
    setLocation(null);
    setStatus(null);
  };

  const handleToggleLogging = async () => {
    if (isLogging) {
      await GnssModule.setRawLogging(false, null);
      setIsLogging(false);
      // Don't clear loggingState, just update it
      const state = await GnssModule.getLoggingState();
      setLoggingState(state);
      // Check if files exist for export button
      await checkForLogFiles();
    } else {
      if (!isTracking) {
        Alert.alert(
          'Start Tracking First',
          'Please start GNSS tracking before logging',
        );
        return;
      }

      // Check if module is available
      if (!GnssModule || !GnssModule.setRawLogging) {
        Alert.alert('Error', 'GNSS Module not available. Did you rebuild the app?');
        return;
      }

      try {
        console.log('Attempting to start logging...');
        const result = await GnssModule.setRawLogging(true, null);
        console.log('Logging started, file path:', result);
        setIsLogging(true);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        Alert.alert('Error', `Failed to start logging: ${errorMessage}`);
        console.error('Logging error:', error);
      }
    }
  };

  const handleShowExportDialog = async () => {
    try {
      const files = await GnssModule.listLogFiles();

      if (files.length === 0) {
        Alert.alert('No Data', 'No log files found. Start logging to create data.');
        return;
      }

      setLogFiles(files);
      setShowFileSelector(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('Error', `Could not list log files: ${errorMessage}`);
      console.error('List files error:', error);
    }
  };

  const handleExportFile = async (filePath: string, fileName: string) => {
    try {
      setShowFileSelector(false);

      // Export to Downloads folder
      // Pass the original filename to preserve it
      const exportedPath = await GnssExportModule.exportCSV(filePath, fileName);

      Alert.alert(
        'Export Successful',
        `${fileName} exported to Downloads/Aisight folder`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('Export Failed', `Could not export data: ${errorMessage}`);
      console.error('Export error:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const handleDeleteFile = async (filePath: string, fileName: string) => {
    Alert.alert(
      'Delete Log File',
      `Are you sure you want to delete ${fileName}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await GnssModule.deleteLogFile(filePath);
              Alert.alert('Deleted', `${fileName} has been deleted`);

              // Refresh the file list
              const files = await GnssModule.listLogFiles();
              setLogFiles(files);
              setHasLogFiles(files.length > 0);

              // Close modal if no files left
              if (files.length === 0) {
                setShowFileSelector(false);
              }
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              Alert.alert('Delete Failed', `Could not delete file: ${errorMessage}`);
              console.error('Delete error:', error);
            }
          },
        },
      ],
    );
  };

  const canStartTracking = hasPermission && gpsEnabled;
  const canExport = hasLogFiles;

  return (
    <SafeAreaWrapper backgroundColor={colors.background} barStyle="dark-content">
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={typography.heading2}>GNSS Data Collection</Text>
          <Text style={[typography.bodyLarge, { color: colors.textSecondary }]}>
            Real-time GPS tracking and logging
          </Text>
        </View>

        {/* GPS Status Card */}
        <View style={styles.statusCard}>
          <Text style={typography.heading3}>GPS Status</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: gpsEnabled ? colors.success : colors.error },
              ]}
            />
            <Text
              style={[
                typography.bodyLarge,
                { color: gpsEnabled ? colors.success : colors.error },
              ]}>
              {gpsEnabled ? 'GPS Enabled' : 'GPS Disabled'}
            </Text>
          </View>

          {!gpsEnabled ? (
            <View style={styles.warningBox}>
              <Text style={[typography.bodySmall, { color: colors.error }]}>
                GPS is required for GNSS data collection. Please enable GPS in
                your device settings.
              </Text>
            </View>
          ) : null}

          {!hasPermission ? (
            <View style={[styles.warningBox, { marginTop: spacing.small }]}>
              <Text style={[typography.bodySmall, { color: colors.warning }]}>
                Location permission is required. Tap Start Tracking to grant
                permission.
              </Text>
            </View>
          ) : null}
        </View>

        {/* Control Buttons */}
        <View style={styles.controlSection}>
          <Button
            title={isTracking ? 'Stop Tracking' : 'Start Tracking'}
            variant={isTracking ? 'secondary' : 'primary'}
            onPress={isTracking ? handleStopTracking : handleStartTracking}
            disabled={!canStartTracking && !isTracking}
            fullWidth
          />
          <Button
            title={isLogging ? 'Stop Logging' : 'Start Logging'}
            variant={isLogging ? 'outline' : 'primary'}
            onPress={handleToggleLogging}
            disabled={!isTracking}
            fullWidth
            style={styles.buttonSpacing}
          />
          <Button
            title="Export to Downloads"
            variant="outline"
            onPress={handleShowExportDialog}
            disabled={!canExport}
            fullWidth
            style={styles.buttonSpacing}
          />
        </View>

        {/* Tracking Status Indicator */}
        {isTracking ? (
          <View style={styles.trackingBanner}>
            <View style={styles.trackingIndicator} />
            <Text style={[typography.body, { color: colors.success }]}>
              Tracking Active
            </Text>
          </View>
        ) : null}

        {/* Logging Status */}
        {isLogging && loggingState ? (
          <View style={styles.loggingCard}>
            <Text style={typography.heading3}>Logging Status</Text>
            <View style={styles.dataRow}>
              <Text style={typography.body}>Status:</Text>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusIndicator,
                    { backgroundColor: colors.info },
                  ]}
                />
                <Text style={[typography.bodyLarge, { color: colors.info }]}>
                  Recording
                </Text>
              </View>
            </View>
            <View style={styles.dataRow}>
              <Text style={typography.body}>Records:</Text>
              <Text style={typography.bodyLarge}>
                {loggingState.linesWritten}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Location Data */}
        <View style={styles.dataCard}>
          <Text style={typography.heading3}>Location Data</Text>
          {!isTracking ? (
            <View style={styles.noDataContainer}>
              <Text style={[typography.body, { color: colors.textSecondary }]}>
                Start tracking to see location data
              </Text>
            </View>
          ) : !gpsEnabled ? (
            <View style={styles.noDataContainer}>
              <Text style={[typography.body, { color: colors.error }]}>
                No GPS signal - Enable GPS to receive measurements
              </Text>
            </View>
          ) : !location ? (
            <View style={styles.noDataContainer}>
              <Text style={[typography.body, { color: colors.warning }]}>
                Waiting for GPS fix...
              </Text>
            </View>
          ) : (
            <View>
              <View style={styles.dataRow}>
                <Text style={typography.body}>Latitude:</Text>
                <Text style={typography.bodyLarge}>
                  {location.latitude.toFixed(6)}°
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={typography.body}>Longitude:</Text>
                <Text style={typography.bodyLarge}>
                  {location.longitude.toFixed(6)}°
                </Text>
              </View>
              {location.altitude ? (
                <View style={styles.dataRow}>
                  <Text style={typography.body}>Altitude:</Text>
                  <Text style={typography.bodyLarge}>
                    {location.altitude.toFixed(1)}m
                  </Text>
                </View>
              ) : null}
              {location.accuracy ? (
                <View style={styles.dataRow}>
                  <Text style={typography.body}>Accuracy:</Text>
                  <Text
                    style={[
                      typography.bodyLarge,
                      {
                        color:
                          location.accuracy < 10
                            ? colors.success
                            : location.accuracy < 50
                              ? colors.warning
                              : colors.error,
                      },
                    ]}>
                    ±{location.accuracy.toFixed(1)}m
                  </Text>
                </View>
              ) : null}
              {location.speed !== undefined && location.speed > 0 ? (
                <View style={styles.dataRow}>
                  <Text style={typography.body}>Speed:</Text>
                  <Text style={typography.bodyLarge}>
                    {location.speed.toFixed(1)} m/s
                  </Text>
                </View>
              ) : null}
              {location.bearing !== undefined ? (
                <View style={styles.dataRow}>
                  <Text style={typography.body}>Bearing:</Text>
                  <Text style={typography.bodyLarge}>
                    {location.bearing.toFixed(0)}°
                  </Text>
                </View>
              ) : null}
              <View style={styles.dataRow}>
                <Text style={typography.body}>Provider:</Text>
                <Text
                  style={[
                    typography.bodyLarge,
                    { color: colors.success, fontWeight: 'bold' },
                  ]}>
                  {location.provider.toUpperCase()}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Satellite Status */}
        <View style={styles.dataCard}>
          <Text style={typography.heading3}>Satellite Status</Text>
          {!isTracking || !status ? (
            <View style={styles.noDataContainer}>
              <Text style={[typography.body, { color: colors.textSecondary }]}>
                No satellite data
              </Text>
            </View>
          ) : (
            <View>
              <View style={styles.dataRow}>
                <Text style={typography.body}>In View:</Text>
                <Text style={typography.bodyLarge}>
                  {status.satellitesInView}
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={typography.body}>Used in Fix:</Text>
                <Text
                  style={[
                    typography.bodyLarge,
                    {
                      color:
                        status.satellitesUsed >= 4
                          ? colors.success
                          : colors.warning,
                    },
                  ]}>
                  {status.satellitesUsed}
                </Text>
              </View>
              {status.avgCn0DbHz ? (
                <View style={styles.dataRow}>
                  <Text style={typography.body}>Avg Signal:</Text>
                  <Text style={typography.bodyLarge}>
                    {status.avgCn0DbHz.toFixed(1)} dB-Hz
                  </Text>
                </View>
              ) : null}
              {status.constellations ? (
                <View style={styles.constellationSection}>
                  <Text style={[typography.body, { marginTop: spacing.small }]}>
                    Constellations:
                  </Text>
                  {Object.entries(status.constellations).map(([name, count]) => (
                    <View key={name} style={styles.constellationRow}>
                      <Text style={typography.bodySmall}>{name}:</Text>
                      <Text style={typography.bodySmall}>{count}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          )}
        </View>

        {/* Data Quality Info */}
        {isTracking && location ? (
          <View style={styles.infoCard}>
            <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
              All logged data is GPS-only. No network location fallback is used.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* File Selector Modal */}
      <Modal
        visible={showFileSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFileSelector(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={typography.heading2}>Select Log File</Text>
              <TouchableOpacity onPress={() => setShowFileSelector(false)}>
                <Text style={[typography.bodyLarge, { color: colors.primary }]}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={logFiles}
              keyExtractor={item => item.path}
              renderItem={({ item }) => (
                <View style={styles.fileItem}>
                  <View style={styles.fileInfo}>
                    <Text style={typography.body}>{item.name}</Text>
                    <View style={styles.fileMetadata}>
                      <Text
                        style={[typography.bodySmall, { color: colors.textSecondary }]}>
                        {formatFileSize(item.size)}
                      </Text>
                      <Text
                        style={[
                          typography.bodySmall,
                          { color: colors.textSecondary, marginLeft: spacing.small },
                        ]}>
                        {formatDate(item.lastModified)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.fileActions}>
                    <TouchableOpacity
                      onPress={() => handleExportFile(item.path, item.name)}
                      style={styles.actionButton}>
                      <Text style={[typography.bodyLarge, { color: colors.primary }]}>
                        Export
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteFile(item.path, item.name)}
                      style={[styles.actionButton, { marginLeft: spacing.medium }]}>
                      <Text style={[typography.bodyLarge, { color: colors.error }]}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Text style={[typography.body, { color: colors.textSecondary }]}>
                    No log files found
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
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
  statusCard: {
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
