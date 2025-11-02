import AsyncStorage from '@react-native-async-storage/async-storage';
import create from 'zustand';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleMode: () => Promise<void>;
}

const STORAGE_KEY = 'storynest:theme-mode';

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light',
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) {
      return;
    }
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        set({ mode: stored });
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
      await AsyncStorage.setItem(STORAGE_KEY, mode);
    } catch (error) {
      console.warn('Unable to persist theme preference', error);
    }
  },
  toggleMode: async () => {
    const next = get().mode === 'light' ? 'dark' : 'light';
    await get().setMode(next);
  }
}));

export const resetThemeStoreState = () => {
  useThemeStore.setState({
    mode: 'light',
    hydrated: false
  });
};
