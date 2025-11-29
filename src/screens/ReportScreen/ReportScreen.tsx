import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaWrapper } from '../../components/common/SafeAreaWrapper';
import { colors, typography, spacing, theme } from '../../styles';

export const ReportScreen = () => {
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [gnssStatus, setGnssStatus] = useState<'Strong' | 'Medium' | 'Weak'>('Strong');

  // Mock data for the summary
  const reportData = {
    totalVessels: 154,
    monitoredVessels: 7,
    anomalies24h: 8,
    signalStrength: '42 dB-Hz avg',
  };

  useEffect(() => {
    // Set initial last update time
    const now = new Date();
    setLastUpdate('12:30'); // Hardcoded for now
    
    // Randomly set GNSS status for demo
    const statuses: ('Strong' | 'Medium' | 'Weak')[] = ['Strong', 'Medium', 'Weak'];
    setGnssStatus(statuses[Math.floor(Math.random() * statuses.length)]);
  }, []);

  // Get GNSS status color based on strength
  const getGnssStatusColor = () => {
    switch (gnssStatus) {
      case 'Strong': return colors.success; // Green
      case 'Medium': return colors.warning; // Orange/Yellow
      case 'Weak': return colors.error;     // Red
      default: return colors.success;
    }
  };

  const generatePDFReport = () => {
    setIsGeneratingPDF(true);
    setTimeout(() => {
      setIsGeneratingPDF(false);
      Alert.alert(
        'PDF Report Generated',
        'Comprehensive report has been saved to:\n\n/Documents/AISightReports/',
        [{ text: 'OK' }]
      );
    }, 2000);
  };

  const exportCSVData = () => {
    setIsExportingCSV(true);
    setTimeout(() => {
      setIsExportingCSV(false);
      Alert.alert(
        'CSV Data Exported',
        'Vessel and anomaly data has been exported.',
        [{ text: 'OK' }]
      );
    }, 1500);
  };

  const shareReports = () => {
    Alert.alert(
      'Share Reports',
      'Select sharing method for exported reports.',
      [
        { text: 'Email', style: 'default' },
        { text: 'Cloud Storage', style: 'default' },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  // Summary cards data
  const summaryCards = [
    {
      icon: require('../../../assets/images/icons/vessel-icon.png'),
      title: 'Total Vessels',
      value: reportData.totalVessels.toString(),
      subtitle: 'Monitored',
      borderColor: colors.primary,
    },
    {
      icon: require('../../../assets/images/icons/anomaly-icon.png'),
      title: 'Anomalies',
      value: reportData.anomalies24h.toString(),
      subtitle: 'Last 24 hours',
      borderColor: colors.warning,
    },
    {
      icon: require('../../../assets/images/icons/gnss-icon.png'),
      title: 'GNSS Signal',
      value: gnssStatus,
      subtitle: reportData.signalStrength,
      borderColor: getGnssStatusColor(),
    },
    {
      icon: require('../../../assets/images/icons/report-icon.png'),
      title: 'Last Updated',
      value: lastUpdate,
      subtitle: 'UTC',
      borderColor: colors.secondary,
    },
  ];

  return (
    <SafeAreaWrapper backgroundColor={colors.background} barStyle="dark-content">
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Reports</Text>
          <Text style={styles.headerSubtitle}>Data Summary & Export Hub</Text>
        </View>

        {/* Summary Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary Overview</Text>
          <View style={styles.summaryGrid}>
            {summaryCards.map((card, index) => (
              <View 
                key={index}
                style={[
                  styles.summaryCard,
                  { borderLeftColor: card.borderColor }
                ]}
              >
                <View style={styles.cardHeader}>
                  <Image source={card.icon} style={styles.cardIcon} />
                  <Text style={styles.summaryCardTitle}>{card.title}</Text>
                </View>
                <Text style={[styles.summaryCardValue, { color: card.borderColor }]}>
                  {card.value}
                </Text>
                <Text style={styles.summaryCardSubtitle}>{card.subtitle}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Export & Share Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export & Share</Text>
          <View style={styles.exportCard}>
            
            {/* Export Report (PDF) Section */}
            <View style={styles.exportSection}>
              <Text style={styles.exportSectionTitle}>Export Report (PDF)</Text>
              <TouchableOpacity 
                style={[
                  styles.exportButton,
                  styles.primaryButton,
                  isGeneratingPDF && styles.disabledButton
                ]}
                onPress={generatePDFReport}
                disabled={isGeneratingPDF}
              >
                <Text style={styles.exportButtonText}>
                  {isGeneratingPDF ? 'Generating...' : 'Generate PDF Report'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* CSV Data and Share buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[
                  styles.halfButton,
                  styles.secondaryButton,
                  isExportingCSV && styles.disabledButton
                ]}
                onPress={exportCSVData}
                disabled={isExportingCSV}
              >
                <Text style={styles.halfButtonText}>
                  {isExportingCSV ? 'Exporting...' : 'CSV Data'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.halfButton, styles.shareButton]}
                onPress={shareReports}
              >
                <Text style={styles.shareButtonText}>Share</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>

        {/* Save Location Footer */}
        <View style={styles.section}>
          <View style={styles.saveLocationCard}>
            <Text style={styles.saveLocationText}>
              Reports saved to: /Documents/AISightReports/
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
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.large,
    paddingTop: spacing.xlarge,
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
  sectionTitle: {
    ...typography.heading4,
    color: colors.textPrimary,
    marginBottom: spacing.small,
    fontWeight: '600',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.medium,
    padding: spacing.medium,
    marginBottom: spacing.medium,
    borderLeftWidth: 4,
    ...theme.shadows.small,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  cardIcon: {
    width: 20,
    height: 20,
    marginRight: spacing.small,
  },
  summaryCardTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  summaryCardValue: {
    ...typography.heading2,
    fontWeight: '700',
    marginBottom: spacing.xsmall,
  },
  summaryCardSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  exportCard: {
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.medium,
    padding: spacing.medium,
    ...theme.shadows.small,
  },
  exportSection: {
    marginBottom: spacing.medium,
  },
  exportSectionTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.small,
  },
  exportButton: {
    padding: spacing.medium,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.small,
  },
  halfButton: {
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
  shareButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  disabledButton: {
    backgroundColor: colors.textDisabled,
    opacity: 0.6,
  },
  exportButtonText: {
    ...typography.button,
    color: colors.textInverse,
    fontWeight: '600',
  },
  halfButtonText: {
    ...typography.button,
    color: colors.textInverse,
    fontWeight: '600',
  },
  shareButtonText: {
    ...typography.button,
    color: colors.primary,
    fontWeight: '600',
  },
  saveLocationCard: {
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.medium,
    padding: spacing.medium,
    ...theme.shadows.small,
    alignItems: 'center',
  },
  saveLocationText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});