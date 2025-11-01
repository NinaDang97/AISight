import React from 'react';
import { Pressable, Image, StyleSheet, Platform } from 'react-native';

interface BackButtonProps {
  onPress: () => void;
  iconColor?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  onPress,
  iconColor = '#FFFFFF'
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={styles.backButton}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: true }}
    >
      <Image
        source={require('../../../../assets/images/icons/back-icon.png')}
        style={[styles.backIcon, { tintColor: iconColor }]}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 24,
    height: 24,
  },
});
