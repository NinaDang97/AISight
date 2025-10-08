import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing, ImageBackground, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { Routes } from '../../navigation/routes';
import { colors, typography, spacing } from '../../styles';

// Import the background image and icon
const backgroundImage = require('../../../assets/images/splash/background.jpg');
const shipIcon = require('../../../assets/images/icons/icon.png');

type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export const SplashScreen: React.FC = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Initial fade in and scale
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
    ]).start();

    // Pulse animation for the rings
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();

    // Navigate to Welcome screen after a delay
    const timer = setTimeout(() => {
      navigation.replace(Routes.Root.ONBOARDING, {
        screen: Routes.Onboarding.WELCOME,
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation, opacityAnim, scaleAnim, pulseAnim]);

  return (
    <ImageBackground 
      source={backgroundImage} 
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: opacityAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Animated rings */}
            <Animated.View
              style={[
                styles.ring,
                styles.ring1,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.ring,
                styles.ring2,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.ring,
                styles.ring3,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            />
            
            {/* Ship icon placeholder - replace with your actual icon */}
            <View style={styles.iconContainer}>
              <Image source={shipIcon} style={styles.icon} resizeMode="contain" />
            </View>
          </Animated.View>

          <Animated.View style={{ opacity: opacityAnim }}>
            <Text style={styles.title}>
              <Text style={styles.titleBlue}>AI</Text>
              <Text style={styles.titleAccent}>Sight</Text>
            </Text>
            <Text style={styles.subtitle}>Maritime Navigation Anomaly Detection</Text>
          </Animated.View>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Semi-transparent overlay to ensure text readability
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.large,
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.textInverse,
    borderRadius: 999,
  },
  ring1: {
    width: 80,
    height: 80,
  },
  ring2: {
    width: 120,
    height: 120,
  },
  ring3: {
    width: 160,
    height: 160,
  },
  iconContainer: {
    width: 50,
    height: 50,
    backgroundColor: colors.secondary,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 5,
  },
  title: {
    ...typography.heading1,
    marginBottom: spacing.small,
    textAlign: 'center',
  },
  titleBlue: {
    color: colors.textInverse,
  },
  titleAccent: {
    color: colors.accent,
  },
  subtitle: {
    ...typography.body,
    color: colors.textInverse,
    opacity: 0.8,
    textAlign: 'center',
  },
});
