import React from 'react';
import { Pressable, Text, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { colors, typography } from '../../../styles';

interface FilterChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: ImageSourcePropType; // Optional icon
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  active = false,
  onPress,
  icon
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      {icon && (
        <Image
          source={icon}
          style={[styles.chipIcon, active && styles.chipIconActive]}
        />
      )}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#ffffff1a',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.43)',
  },
  chipActive: {
    backgroundColor: 'rgba(26, 13, 160, 0.79)', // #1A0DA0 with 79% opacity
    borderColor: 'rgba(26, 13, 160, 0.79)',
  },
  chipIcon: {
    width: 16,
    height: 16,
    marginRight: 8, // Padding between icon and text
    tintColor: '#FFFFFF',
  },
  chipIconActive: {
    tintColor: '#FFFFFF',
  },
  chipText: {
    ...typography.caption,
    color: '#FFFFFF',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
