export type UserTier = 'FREE' | 'PREMIUM';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  tier: UserTier;
  premium_until: string | null;
  created_at: string;
  updated_at: string;
}
