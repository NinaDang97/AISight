import React from 'react';
import { StyleSheet, StatusBar, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { colors } from '../../../styles';

interface SafeAreaWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
  barStyle?: 'light-content' | 'dark-content';
  edges?: readonly Edge[];
}

export const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({
  children,
  style,
  backgroundColor = colors.background,
  barStyle = 'dark-content',
  edges,
}) => {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }, style]} edges={edges}>
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
