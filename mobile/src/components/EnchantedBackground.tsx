import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface Props {
  children: React.ReactNode;
  /**
   * Optional style override for the inner content container. Useful when a screen
   * needs to customise padding or layout alignment while keeping the decorative
   * background consistent.
   */
  contentStyle?: StyleProp<ViewStyle>;
  /**
   * Optional style override for the outer wrapper when additional layout control is required.
   */
  style?: StyleProp<ViewStyle>;
}

export const EnchantedBackground: React.FC<Props> = ({ children, contentStyle, style }) => {
  return (
    <View style={[styles.root, style]}>
      <View pointerEvents="none" style={[styles.orb, styles.orbOne]} />
      <View pointerEvents="none" style={[styles.orb, styles.orbTwo]} />
      <View pointerEvents="none" style={[styles.orb, styles.orbThree]} />
      <View pointerEvents="none" style={styles.sparkle} />
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7F4FF'
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24
  },
  orb: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.45
  },
  orbOne: {
    top: -60,
    left: -40,
    backgroundColor: '#C7D2FE'
  },
  orbTwo: {
    top: 120,
    right: -80,
    backgroundColor: '#FBCFE8'
  },
  orbThree: {
    bottom: -90,
    left: -60,
    backgroundColor: '#FDE68A'
  },
  sparkle: {
    position: 'absolute',
    top: '35%',
    left: '20%',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#DDD6FE',
    opacity: 0.25,
    transform: [{ rotate: '25deg' }]
  }
});
