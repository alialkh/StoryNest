import AsyncStorage from '@react-native-async-storage/async-storage';
import create from 'zustand';

export type ThemeMode = 'light' | 'dark';
export type ColorTheme = 'default' | 'forest' | 'lava' | 'ocean' | 'twilight' | 'sunset' | 'midnight';

export interface ThemeDefinition {
  id: ColorTheme;
  name: string;
  lightPalette: Record<string, string>;
  darkPalette: Record<string, string>;
  unlocksAtXp: number;
  description: string;
}

interface ThemeState {
  mode: ThemeMode;
  colorTheme: ColorTheme;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleMode: () => Promise<void>;
  setColorTheme: (theme: ColorTheme) => Promise<void>;
}

const STORAGE_KEY_MODE = 'storynest:theme-mode';
const STORAGE_KEY_COLOR = 'storynest:color-theme';

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light',
  colorTheme: 'default',
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) {
      return;
    }
    try {
      const storedMode = await AsyncStorage.getItem(STORAGE_KEY_MODE);
      const storedColor = await AsyncStorage.getItem(STORAGE_KEY_COLOR);
      if (storedMode === 'light' || storedMode === 'dark') {
        set({ mode: storedMode });
      }
      if (storedColor) {
        set({ colorTheme: storedColor as ColorTheme });
      }
    } catch (error) {
      console.warn('Unable to read theme preference', error);
    } finally {
      set({ hydrated: true });
    }
  },
  setMode: async (mode) => {
    set({ mode });
    try {
      await AsyncStorage.setItem(STORAGE_KEY_MODE, mode);
    } catch (error) {
      console.warn('Unable to persist theme preference', error);
    }
  },
  toggleMode: async () => {
    const next = get().mode === 'light' ? 'dark' : 'light';
    await get().setMode(next);
  },
  setColorTheme: async (theme) => {
    set({ colorTheme: theme });
    try {
      await AsyncStorage.setItem(STORAGE_KEY_COLOR, theme);
    } catch (error) {
      console.warn('Unable to persist color theme preference', error);
    }
  }
}));

export const resetThemeStoreState = () => {
  useThemeStore.setState({
    mode: 'light',
    colorTheme: 'default',
    hydrated: false
  });
};
