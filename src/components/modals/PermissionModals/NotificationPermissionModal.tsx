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

const notificationIcon = {
  notification: require('../../../../assets/images/icons/notification-icon.png'),
};

interface NotificationPermissionModalProps {
  visible: boolean;
  onAllow: () => void;
  onDeny: () => void;
}

export const NotificationPermissionModal: React.FC<
  NotificationPermissionModalProps
> = ({visible, onAllow, onDeny}) => {
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
              source={notificationIcon.notification}
              style={styles.icon}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>Allow AISight to send you</Text>
          <Text style={styles.title}>notification?</Text>

          {/* Buttons */}
          <TouchableOpacity
            style={styles.allowButton}
            onPress={onAllow}
            activeOpacity={0.8}>
            <Text style={styles.allowButtonText}>Allow</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.denyButton}
            onPress={onDeny}
            activeOpacity={0.8}>
            <Text style={styles.denyButtonText}>Don't allow</Text>
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
  allowButton: {
    backgroundColor: '#5856D6',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    marginTop: 24,
    alignItems: 'center',
  },
  allowButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  denyButton: {
    backgroundColor: '#48484A',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    marginTop: 12,
    alignItems: 'center',
  },
  denyButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '400',
  },
});
