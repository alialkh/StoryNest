import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { create } from 'zustand';
import * as publicFeedService from '../services/publicFeedService';
import type { PublicStory } from '../services/publicFeedService';

const SHARE_LIMIT_STORAGE_KEY = 'storynest.publicFeed.shareLimit';

type DailyShareLimitError = Error & { code: 'DAILY_SHARE_LIMIT'; resetAt: string };

const createDailyShareLimitError = (message: string, resetAt: string): DailyShareLimitError => {
  const error = new Error(message) as DailyShareLimitError;
  error.name = 'DailyShareLimitError';
  error.code = 'DAILY_SHARE_LIMIT';
  error.resetAt = resetAt;
  return error;
};

const getNextShareWindow = () => {
  const now = new Date();
  const reset = new Date(now);
  reset.setHours(24, 0, 0, 0);
  return reset.toISOString();
};

let shareCooldownTimer: ReturnType<typeof setTimeout> | null = null;

const scheduleShareReset = (set: StoreSet, resetAt: string | null) => {
  if (shareCooldownTimer) {
    clearTimeout(shareCooldownTimer);
    shareCooldownTimer = null;
  }

  if (!resetAt) {
    return;
  }

  const delay = new Date(resetAt).getTime() - Date.now();

  if (delay <= 0) {
    set(() => ({ canShare: true, shareCooldownUntil: null }));
    void AsyncStorage.removeItem(SHARE_LIMIT_STORAGE_KEY).catch((error) => {
      console.warn('Failed to clear stored share cooldown', error);
    });
    return;
  }

  shareCooldownTimer = setTimeout(() => {
    set(() => ({ canShare: true, shareCooldownUntil: null }));
    void AsyncStorage.removeItem(SHARE_LIMIT_STORAGE_KEY).catch((error) => {
      console.warn('Failed to clear stored share cooldown', error);
    });
  }, delay);
};

interface PublicFeedState {
  stories: PublicStory[];
  isLoading: boolean;
  error: string | null;
  canShare: boolean;
  shareCooldownUntil: string | null;

  // Actions
  loadFeed: (limit?: number, offset?: number) => Promise<void>;
  shareStory: (storyId: string) => Promise<number>; // Returns XP gained
  toggleLike: (publicStoryId: string, currentlyLiked: boolean) => Promise<boolean>;
  likedStories: Set<string>;
  toggleLikedStory: (publicStoryId: string, liked: boolean) => void;
  setCanShare: (canShare: boolean) => void;
  initialiseShareLimit: () => Promise<void>;
  clearShareLimit: () => Promise<void>;
  clearError: () => void;
}

type StoreSet = (
  partial:
    | Partial<PublicFeedState>
    | ((state: PublicFeedState) => Partial<PublicFeedState>),
  replace?: boolean
) => void;

export const usePublicFeedStore = create<PublicFeedState>((set, get) => ({
  stories: [],
  isLoading: false,
  error: null,
  canShare: true,
  shareCooldownUntil: null,
  likedStories: new Set<string>(),

  loadFeed: async (limit = 20, offset = 0) => {
    set({ isLoading: true, error: null });
    try {
      const stories = await publicFeedService.getPublicFeed(limit, offset);
      set({ stories, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load feed';
      set({ isLoading: false, error: message });
    }
  },

  shareStory: async (storyId: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await publicFeedService.shareStoryToPublic(storyId);
      const resetAt = getNextShareWindow();
      await AsyncStorage.setItem(SHARE_LIMIT_STORAGE_KEY, JSON.stringify({ resetAt }));
      scheduleShareReset(set, resetAt);
      set({ isLoading: false, canShare: false, shareCooldownUntil: resetAt });
      return result.xpGained;
    } catch (error) {
      const defaultMessage = error instanceof Error ? error.message : 'Failed to share story';

      if (axios.isAxiosError(error) && error.response?.status === 429) {
        const resetAt = getNextShareWindow();
        const responseMessage =
          typeof error.response.data?.error === 'string' ? error.response.data.error : defaultMessage;
        await AsyncStorage.setItem(SHARE_LIMIT_STORAGE_KEY, JSON.stringify({ resetAt }));
        scheduleShareReset(set, resetAt);
        const limitError = createDailyShareLimitError(responseMessage, resetAt);
        set({ isLoading: false, canShare: false, shareCooldownUntil: resetAt });
        throw limitError;
      }

      set({ isLoading: false, error: defaultMessage });
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(defaultMessage);
    }
  },

  toggleLike: async (publicStoryId: string, currentlyLiked: boolean) => {
    try {
      const newLikeStatus = !currentlyLiked;
      if (newLikeStatus) {
        await publicFeedService.likeStory(publicStoryId);
      } else {
        await publicFeedService.unlikeStory(publicStoryId);
      }
      
      get().toggleLikedStory(publicStoryId, newLikeStatus);
      
      // Update story like counts in feed
      set((state) => ({
        stories: state.stories.map((story) =>
          story.id === publicStoryId
            ? {
                ...story,
                like_count: story.like_count + (newLikeStatus ? 1 : -1)
              }
            : story
        )
      }));
      
      return newLikeStatus;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to toggle like';
      set({ error: message });
      throw error;
    }
  },

  toggleLikedStory: (publicStoryId: string, liked: boolean) => {
    set((state) => {
      const newSet = new Set(state.likedStories);
      if (liked) {
        newSet.add(publicStoryId);
      } else {
        newSet.delete(publicStoryId);
      }
      return { likedStories: newSet };
    });
  },

  setCanShare: (canShare: boolean) => {
    set((state) => ({
      canShare,
      shareCooldownUntil: canShare ? null : state.shareCooldownUntil
    }));
    if (canShare) {
      scheduleShareReset(set, null);
      void AsyncStorage.removeItem(SHARE_LIMIT_STORAGE_KEY).catch((error) => {
        console.warn('Failed to clear stored share cooldown', error);
      });
    }
  },

  initialiseShareLimit: async () => {
    try {
      const raw = await AsyncStorage.getItem(SHARE_LIMIT_STORAGE_KEY);
      if (!raw) {
        set({ canShare: true, shareCooldownUntil: null });
        scheduleShareReset(set, null);
        return;
      }

      const parsed = JSON.parse(raw) as { resetAt?: string | null };
      const resetAt = parsed?.resetAt ?? null;
      if (!resetAt) {
        set({ canShare: true, shareCooldownUntil: null });
        scheduleShareReset(set, null);
        return;
      }

      const resetDate = new Date(resetAt);
      if (Number.isNaN(resetDate.getTime()) || resetDate.getTime() <= Date.now()) {
        await AsyncStorage.removeItem(SHARE_LIMIT_STORAGE_KEY);
        set({ canShare: true, shareCooldownUntil: null });
        scheduleShareReset(set, null);
        return;
      }

      set({ canShare: false, shareCooldownUntil: resetAt });
      scheduleShareReset(set, resetAt);
    } catch (error) {
      console.warn('Failed to restore share limit state', error);
      set({ canShare: true, shareCooldownUntil: null });
      scheduleShareReset(set, null);
    }
  },

  clearShareLimit: async () => {
    await AsyncStorage.removeItem(SHARE_LIMIT_STORAGE_KEY);
    scheduleShareReset(set, null);
    set({ canShare: true, shareCooldownUntil: null });
  },

  clearError: () => {
    set({ error: null });
  }
}));
