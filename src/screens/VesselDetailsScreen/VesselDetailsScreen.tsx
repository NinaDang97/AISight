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

/**
 * VesselAISDetails Component
 *
 * Displays extended AIS (Automatic Identification System) data for the selected vessel.
 * This component is shown when the user expands the details section.
 *
 * Data displayed:
 * - Current UTC datetime
 * - Vessel latitude (from GeoJSON coordinates[1])
 * - Vessel longitude (from GeoJSON coordinates[0])
 * - MMSI (Maritime Mobile Service Identity)
 * - Heading in degrees
 *
 * @returns {JSX.Element | null} The detailed vessel information or loading text
 */
const VesselAISDetails: React.FC = () => {
  const { vesselData } = useVesselDetails();
  const properties = vesselData?.properties;
  const coordinates = vesselData?.geometry?.coordinates;

  if (!properties || !coordinates) return <Text>Loading...</Text>

  return (
    <View style={styles.detailsView}>
      <View style={styles.detailRow}>
        <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Datetime UTC</Text>
        <Text style={typography.body}>{new Date().toUTCString()}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Latitude</Text>
        <Text style={typography.body}>{coordinates[1]}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Longitude</Text>
        <Text style={typography.body}>{coordinates[0]}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>IMO / MMSI</Text>
        <Text style={typography.body}>{properties.mmsi}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Heading</Text>
        <Text style={typography.body}>{properties.heading}°</Text>
      </View>
    </View>
  );
};

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
  const properties = vesselData?.properties;
  const coordinates = vesselData?.geometry?.coordinates;

  /**
   * Determines the button text based on details visibility state
   * @returns {string} 'Hide Details' or 'View Details'
   */
  const changeText = () => {
    return detailsVisible ? 'Hide Details' : 'View Details';
  };

  // Don't render if no vessel is selected
  if (!vesselData) return null;

  // Show loading state if data is incomplete
  if (!properties || !coordinates) return <Text>Loading...</Text>

  return (
    <View>
      {cardVisible && (
        <View style={styles.vesselCard}>
          {/* Header with MMSI and Close button */}
          <View style={styles.cardHeader}>
            <Text style={typography.heading4}>MMSI {properties.mmsi}</Text>
            <Pressable onPress={() => { setCardVisible(false); setDetailsVisible(false); }}>
              <Text>Close</Text>
            </Pressable>
          </View>

          {/* Active status badge */}
          <View style={styles.statusBadge}>
            <Text style={[typography.caption, { color: colors.textInverse }]}>Active</Text>
          </View>

          {/* Basic vessel information */}
          <View style={styles.detailRow}>
            <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Speed:</Text>
            <Text style={typography.body}>{properties.sog || 0} knots</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Course:</Text>
            <Text style={typography.body}>{properties.cog || 0}°</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
              Last Update:
            </Text>
            <Text style={typography.body}>{new Date(properties?.timestampExternal).toUTCString()}</Text>
          </View>

          {/* Expandable detailed AIS information */}
          {detailsVisible && <VesselAISDetails />}

          {/* Toggle button for expanded details */}
          <Button
            title={changeText()}
            variant="primary"
            size="medium"
            onPress={() => setDetailsVisible(!detailsVisible)}
          />
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
  /** Unused - legacy container style */
  container: {
    flex: 1,
  },
  /** Unused - legacy map placeholder style */
  mapPlaceholder: {
    flex: 1,
    backgroundColor: colors.water,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
