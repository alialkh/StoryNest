export type SubscriptionTier = 'FREE' | 'PREMIUM';

export interface AuthUser {
  id: string;
  email: string;
  tier: SubscriptionTier;
}

export interface Story {
  id: string;
  prompt: string;
  content: string;
  title?: string | null;
  genre?: string | null;
  tone?: string | null;
  continued_from_id?: string | null;
  word_count?: number;
  share_id?: string | null;
  created_at?: string;
}

export interface UserStats {
  user_id: string;
  total_stories: number;
  current_streak: number;
  longest_streak: number;
  last_story_date: string | null;
  total_xp: number;
  created_at: string;
  updated_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_type: string;
  title: string;
  description: string | null;
  xp_reward: number;
  earned_at: string;
}

