import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Button } from '../../components/common/Button';
import { colors, typography, spacing } from '../../styles';
import { useVesselDetails } from '../../components/contexts/VesselDetailsContext';

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

export const VesselDetailsScreen = () => {
  const { cardVisible, setCardVisible, detailsVisible, setDetailsVisible, vesselData } = useVesselDetails();
  const properties = vesselData?.properties;
  const coordinates = vesselData?.geometry?.coordinates;

  const changeText = () => {
    return detailsVisible ? 'Hide Details' : 'View Details';
  };

  if (!vesselData) return null;
  if (!properties || !coordinates) return <Text>Loading...</Text>
  return (
    <View>
      {cardVisible && (
        <View style={styles.vesselCard}>

          <View style={styles.cardHeader}>
            <Text style={typography.heading4}>MMSI {properties.mmsi}</Text>
            <Pressable onPress={() => { setCardVisible(false); setDetailsVisible(false); }}>
              <Text>Close</Text>
            </Pressable>
          </View>

          <View style={styles.statusBadge}>
            <Text style={[typography.caption, { color: colors.textInverse }]}>Active</Text>
          </View>

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

          {detailsVisible && <VesselAISDetails />}

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: colors.water,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
    elevation: 5,
  },
  statusBadge: {
    backgroundColor: colors.online,
    borderRadius: 12,
    paddingHorizontal: spacing.small,
    paddingVertical: spacing.tiny,
    alignSelf: 'flex-start',
    marginVertical: spacing.small,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.tiny,
  },
  detailsView: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
