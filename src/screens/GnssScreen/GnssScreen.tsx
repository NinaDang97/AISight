import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaWrapper } from '../../components/common/SafeAreaWrapper';
import { colors, typography, spacing } from '../../styles';

export const GnssScreen: React.FC = () => {
  return (
    <SafeAreaWrapper backgroundColor={colors.background} barStyle="dark-content">
      <View style={styles.container}>
        <Text style={typography.heading2}>GNSS</Text>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          GNSS tracking and data will be displayed here
        </Text>
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.medium,
  },
});
