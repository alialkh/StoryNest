import create from 'zustand';
import { api } from '../services/api';
import type { Story } from '../types';

/**
 * Zustand store for managing user stories and favorites
 * 
 * State:
 * - stories: All user's personal stories from /stories endpoint
 * - favorites: User's favorited stories from /stories/favorites/list endpoint
 * - loading: Global loading state
 * - error: Global error message
 * - remaining: Daily story generation quota remaining
 * 
 * Important API Contract:
 * - POST /stories/:id/favorite: Add story to favorites (returns 201)
 * - DELETE /stories/:id/favorite: Remove story from favorites (returns 200)
 * - GET /stories/:id/favorite/status: Check if story is favorited
 * - GET /stories/favorites/list: Get all favorited stories
 * 
 * Key Methods:
 * - fetchStories(): Load all personal stories (called on app start)
 * - fetchFavorites(): Load all favorited stories (called when entering Library)
 * - toggleFavorite(id, isFavorite): Add/remove from favorites (handles both operations)
 * 
 * Common Mistakes to Avoid:
 * - Do NOT include favorites in useEffect dependency array if also calling fetch (causes infinite loop)
 * - Split fetch logic and UI update logic into separate useEffects
 * - toggleFavorite receives CURRENT state, not the desired new state
 * - Always await async operations before assuming state is updated
 */
interface StoryState {
  stories: Story[];
  favorites: Story[];
  loading: boolean;
  error: string | null;
  remaining: number | null;
  fetchStories: () => Promise<void>;
  fetchFavorites: () => Promise<void>;
  generateStory: (payload: { prompt: string; genre?: string | null; tone?: string | null; archetype?: string | null; wordCount?: number | null; continuedFromId?: string | null }) => Promise<Story | null>;
  shareStory: (id: string) => Promise<{ shareUrl: string } | null>;
  updateStoryTitle: (id: string, title: string) => Promise<Story | null>;
  toggleFavorite: (id: string, isFavorite: boolean) => Promise<boolean>;
  checkFavoriteStatus: (id: string) => Promise<boolean>;
}

export const useStoryStore = create<StoryState>((set, get) => ({
  stories: [],
  favorites: [],
  loading: false,
  error: null,
  remaining: null,
  fetchStories: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/stories');
      set({ stories: response.data.stories, remaining: response.data.remaining ?? null, loading: false });
    } catch (error) {
      console.error(error);
      set({ error: 'Unable to load stories', loading: false });
    }
  },
  /**
   * Fetch all favorited stories from backend
   * Called on Library screen mount to populate favorites array
   * Does NOT trigger any fetch when favorites change (to prevent infinite loops)
   */
  fetchFavorites: async () => {
    try {
      const response = await api.get('/stories/favorites/list');
      set({ favorites: response.data.stories });
    } catch (error) {
      console.error(error);
      set({ error: 'Unable to load favorites' });
    }
  },
  generateStory: async ({ prompt, genre, tone, archetype, wordCount, continuedFromId }) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/stories/generate', {
        prompt,
        genre,
        tone,
        archetype,
        wordCount,
        continuedFromId
      });
      const { story, remaining } = response.data;

      // Do not push continuations into the global Home feed. Only update feed for brand-new stories.
      if (!continuedFromId) {
        set({
          stories: [story, ...get().stories],
          loading: false,
          remaining: remaining ?? null
        });
      } else {
        set({ loading: false, remaining: remaining ?? null });
      }
      return story as Story;
    } catch (error) {
      console.error(error);
      set({ error: 'Unable to generate story', loading: false });
      return null;
    }
  },
  shareStory: async (id: string) => {
    try {
      const response = await api.post(`/stories/${id}/share`);
      return { shareUrl: response.data.shareUrl };
    } catch (error) {
      console.error(error);
      set({ error: 'Unable to create share link' });
      return null;
    }
  },
  updateStoryTitle: async (id: string, title: string) => {
    try {
      const response = await api.patch(`/stories/${id}/title`, { title });
      const updatedStory = response.data.story;
      
      // Update the story in the stories list
      set({
        stories: get().stories.map(s => s.id === id ? updatedStory : s)
      });
      
      return updatedStory as Story;
    } catch (error) {
      console.error(error);
      set({ error: 'Unable to update story title' });
      return null;
    }
  },
  /**
   * Toggle a story's favorite status (add or remove from favorites)
   * 
   * @param id - Story ID to toggle
   * @param isFavorite - CURRENT favorite status (if true, removes; if false, adds)
   * @returns true if successful, false if failed
   * 
   * Important: The isFavorite parameter is the CURRENT state, not the desired new state.
   * This allows the parent component to control the UX flow:
   * - If currently favorited (isFavorite=true) → Makes DELETE request to remove
   * - If not favorited (isFavorite=false) → Makes POST request to add
   * 
   * Side Effects:
   * - Updates store.favorites array based on action
   * - When adding: Prepends story to favorites (most recent first)
   * - When removing: Filters story out from favorites
   * 
   * Used by:
   * - LibraryScreen's handleToggleFavorite (calls this with current isFavorite state)
   */
  toggleFavorite: async (id: string, isFavorite: boolean) => {
    try {
      if (isFavorite) {
        // Remove from favorites
        await api.delete(`/stories/${id}/favorite`);
        set({
          favorites: get().favorites.filter(s => s.id !== id)
        });
      } else {
        // Add to favorites
        await api.post(`/stories/${id}/favorite`);
        // Find the story in the all stories list and add to favorites
        const story = get().stories.find(s => s.id === id);
        if (story) {
          set({
            favorites: [story, ...get().favorites]
          });
        }
      }
      return true;
    } catch (error) {
      console.error(error);
      set({ error: 'Unable to toggle favorite' });
      return false;
    }
  },
  checkFavoriteStatus: async (id: string) => {
    try {
      const response = await api.get(`/stories/${id}/favorite/status`);
      return response.data.isFavorite;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}));
