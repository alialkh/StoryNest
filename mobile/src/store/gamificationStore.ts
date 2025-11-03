import { create } from 'zustand';
import type { UserStats, UserAchievement } from '../types/index';
import { api } from '../services/api';

interface GamificationState {
  stats: UserStats | null;
  achievements: UserAchievement[];
  newAchievements: UserAchievement[];
  loading: boolean;
  error: string | null;
  fetchStats: () => Promise<void>;
  fetchAchievements: () => Promise<void>;
  clearNewAchievements: () => void;
}

export const useGamificationStore = create<GamificationState>((set) => ({
  stats: null,
  achievements: [],
  newAchievements: [],
  loading: false,
  error: null,

  fetchStats: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/gamification/stats');
      set({ stats: response.data.stats, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchAchievements: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/gamification/achievements');
      set({ achievements: response.data.achievements, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  clearNewAchievements: () => {
    set({ newAchievements: [] });
  }
}));
