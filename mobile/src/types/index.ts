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
  genre?: string | null;
  tone?: string | null;
  continued_from_id?: string | null;
  word_count?: number;
  share_id?: string | null;
  created_at?: string;
}
