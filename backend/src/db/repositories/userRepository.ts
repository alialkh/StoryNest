import { randomUUID } from 'crypto';
import dayjs from 'dayjs';
import bcrypt from 'bcrypt';
import { db } from '../index.js';
import type { User, UserTier } from '../../types/user.js';

export interface CreateUserInput {
  email: string;
  password: string;
}

export const createUser = ({ email, password }: CreateUserInput): User => {
  const id = randomUUID();
  const passwordHash = bcrypt.hashSync(password, 10);
  const stmt = db.prepare(
    'INSERT INTO users (id, email, password_hash, tier) VALUES (?, ?, ?, ?)' 
  );
  stmt.run(id, email.toLowerCase(), passwordHash, 'FREE');
  return getUserById(id)!;
};

export const getUserByEmail = (email: string): User | null => {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  const user = stmt.get(email.toLowerCase()) as User | undefined;
  return user ?? null;
};

export const getUserById = (id: string): User | null => {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const user = stmt.get(id) as User | undefined;
  return user ?? null;
};

export const verifyPassword = (user: User, password: string): boolean => {
  return bcrypt.compareSync(password, user.password_hash);
};

export const updateTier = (userId: string, tier: UserTier, premiumDays?: number): User | null => {
  const premiumUntil =
    tier === 'PREMIUM'
      ? dayjs().add(premiumDays ?? 30, 'day').toISOString()
      : null;
  const stmt = db.prepare('UPDATE users SET tier = ?, premium_until = ? WHERE id = ?');
  stmt.run(tier, premiumUntil, userId);
  return getUserById(userId);
};

export const isPremiumActive = (user: User): boolean => {
  if (user.tier === 'PREMIUM') {
    if (!user.premium_until) return true;
    return dayjs(user.premium_until).isAfter(dayjs());
  }
  return false;
};
