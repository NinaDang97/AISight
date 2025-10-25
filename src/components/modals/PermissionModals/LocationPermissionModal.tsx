import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
} from 'react-native';

const locationIcon = {
  location: require('../../../../assets/images/icons/location-icon.png'),
};

interface LocationPermissionModalProps {
  visible: boolean;
  onContinue: () => void;
  onNotNow: () => void;
}

export const LocationPermissionModal: React.FC<
  LocationPermissionModalProps
> = ({visible, onContinue, onNotNow}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Image
              source={locationIcon.location}
              style={styles.icon}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>Allow AISight to access this</Text>
          <Text style={styles.title}>device's location?</Text>

          {/* Explanation */}
          <Text style={styles.description}>We need your location to:</Text>
          <View style={styles.bulletContainer}>
            <Text style={styles.bullet}>• Center map on your position</Text>
            <Text style={styles.bullet}>• Show nearby vessels</Text>
            <Text style={styles.bullet}>• Enable navigation features</Text>
          </View>

          {/* Buttons */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onContinue}
            activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onNotNow}
            activeOpacity={0.8}>
            <Text style={styles.secondaryButtonText}>Not now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#2C2C2E',
    borderRadius: 14,
    width: '80%',
    maxWidth: 340,
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 10},
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#888888',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    width: 32,
    height: 32,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
  },
  description: {
    fontSize: 15,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 16,
    opacity: 0.9,
  },
  bulletContainer: {
    alignSelf: 'stretch',
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  bullet: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
    marginVertical: 4,
    opacity: 0.85,
  },
  primaryButton: {
    backgroundColor: '#5856D6',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    marginTop: 24,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#48484A',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    marginTop: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '400',
  },
});
