import { create } from 'zustand';
import * as publicFeedService from '../services/publicFeedService';
import type { PublicStory } from '../services/publicFeedService';

interface PublicFeedState {
  stories: PublicStory[];
  isLoading: boolean;
  error: string | null;
  canShare: boolean;
  
  // Actions
  loadFeed: (limit?: number, offset?: number) => Promise<void>;
  shareStory: (storyId: string) => Promise<number>; // Returns XP gained
  toggleLike: (publicStoryId: string, currentlyLiked: boolean) => Promise<boolean>;
  likedStories: Set<string>;
  toggleLikedStory: (publicStoryId: string, liked: boolean) => void;
  setCanShare: (canShare: boolean) => void;
  clearError: () => void;
}

export const usePublicFeedStore = create<PublicFeedState>((set, get) => ({
  stories: [],
  isLoading: false,
  error: null,
  canShare: true,
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
      set({ isLoading: false, canShare: false }); // Rate limited for today
      return result.xpGained;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to share story';
      set({ isLoading: false, error: message });
      throw error;
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
    set({ canShare });
  },

  clearError: () => {
    set({ error: null });
  }
}));
