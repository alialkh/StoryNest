import { api } from './api';

export interface PublicStory {
  id: string;
  story_id: string;
  user_id: string;
  title: string;
  excerpt: string;
  text?: string;
  like_count: number;
  comment_count: number;
  shared_at: string;
}

export interface PublicStoryComment {
  id: string;
  public_story_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

// Get public feed
export const getPublicFeed = async (limit: number = 20, offset: number = 0): Promise<PublicStory[]> => {
  const response = await api.get('/feed/feed', {
    params: { limit, offset }
  });
  return response.data;
};

// Share story to public feed
export const shareStoryToPublic = async (storyId: string): Promise<{ publicStory: PublicStory; xpGained: number }> => {
  const response = await api.post('/feed/feed/share', { storyId });
  return response.data;
};

// Like a public story
export const likeStory = async (publicStoryId: string): Promise<boolean> => {
  const response = await api.post(`/feed/feed/${publicStoryId}/like`);
  return response.data.liked;
};

// Unlike a story
export const unlikeStory = async (publicStoryId: string): Promise<boolean> => {
  const response = await api.delete(`/feed/feed/${publicStoryId}/like`);
  return response.data.unliked;
};

// Check if user has liked a story
export const hasUserLiked = async (publicStoryId: string): Promise<boolean> => {
  const response = await api.get(`/feed/feed/${publicStoryId}/liked`);
  return response.data.liked;
};

// Add comment to story
export const addComment = async (publicStoryId: string, content: string): Promise<PublicStoryComment> => {
  const response = await api.post(`/feed/feed/${publicStoryId}/comment`, { content });
  return response.data;
};

// Get comments for a story
export const getStoryComments = async (publicStoryId: string, limit: number = 20): Promise<PublicStoryComment[]> => {
  const response = await api.get(`/feed/feed/${publicStoryId}/comments`, {
    params: { limit }
  });
  return response.data;
};
