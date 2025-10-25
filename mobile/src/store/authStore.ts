import AsyncStorage from '@react-native-async-storage/async-storage';
import create from 'zustand';
import { api, setAuthToken } from '../services/api';
import type { AuthUser } from '../types';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  initialise: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  error: null,
  initialise: async () => {
    const storedToken = await AsyncStorage.getItem('storynest:token');
    if (storedToken) {
      setAuthToken(storedToken);
      try {
        const response = await api.get('/auth/me');
        const user = response.data.user as AuthUser;
        set({ token: storedToken, user });
        await AsyncStorage.setItem('storynest:user', JSON.stringify(user));
        return;
      } catch (error) {
        console.error(error);
      }
    }
    const storedUser = await AsyncStorage.getItem('storynest:user');
    set({
      token: storedToken,
      user: storedUser ? (JSON.parse(storedUser) as AuthUser) : null
    });
  },
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data;
      await AsyncStorage.setItem('storynest:token', token);
      await AsyncStorage.setItem('storynest:user', JSON.stringify(user));
      setAuthToken(token);
      set({ user, token, loading: false });
    } catch (error) {
      console.error(error);
      set({ error: 'Unable to login. Check your credentials.', loading: false });
    }
  },
  register: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/register', { email, password });
      const { user, token } = response.data;
      await AsyncStorage.setItem('storynest:token', token);
      await AsyncStorage.setItem('storynest:user', JSON.stringify(user));
      setAuthToken(token);
      set({ user, token, loading: false });
    } catch (error) {
      console.error(error);
      set({ error: 'Unable to register. Try a different email.', loading: false });
    }
  },
  logout: async () => {
    await AsyncStorage.removeItem('storynest:token');
    await AsyncStorage.removeItem('storynest:user');
    setAuthToken(null);
    set({ user: null, token: null });
  }
}));
