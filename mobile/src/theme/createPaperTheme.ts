import { MD3DarkTheme, MD3LightTheme, configureFonts, type MD3Theme } from 'react-native-paper';
import type { ThemeMode, ColorTheme } from '../store/themeStore';
import { getTheme } from './themes';

const fontConfig = configureFonts({
  config: {
    displaySmall: { fontFamily: 'System', fontWeight: '700' },
    headlineMedium: { fontFamily: 'System', fontWeight: '700' },
    titleMedium: { fontFamily: 'System', fontWeight: '600' },
    bodyMedium: { fontFamily: 'System', fontWeight: '400' }
  }
});

export const createPaperTheme = (mode: ThemeMode, colorTheme: ColorTheme = 'default'): MD3Theme => {
  const base = mode === 'dark' ? MD3DarkTheme : MD3LightTheme;
  const themeDef = getTheme(colorTheme);
  const palette = mode === 'dark' ? themeDef.darkPalette : themeDef.lightPalette;

  return {
    ...base,
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
  } as MD3Theme;
};
