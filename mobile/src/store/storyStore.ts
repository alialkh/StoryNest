import create from 'zustand';
import { api } from '../services/api';
import type { Story } from '../types';

interface StoryState {
  stories: Story[];
  favorites: Story[];
  loading: boolean;
  error: string | null;
  remaining: number | null;
  fetchStories: () => Promise<void>;
  fetchFavorites: () => Promise<void>;
  generateStory: (payload: { prompt: string; genre?: string | null; tone?: string | null; archetype?: string | null; continuedFromId?: string | null }) => Promise<Story | null>;
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
  fetchFavorites: async () => {
    try {
      const response = await api.get('/stories/favorites/list');
      set({ favorites: response.data.stories });
    } catch (error) {
      console.error(error);
      set({ error: 'Unable to load favorites' });
    }
  },
  generateStory: async ({ prompt, genre, tone, archetype, continuedFromId }) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/stories/generate', {
        prompt,
        genre,
        tone,
        archetype,
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
