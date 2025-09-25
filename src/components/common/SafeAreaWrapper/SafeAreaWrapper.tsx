import React from 'react';
import { StyleSheet, StatusBar, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../styles';

interface SafeAreaWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
  barStyle?: 'light-content' | 'dark-content';
}

export const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({
  children,
  style,
  backgroundColor = colors.background,
  barStyle = 'dark-content',
}) => {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }, style]}>
      <StatusBar barStyle={barStyle} backgroundColor={backgroundColor} />
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
