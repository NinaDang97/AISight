/**
 * VesselDetailsScreen Component
 *
 * This screen displays a bottom sheet popup showing detailed information about a selected vessel.
 * It integrates with the VesselDetailsContext to manage visibility and vessel data state.
 *
 * Features:
 * - Shows basic vessel information (MMSI, speed, course, last update)
 * - Expandable detailed view with additional AIS data
 * - Close button to dismiss the popup
 * - Positioned as an absolute bottom sheet overlay
 *
 * @module VesselDetailsScreen
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Button } from '../../components/common/Button';
import { colors, typography, spacing } from '../../styles';
import { useVesselDetails } from '../../components/contexts/VesselDetailsContext';
import { useVesselMqtt } from '../../components/contexts/VesselMqttContext';

/**
 * VesselDetailsScreen Component
 *
 * Main component that displays a bottom sheet popup with vessel information when a vessel is tapped on the map.
 * Integrates with VesselDetailsContext to manage state and visibility.
 *
 * Component behavior:
 * - Renders null when no vessel is selected
 * - Shows loading text when vessel data is incomplete
 * - Displays a bottom sheet card with vessel information when cardVisible is true
 * - Supports expanding/collapsing detailed information
 *
 * State management:
 * - `cardVisible`: Controls visibility of the entire popup
 * - `detailsVisible`: Controls visibility of the expanded details section
 * - `vesselData`: GeoJSON feature containing vessel properties and coordinates
 *
 * User interactions:
 * - Close button: Dismisses popup and resets both visibility states
 * - View/Hide Details button: Toggles expanded details section
 *
 * @returns {JSX.Element | null} The vessel details popup or null if no vessel selected
 */
export const VesselDetailsScreen = () => {
  const { cardVisible, setCardVisible, detailsVisible, setDetailsVisible, vesselData } = useVesselDetails();
  const mmsi = vesselData?.properties ? vesselData.properties.mmsi : null;
  const { vessels, metadata } = useVesselMqtt();
  const liveVessel = mmsi ? vessels[mmsi] : undefined;
  const liveVesselWithMetadata = mmsi ? metadata[mmsi] : undefined;

  /**
   * Determines the button text based on details visibility state
   * @returns {string} 'Hide Details' or 'View Details'
   */
  const changeText = () => {
    return detailsVisible ? 'Hide Details' : 'View Details';
  };

  // Don't render if no vessel is selected
  if (!vesselData || !liveVessel) return null;

  const { lat, lon, sog, cog, heading, receivedAt, posAcc } = liveVessel;

  return (
    <View>
      {cardVisible && (
        <View style={styles.vesselCard}>
          {/* Header with MMSI and Close button */}
          <View style={styles.cardHeader}>
            <Text style={typography.heading4}>{liveVesselWithMetadata ? liveVesselWithMetadata.name : `MMSI: ${mmsi}`}</Text>
            <Pressable onPress={() => { setCardVisible(false); setDetailsVisible(false); }}>
              <Text>Close</Text>
            </Pressable>
          </View>

          {/* Status badge */}
          <View style={styles.statusBadgeContainer}>
            <View style={{...styles.statusBadge, ...((sog || 0) === 0 && { backgroundColor: colors.offline })}}>
              <Text style={[typography.caption, { color: colors.textInverse }]}>{(sog || 0) > 0 ? 'Active' : 'Stationary'}</Text>
            </View>
            <View style={{...styles.statusBadge, ...(!posAcc && { backgroundColor: colors.error })}}>
              <Text style={[typography.caption, { color: colors.textInverse }]}>{!posAcc ? 'Anomaly' : 'Normal'}</Text>
            </View>
          </View>

          {/* Basic vessel information */}
          <View style={styles.detailRow}>
            <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>MMSI:</Text>
            <Text style={typography.body}>{mmsi}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Latitude - Longitude:</Text>
            <Text style={typography.body}>{lat} - {lon}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Speed:</Text>
            <Text style={typography.body}>{sog || 0} knots</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Course:</Text>
            <Text style={typography.body}>{cog || 0}°</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Heading:</Text>
            <Text style={typography.body}>{heading || 0}°</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
              Last Update:
            </Text>
            <Text style={typography.body}>{new Date(receivedAt).toLocaleString()}</Text>
          </View>

          {/* Expandable detailed AIS information */}
          {detailsVisible && liveVesselWithMetadata && (
            <View style={styles.detailsView}>
              <View style={styles.detailRow}>
                <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Destination</Text>
                <Text style={typography.body}>{liveVesselWithMetadata.destination}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Draught</Text>
                <Text style={typography.body}>{liveVesselWithMetadata.draught}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Call Sign</Text>
                <Text style={typography.body}>{liveVesselWithMetadata.callSign}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Ship Type</Text>
                <Text style={typography.body}>{liveVesselWithMetadata.type}</Text>
              </View>
            </View>
          )}

          {/* Toggle button for expanded details */}
          {liveVesselWithMetadata && <Button
            title={changeText()}
            variant="primary"
            size="medium"
            onPress={() => setDetailsVisible(!detailsVisible)}
          />}
        </View>
      )}
    </View>
  );
};

/**
 * Stylesheet for VesselDetailsScreen components
 *
 * Key styles:
 * - vesselCard: Bottom sheet positioned absolutely at screen bottom
 * - cardHeader: Horizontal layout for title and close button
 * - statusBadge: Green badge indicating vessel active status
 * - detailRow: Two-column layout for label-value pairs
 * - detailsView: Container for expanded AIS details
 */
const styles = StyleSheet.create({
  /**
   * Main vessel card container
   * - Positioned absolutely at bottom of screen
   * - Full width bottom sheet with rounded top corners
   * - Shadow for elevation effect
   */
  vesselCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.large,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5, // Android shadow
  },
  statusBadgeContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  /**
   * Status badge (Active/Inactive indicator)
   * - Green background for active vessels
   * - Rounded pill shape
   * - Self-aligned to start
   */
  statusBadge: {
    backgroundColor: colors.online,
    borderRadius: 12,
    paddingHorizontal: spacing.small,
    paddingVertical: spacing.tiny,
    alignSelf: 'flex-start',
    marginVertical: spacing.small,
  },
  /**
   * Two-column row for label-value pairs
   * - Flexbox with space-between for label on left, value on right
   * - Consistent vertical spacing
   */
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.tiny,
  },
  /**
   * Container for expanded AIS details section
   * - Full height with space distribution
   */
  detailsView: {
    flex: 1,
    justifyContent: 'space-between',
  },
  /**
   * Header row with MMSI title and close button
   * - Horizontal layout with space-between
   * - Title on left, close button on right
   */
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
