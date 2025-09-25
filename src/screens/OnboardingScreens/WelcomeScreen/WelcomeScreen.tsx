import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { SafeAreaWrapper } from '../../../components/common/SafeAreaWrapper';
import { Button } from '../../../components/common/Button';
import { colors, typography, spacing } from '../../../styles';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../navigation/types';

type WelcomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();

  const handleGetStarted = () => {
    navigation.navigate('Permissions');
  };

  return (
    <SafeAreaWrapper barStyle="light-content" backgroundColor={colors.primary}>
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>AISight</Text>
          <Text style={styles.tagline}>Marine Traffic Tracker</Text>
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.title}>Welcome to AISight</Text>
          <Text style={styles.description}>
            Track marine vessels in real-time, access detailed information, and stay updated with the
            latest maritime traffic data.
          </Text>

          <View style={styles.featuresContainer}>
            <FeatureItem title="Real-time Tracking" description="Monitor vessel movements as they happen" />
            <FeatureItem title="Vessel Details" description="Access comprehensive vessel information" />
            <FeatureItem title="Search & Filter" description="Find specific vessels with ease" />
          </View>
        </View>

        <View style={styles.footerContainer}>
          <Button
            title="Get Started"
            variant="primary"
            size="large"
            fullWidth
            onPress={handleGetStarted}
            style={styles.button}
          />
        </View>
      </View>
    </SafeAreaWrapper>
  );
};

interface FeatureItemProps {
  title: string;
  description: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ title, description }) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIconContainer}>
      <View style={styles.featureIcon} />
    </View>
    <View style={styles.featureTextContainer}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.large,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: spacing.xlarge,
  },
  logoText: {
    ...typography.heading1,
    color: colors.textInverse,
    fontWeight: 'bold',
  },
  tagline: {
    ...typography.body,
    color: colors.textInverse,
    opacity: 0.8,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...typography.heading2,
    color: colors.textInverse,
    marginBottom: spacing.medium,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    color: colors.textInverse,
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: spacing.xlarge,
  },
  featuresContainer: {
    marginTop: spacing.large,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  featureIconContainer: {
    marginRight: spacing.medium,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    ...typography.heading5,
    color: colors.textInverse,
  },
  featureDescription: {
    ...typography.bodySmall,
    color: colors.textInverse,
    opacity: 0.8,
  },
  footerContainer: {
    marginBottom: spacing.large,
  },
  button: {
    backgroundColor: colors.secondary,
  },
});
