import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AxiosError } from 'axios';
import * as publicFeedService from '../services/publicFeedService';
import type { PublicStory } from '../services/publicFeedService';
import { formatShareCooldownMessage, getNextShareWindow } from '../utils/time';

interface PublicFeedState {
  stories: PublicStory[];
  isLoading: boolean;
  error: string | null;
  canShare: boolean;
  shareCooldownUntil: string | null;
  shareCooldownStartedAt: string | null;

  // Actions
  loadFeed: (limit?: number, offset?: number) => Promise<void>;
  shareStory: (storyId: string) => Promise<number>; // Returns XP gained
  toggleLike: (publicStoryId: string, currentlyLiked: boolean) => Promise<boolean>;
  likedStories: Set<string>;
  toggleLikedStory: (publicStoryId: string, liked: boolean) => void;
  setCanShare: (canShare: boolean) => void;
  hydrateShareStatus: () => Promise<void>;
  clearError: () => void;
}

const SHARE_COOLDOWN_KEY = 'publicFeed:shareCooldownUntil';
const SHARE_COOLDOWN_START_KEY = 'publicFeed:shareCooldownStartedAt';

const shouldResetCooldown = (isoString: string | null): boolean => {
  if (!isoString) return true;
  const target = new Date(isoString).getTime();
  if (Number.isNaN(target)) return true;
  return target <= Date.now();
};

export const usePublicFeedStore = create<PublicFeedState>((set, get) => ({
  stories: [],
  isLoading: false,
  error: null,
  canShare: true,
  shareCooldownUntil: null,
  shareCooldownStartedAt: null,
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
    const { canShare, shareCooldownUntil, shareCooldownStartedAt } = get();
    if (!canShare && !shouldResetCooldown(shareCooldownUntil)) {
      const message =
        formatShareCooldownMessage(shareCooldownUntil) ?? 'You can only share 1 story per day.';
      set({ error: message });
      throw new Error(message);
    }

    set({ isLoading: true, error: null });
    try {
      const result = await publicFeedService.shareStoryToPublic(storyId);
      const cooldown = getNextShareWindow();
      const startedAt = new Date().toISOString();
      await AsyncStorage.multiSet([
        [SHARE_COOLDOWN_KEY, cooldown],
        [SHARE_COOLDOWN_START_KEY, startedAt]
      ]);
      set({
        isLoading: false,
        canShare: false,
        shareCooldownUntil: cooldown,
        shareCooldownStartedAt: startedAt
      }); // Rate limited for today
      return result.xpGained;
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: string }>;
      const serverMessage = axiosError?.response?.data?.error;
      const message =
        serverMessage ?? (error instanceof Error ? error.message : 'Failed to share story');

      if (axiosError?.response?.status === 429) {
        const cooldown = getNextShareWindow();
        const existingStart = shareCooldownStartedAt ?? new Date().toISOString();
        await AsyncStorage.multiSet([
          [SHARE_COOLDOWN_KEY, cooldown],
          [SHARE_COOLDOWN_START_KEY, existingStart]
        ]);
        set({ canShare: false, shareCooldownUntil: cooldown, shareCooldownStartedAt: existingStart });
      }

      set({ isLoading: false, error: message });
      throw new Error(message);
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
      shareCooldownUntil: canShare ? null : state.shareCooldownUntil,
      shareCooldownStartedAt: canShare ? null : state.shareCooldownStartedAt
    }));
  },

  hydrateShareStatus: async () => {
    try {
      const [storedUntil, storedStart] = await Promise.all([
        AsyncStorage.getItem(SHARE_COOLDOWN_KEY),
        AsyncStorage.getItem(SHARE_COOLDOWN_START_KEY)
      ]);
      if (!storedUntil || shouldResetCooldown(storedUntil)) {
        if (storedUntil) {
          await AsyncStorage.removeItem(SHARE_COOLDOWN_KEY);
        }
        if (storedStart) {
          await AsyncStorage.removeItem(SHARE_COOLDOWN_START_KEY);
        }
        set({ canShare: true, shareCooldownUntil: null, shareCooldownStartedAt: null });
        return;
      }

      set({
        canShare: false,
        shareCooldownUntil: storedUntil,
        shareCooldownStartedAt: storedStart ?? null
      });
    } catch (error) {
      console.warn('Failed to hydrate share limit status', error);
      set({ canShare: true, shareCooldownUntil: null, shareCooldownStartedAt: null });
    }
  },

  clearError: () => {
    set({ error: null });
  }
}));
