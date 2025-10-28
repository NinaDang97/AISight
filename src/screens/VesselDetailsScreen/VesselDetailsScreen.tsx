import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Button } from '../../components/common/Button';
import { colors, typography, spacing } from '../../styles';

const VesselAISDetails: React.FC = () => {
  return (
    <View style={styles.detailsView}>
      <View style={styles.detailRow}>
        <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Datetime UTC</Text>
        <Text style={typography.body}>02:00</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Latitude</Text>
        <Text style={typography.body}>63.12345</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Longitude</Text>
        <Text style={typography.body}>10.12345</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>IMO / MMSI</Text>
        <Text style={typography.body}>257465900</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Heading</Text>
        <Text style={typography.body}>143°</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
          Navigation status (NAVSTAT)
        </Text>
        <Text style={typography.body}>15</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Vessel Name</Text>
        <Text style={typography.body}>MV Ocean Explorer</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Vessel type</Text>
        <Text style={typography.body}>60</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Callsign</Text>
        <Text style={typography.body}>MVOE</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Length</Text>
        <Text style={typography.body}>50 m</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Width</Text>
        <Text style={typography.body}>15 m</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Draught</Text>
        <Text style={typography.body}>0 m</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Destination</Text>
        <Text style={typography.body}>Helsinki</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>ETA</Text>
        <Text style={typography.body}>05:00</Text>
      </View>
    </View>
  );
};

type VesselDetailsContextType = {
  cardVisible: boolean;
  setCardVisible: React.Dispatch<React.SetStateAction<boolean>>;
  detailsVisible: boolean;
  setDetailsVisible: React.Dispatch<React.SetStateAction<boolean>>;
};

const VesselDetailsContext = React.createContext<VesselDetailsContextType | undefined>(undefined);
export const useVesselDetails = (): VesselDetailsContextType => {
  const context = React.useContext(VesselDetailsContext);
  if(!context) throw new Error("no work");
  return context;
};

export const VesselDetailsProvider: React.FC<{children: React.ReactNode}> = ({children} : any) => {
  const [cardVisible, setCardVisible] = React.useState<boolean>(false);
  const [detailsVisible, setDetailsVisible] = React.useState<boolean>(false);
  return (
    <VesselDetailsContext.Provider
      value={{cardVisible,setCardVisible,detailsVisible,setDetailsVisible}} >
      {children}
    </VesselDetailsContext.Provider>
  );
};

export const VesselDetailsScreen = () => {

  const {cardVisible, setCardVisible, detailsVisible, setDetailsVisible} = useVesselDetails();

  const changeText = () => {
    return detailsVisible ? 'Hide Details' : 'View Details';
  };

  return (
    <View>
      {/* Just for getting the damn detail view showing */}
      <Button title={'haha'} onPress={() => setCardVisible(!cardVisible)} />

      {cardVisible && (
        <View style={styles.vesselCard}>

          <View style={styles.cardHeader}>
            <Text style={typography.heading4}>MV Ocean Explorer</Text>
            <Pressable onPress={() => {setCardVisible(false); setDetailsVisible(false);}}>
              <Text>Close</Text>
            </Pressable>
          </View>

          <View style={styles.statusBadge}>
            <Text style={[typography.caption, { color: colors.textInverse }]}>Active</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Speed:</Text>
            <Text style={typography.body}>12.5 knots</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Course:</Text>
            <Text style={typography.body}>245°</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
              Last Update:
            </Text>
            <Text style={typography.body}>2 min ago</Text>
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
