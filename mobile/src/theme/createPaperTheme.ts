import { MD3LightTheme, configureFonts, type MD3Theme } from 'react-native-paper';

const fontConfig = configureFonts({
  config: {
    displaySmall: { fontFamily: 'System', fontWeight: '700' },
    headlineMedium: { fontFamily: 'System', fontWeight: '700' },
    titleMedium: { fontFamily: 'System', fontWeight: '600' },
    bodyMedium: { fontFamily: 'System', fontWeight: '400' }
  }
});

export const createPaperTheme = (): MD3Theme => ({
  ...MD3LightTheme,
  roundness: 20,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#7C3AED',
    secondary: '#F472B6',
    tertiary: '#FBBF24',
    surface: 'rgba(255,255,255,0.92)',
    surfaceVariant: '#ECE1FF',
    background: 'transparent',
    onPrimary: '#F8F8FF'
  },
  fonts: fontConfig
});
