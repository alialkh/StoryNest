import { MD3DarkTheme, MD3LightTheme, configureFonts, type MD3Theme } from 'react-native-paper';
import type { ThemeMode } from '../store/themeStore';

const fontConfig = configureFonts({
  config: {
    displaySmall: { fontFamily: 'System', fontWeight: '700' },
    headlineMedium: { fontFamily: 'System', fontWeight: '700' },
    titleMedium: { fontFamily: 'System', fontWeight: '600' },
    bodyMedium: { fontFamily: 'System', fontWeight: '400' }
  }
});

const lightPalette = {
  primary: '#6D28D9',
  onPrimary: '#F4F4FF',
  secondary: '#4C1D95',
  background: '#F6F3FF',
  surface: 'rgba(255, 255, 255, 0.96)',
  surfaceVariant: '#E8E7FF',
  outline: '#A5A1D6',
  tertiary: '#F59E0B',
  onSurface: '#1F1A3D',
  onSurfaceVariant: '#4B5563'
};

const darkPalette = {
  primary: '#C4B5FD',
  onPrimary: '#1B1033',
  secondary: '#A855F7',
  background: '#0F172A',
  surface: 'rgba(17, 24, 39, 0.86)',
  surfaceVariant: '#1E1B4B',
  outline: '#433B7C',
  tertiary: '#FBBF24',
  onSurface: '#E5E7EB',
  onSurfaceVariant: '#CBD5F5'
};

export const createPaperTheme = (mode: ThemeMode): MD3Theme => {
  const base = mode === 'dark' ? MD3DarkTheme : MD3LightTheme;
  const palette = mode === 'dark' ? darkPalette : lightPalette;

  return {
    ...base,
    mode,
    roundness: 20,
    colors: {
      ...base.colors,
      ...palette,
      background: palette.background,
      surface: palette.surface,
      surfaceVariant: palette.surfaceVariant,
      primary: palette.primary,
      secondary: palette.secondary,
      tertiary: palette.tertiary
    },
    fonts: fontConfig
  };
};
