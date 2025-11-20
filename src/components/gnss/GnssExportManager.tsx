import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { colors, typography, spacing } from '../../styles';
import { GnssModule, GnssExportModule, LogFileInfo } from '../../native/GnssModule';

interface GnssExportManagerProps {
  disabled?: boolean;
}

export const GnssExportManager: React.FC<GnssExportManagerProps> = ({ disabled = false }) => {
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [logFiles, setLogFiles] = useState<LogFileInfo[]>([]);
  const [hasLogFiles, setHasLogFiles] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check for log files on mount
  useEffect(() => {
    checkForLogFiles();
  }, []);

  const checkForLogFiles = async () => {
    try {
      const files = await GnssModule.listLogFiles();
      setLogFiles(files);
      setHasLogFiles(files.length > 0);
    } catch (error) {
      console.error('[GnssExportManager] Error checking log files:', error);
    }
  };

  const handleShowExportDialog = async () => {
    if (disabled) return;

    setIsRefreshing(true);
    try {
      const files = await GnssModule.listLogFiles();

      if (files.length === 0) {
        Alert.alert('No Data', 'No log files found. Start logging to create data.');
        return;
      }

      setLogFiles(files);
      setHasLogFiles(true);
      setShowFileSelector(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('Error', `Could not list log files: ${errorMessage}`);
      console.error('[GnssExportManager] List files error:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportFile = async (filePath: string, fileName: string) => {
    try {
      setShowFileSelector(false);

      // Export to Downloads folder with original filename
      const exportedPath = await GnssExportModule.exportCSV(filePath, fileName);

      Alert.alert(
        'Export Successful',
        `${fileName} exported to Downloads/Aisight folder`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('Export Failed', `Could not export data: ${errorMessage}`);
      console.error('[GnssExportManager] Export error:', error);
    }
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
              console.error('[GnssExportManager] Delete error:', error);
            }
          },
        },
      ]
    );
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
    <>
      <TouchableOpacity
        style={[styles.exportButton, disabled && styles.disabledButton]}
        onPress={handleShowExportDialog}
        disabled={disabled || isRefreshing}
      >
        <Text style={styles.exportButtonText}>
          {isRefreshing ? 'Loading...' : 'Manage & Export Logs'}
        </Text>
      </TouchableOpacity>

      {/* File Selector Modal */}
      <Modal
        visible={showFileSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFileSelector(false)}
      >
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
                      <Text
                        style={[
                          typography.bodySmall,
                          { color: colors.textSecondary, marginLeft: spacing.small },
                        ]}
                      >
                        {formatDate(item.lastModified)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.fileActions}>
                    <TouchableOpacity
                      onPress={() => handleExportFile(item.path, item.name)}
                      style={styles.actionButton}
                    >
                      <Text style={[typography.bodyLarge, { color: colors.primary }]}>
                        Export
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteFile(item.path, item.name)}
                      style={[styles.actionButton, { marginLeft: spacing.medium }]}
                    >
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
    </>
  );
};

const styles = StyleSheet.create({
  exportButton: {
    backgroundColor: colors.primary,
    padding: spacing.medium,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  exportButtonText: {
    ...typography.button,
    color: colors.textInverse,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: colors.textDisabled,
    opacity: 0.6,
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
