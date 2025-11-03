import AsyncStorage from '@react-native-async-storage/async-storage';
import create from 'zustand';
import type { AxiosInstance } from 'axios';
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

type AuthStoreDependencies = {
  storage: typeof AsyncStorage;
  api: AxiosInstance;
  setAuthToken: (token: string | null) => void;
};

const dependencies: Partial<AuthStoreDependencies> & { storage: typeof AsyncStorage } = {
  storage: AsyncStorage
};

const ensureApiDependencies = () => {
  if (!dependencies.api || !dependencies.setAuthToken) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const apiModule = require('../services/api') as AuthStoreDependencies;
    dependencies.api = apiModule.api;
    dependencies.setAuthToken = apiModule.setAuthToken;
  }
};

export { type AuthStoreDependencies };

export const setAuthStoreDependencies = (overrides: Partial<AuthStoreDependencies>) => {
  if (overrides.storage) {
    dependencies.storage = overrides.storage;
  }
  if (overrides.api) {
    dependencies.api = overrides.api;
  }
  if (overrides.setAuthToken) {
    dependencies.setAuthToken = overrides.setAuthToken;
  }
};

export const resetAuthStoreDependencies = () => {
  dependencies.storage = AsyncStorage;
  delete dependencies.api;
  delete dependencies.setAuthToken;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  error: null,
  initialise: async () => {
    const storage = dependencies.storage;
    const storedToken = await storage.getItem('storynest:token');
    if (storedToken) {
      ensureApiDependencies();
      dependencies.setAuthToken?.(storedToken);
      try {
        const response = await dependencies.api!.get('/auth/me');
        const user = response.data.user as AuthUser;
        set({ token: storedToken, user });
        await storage.setItem('storynest:user', JSON.stringify(user));
        return;
      } catch (error) {
        console.error(error);
      }
    }
    const storedUser = await storage.getItem('storynest:user');
    set({
      token: storedToken,
      user: storedUser ? (JSON.parse(storedUser) as AuthUser) : null
    });
  },
  login: async (email, password) => {
    ensureApiDependencies();
    set({ loading: true, error: null });
    try {
      const response = await dependencies.api!.post('/auth/login', { email, password });
      const { user, token } = response.data;
      await dependencies.storage.setItem('storynest:token', token);
      await dependencies.storage.setItem('storynest:user', JSON.stringify(user));
      dependencies.setAuthToken?.(token);
      set({ user, token, loading: false });
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Unable to login. Check your credentials.';
      
      if (error instanceof Error) {
        if (error.message.includes('Network')) {
          errorMessage = 'Network error. Check your connection and API URL configuration.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timeout. Backend may be unreachable.';
        } else if ((error as any).response?.data?.error) {
          errorMessage = (error as any).response.data.error;
        } else if ((error as any).response?.status === 401) {
          errorMessage = 'Invalid email or password.';
        } else if ((error as any).response?.status === 400) {
          errorMessage = 'Please enter a valid email and password.';
        }
      }
      
      set({ error: errorMessage, loading: false });
    }
  },
  register: async (email, password) => {
    ensureApiDependencies();
    set({ loading: true, error: null });
    try {
      const response = await dependencies.api!.post('/auth/register', { email, password });
      const { user, token } = response.data;
      await dependencies.storage.setItem('storynest:token', token);
      await dependencies.storage.setItem('storynest:user', JSON.stringify(user));
      dependencies.setAuthToken?.(token);
      set({ user, token, loading: false });
    } catch (error) {
      console.error('Register error:', error);
      let errorMessage = 'Unable to register. Try a different email.';
      
      if (error instanceof Error) {
        if (error.message.includes('Network')) {
          errorMessage = 'Network error. Check your connection and API URL configuration.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timeout. Backend may be unreachable.';
        } else if ((error as any).response?.data?.error) {
          errorMessage = (error as any).response.data.error;
        } else if ((error as any).response?.status === 409) {
          errorMessage = 'Email already registered. Try logging in instead.';
        } else if ((error as any).response?.status === 400) {
          errorMessage = 'Invalid email or password format.';
        }
      }
      
      set({ error: errorMessage, loading: false });
    }
  },
  logout: async () => {
    await dependencies.storage.removeItem('storynest:token');
    await dependencies.storage.removeItem('storynest:user');
    ensureApiDependencies();
    dependencies.setAuthToken?.(null);
    set({ user: null, token: null });
  }
}));

export const resetAuthStoreState = () => {
  useAuthStore.setState({
    user: null,
    token: null,
    loading: false,
    error: null
  });
};
