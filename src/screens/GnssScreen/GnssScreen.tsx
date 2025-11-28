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
import { colors, typography, spacing, theme } from '../../styles';
import {
  GnssModule,
  GnssExportModule,
  GnssLocation,
  GnssStatus,
  GnssMeasurement,
  LoggingState,
  LogFileInfo,
} from '../../native/GnssModule';

// Types for satellite display using REAL measurement data
interface SatelliteSignal {
  id: string;
  displayId: string;
  system: string;
  strength: string;
  dbValue: number;
}

interface SatelliteDetail {
  id: string;
  displayId: string;
  elevation: string;
  azimuth: string;
  cno: string;
  dbValue: number;
  constellation: string;
  carrierFrequency?: string;
}

export const GnssScreen: React.FC = () => {
  // Backend state with REAL data
  const [isTracking, setIsTracking] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [isGpsEnabled, setIsGpsEnabled] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [location, setLocation] = useState<GnssLocation | null>(null);
  const [status, setStatus] = useState<GnssStatus | null>(null);
  const [measurements, setMeasurements] = useState<GnssMeasurement[]>([]);
  const [loggingState, setLoggingState] = useState<LoggingState | null>(null);
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [logFiles, setLogFiles] = useState<LogFileInfo[]>([]);
  const [hasLogFiles, setHasLogFiles] = useState(false);

  // Frontend display state
  const [recordingTime, setRecordingTime] = useState(0);
  const [signalQuality, setSignalQuality] = useState('Unknown');
  const [satelliteSignals, setSatelliteSignals] = useState<SatelliteSignal[]>([]);
  const [satelliteDetails, setSatelliteDetails] = useState<SatelliteDetail[]>([]);
  const [showAdvancedDetails, setShowAdvancedDetails] = useState(false);

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

  // Listen to GNSS events - REAL data from backend
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

    // Add measurement listener if available
    const measurementListener = DeviceEventEmitter.addListener(
      'gnssMeasurement', // Check if this event exists in your native module
      (data: GnssMeasurement[]) => {
        setMeasurements(data);
        updateSatelliteDisplays(data);
      },
    );

    const gpsStateListener = DeviceEventEmitter.addListener(
      'gpsStateChanged',
      (data: { enabled: boolean }) => {
        setIsGpsEnabled(data.enabled);
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
      measurementListener.remove();
      gpsStateListener.remove();
    };
  }, [isTracking]);

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
    const enabled = await GnssModule.isGpsEnabled();
    setIsGpsEnabled(enabled);

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

    if (!isGpsEnabled) {
      Alert.alert(
        'GPS Required',
        'GPS is disabled. Please enable GPS in your device settings to collect GNSS data.',
        [{ text: 'OK' }],
      );
      return;
    }

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
    setMeasurements([]);
    setSatelliteSignals([]);
    setSatelliteDetails([]);
    setSignalQuality('Unknown');
  };

  const handleToggleLogging = async () => {
    if (isLogging) {
      await GnssModule.setRawLogging(false, null);
      setIsLogging(false);
      const state = await GnssModule.getLoggingState();
      setLoggingState(state);
      await checkForLogFiles();
    } else {
      if (!isTracking) {
        Alert.alert(
          'Start Tracking First',
          'Please start GNSS tracking before logging',
        );
        return;
      }

      try {
        const result = await GnssModule.setRawLogging(true, null);
        setIsLogging(true);
        setRecordingTime(0);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        Alert.alert('Error', `Failed to start logging: ${errorMessage}`);
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
    }
  };

  const handleExportFile = async (filePath: string, fileName: string) => {
    try {
      setShowFileSelector(false);
      const exportedPath = await GnssExportModule.exportCSV(filePath, fileName);
      Alert.alert(
        'Export Successful',
        `${fileName} exported to Downloads/Aisight folder`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('Export Failed', `Could not export data: ${errorMessage}`);
    }
  };

  const handleDeleteFile = async (filePath: string, fileName: string) => {
    Alert.alert(
      'Delete Log File',
      `Are you sure you want to delete ${fileName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await GnssModule.deleteLogFile(filePath);
              Alert.alert('Deleted', `${fileName} has been deleted`);
              const files = await GnssModule.listLogFiles();
              setLogFiles(files);
              setHasLogFiles(files.length > 0);
              if (files.length === 0) {
                setShowFileSelector(false);
              }
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              Alert.alert('Delete Failed', `Could not delete file: ${errorMessage}`);
            }
          },
        },
      ],
    );
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

  // Convert REAL GnssMeasurement data to display format
  const updateSatelliteDisplays = (gnssMeasurements: GnssMeasurement[]) => {
    const signals: SatelliteSignal[] = [];
    const details: SatelliteDetail[] = [];

    // Filter and sort measurements by signal strength
    const validMeasurements = gnssMeasurements
      .filter(m => m.cn0DbHz !== undefined && m.cn0DbHz > 0)
      .sort((a, b) => (b.cn0DbHz || 0) - (a.cn0DbHz || 0));

    validMeasurements.forEach((measurement, index) => {
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

      // Create detail entry (show top 8 strongest signals)
      if (index < 8) {
        const carrierFreq = measurement.carrierFrequencyHz 
          ? `${(measurement.carrierFrequencyHz / 1e6).toFixed(1)} MHz`
          : 'N/A';

        details.push({
          id: uniqueId,
          displayId,
          elevation: 'N/A', // Not available in GnssMeasurement type
          azimuth: 'N/A',   // Not available in GnssMeasurement type  
          cno: dbValue.toFixed(1),
          dbValue,
          constellation,
          carrierFrequency: carrierFreq,
        });
      }
    });

    setSatelliteSignals(signals);
    setSatelliteDetails(details);
    setSignalQuality(getSignalQuality(signals));
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

  return (
    <SafeAreaWrapper backgroundColor={colors.background} barStyle="dark-content">
      <ScrollView style={styles.container}>
        {/* Header - Frontend styling */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>GNSS Logger</Text>
          <Text style={styles.headerSubtitle}>Real time satellite tracking</Text>
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

        {/* Permission Warning */}
        {!hasPermission && (
          <View style={styles.section}>
            <View style={[styles.card, styles.warningCard]}>
              <Text style={styles.warningText}>
                Location permission is required. Tap Start Tracking to grant permission.
              </Text>
            </View>
          </View>
        )}

        {/* Tracking Control - Frontend styling */}
        <View style={styles.section}>
          <View style={styles.controlRow}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                isTracking ? styles.stopButton : styles.startButton,
                (!isGpsEnabled || !hasPermission) && styles.disabledButton,
              ]}
              onPress={isTracking ? handleStopTracking : handleStartTracking}
              disabled={!isGpsEnabled || !hasPermission}
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
          <Text style={styles.sectionTitle}>Logging Status</Text>
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

        {/* 1️⃣ Position Info - REAL data from backend */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Position Information</Text>
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

        {/* 2️⃣ GNSS Signal Overview - REAL measurement data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            GNSS Signal Overview {satelliteSignals.length > 0 && `(${satelliteSignals.length} satellites)`}
          </Text>
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
                {/* Overview Row with REAL measurement data */}
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

                {/* Constellation Counts - Derived from REAL measurements */}
                {satelliteSignals.length > 0 && (
                  <View style={styles.constellationSection}>
                    <Text style={styles.dataLabel}>Constellations:</Text>
                    <View style={styles.constellationRow}>
                      {Object.entries(
                        satelliteSignals.reduce((acc, signal) => {
                          acc[signal.system] = (acc[signal.system] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([name, count]) => (
                        <View key={name} style={styles.constellationItem}>
                          <Text style={styles.constellationName}>{name}</Text>
                          <Text style={styles.constellationCount}>{count}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Satellite Signals - REAL measurement data */}
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

                {/* Advanced Details Toggle */}
                {satelliteDetails.length > 0 && (
                  <TouchableOpacity
                    style={styles.expandButton}
                    onPress={() => setShowAdvancedDetails(!showAdvancedDetails)}
                  >
                    <Text style={styles.expandButtonText}>
                      {showAdvancedDetails ? '▲ Hide' : '▼ Show'} Advanced Details
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

        {/* 3️⃣ Advanced Satellite Details - REAL measurement data */}
        {showAdvancedDetails && satelliteDetails.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Satellite Details ({satelliteDetails.length} strongest shown)
            </Text>
            <View style={styles.card}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderText}>ID</Text>
                <Text style={styles.tableHeaderText}>Constellation</Text>
                <Text style={styles.tableHeaderText}>C/No</Text>
                <Text style={styles.tableHeaderText}>Carrier Freq</Text>
              </View>
              {satelliteDetails.map((satellite, index) => (
                <View
                  key={satellite.id}
                  style={[
                    styles.tableRow,
                    index === satelliteDetails.length - 1 && styles.lastItem,
                  ]}
                >
                  <Text style={styles.tableCell}>{satellite.displayId}</Text>
                  <Text style={styles.tableCell}>{satellite.constellation}</Text>
                  <Text style={[styles.tableCell, { color: getSignalColor(satellite.dbValue) }]}>
                    {satellite.cno}
                  </Text>
                  <Text style={styles.tableCell}>{satellite.carrierFrequency || 'N/A'}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Data Quality Info */}
        {isTracking && location && (
          <View style={styles.section}>
            <View style={[styles.card]}>
              <Text>
                All logged data is GPS-only. No network location fallback is used.
              </Text>
            </View>
          </View>
        )}

        {/* Export Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export & File Management</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                styles.secondaryButton,
                !hasLogFiles && styles.disabledButton,
              ]}
              onPress={handleShowExportDialog}
              disabled={!hasLogFiles}
            >
              <Text style={styles.controlButtonText}>
                Export to Downloads
              </Text>
            </TouchableOpacity>
            <Text style={[styles.exportInfo, { marginTop: spacing.small }]}>
              View, export, and delete all saved log files
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* File Selector Modal - REAL backend functionality */}
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
                      <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
                        {formatFileSize(item.size)}
                      </Text>
                      <Text style={[typography.bodySmall, { color: colors.textSecondary, marginLeft: spacing.small }]}>
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
  startButton: {
    backgroundColor: colors.success,
  },
  stopButton: {
    backgroundColor: colors.error,
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
  // Expand button
  expandButton: {
    padding: spacing.small,
    alignItems: 'center',
    marginTop: spacing.small,
  },
  expandButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  // Table styles
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
  // Modal styles (from first version)
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