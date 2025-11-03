import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';

interface Props {
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}

export const EnchantedBackground: React.FC<Props> = ({ children, contentStyle, style }) => {
  const theme = useTheme();
  const isDark = theme.dark || (theme as any).mode === 'dark';

  const palette = isDark
    ? {
        base: '#0F172A',
        glow: '#1E1B4B',
        aurora: '#312E81',
        accent: '#7C3AED'
      }
    : {
        base: '#F6F3FF',
        glow: '#E8E7FF',
        aurora: '#FDE68A',
        accent: '#FBCFE8'
      };

  return (
    <View style={[styles.root, { backgroundColor: palette.base }, style]}>
      {/*
        Window clips the decorative orbs so the background doesn't visually extend past the app window.
        overflow: 'hidden' ensures users can't pan/see the orbs outside the intended app area.
      */}
      <View style={styles.window}>
        <View pointerEvents="none" style={[styles.orb, styles.orbOne, { backgroundColor: palette.glow }]} />
        <View pointerEvents="none" style={[styles.orb, styles.orbTwo, { backgroundColor: palette.accent }]} />
        <View pointerEvents="none" style={[styles.orb, styles.orbThree, { backgroundColor: palette.aurora }]} />
        <View style={[styles.content, contentStyle]}>{children}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  window: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden'
  },
  content: {
    flex: 1
  },
  orb: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.35,
    transform: [{ rotate: '12deg' }]
  },
  orbOne: {
    top: -80,
    left: -60
  },
  orbTwo: {
    bottom: -120,
    right: -80
  },
  orbThree: {
    top: '45%',
    right: '35%',
    opacity: 0.25,
    transform: [{ rotate: '-20deg' }]
  }
});
