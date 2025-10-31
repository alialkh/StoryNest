import dayjs from 'dayjs';
import {
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual
} from 'crypto';
import { db } from '../index.js';
import type { User, UserTier } from '../../types/user.js';

export interface CreateUserInput {
  email: string;
  password: string;
}

const hashPassword = (password: string): string => {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, Buffer.from(salt, 'hex'), 64).toString('hex');
  return `s:${salt}:${derived}`;
};

const verifyPasswordHash = (stored: string, password: string): boolean => {
  if (!stored.startsWith('s:')) {
    return false;
  }
  const [, saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) {
    return false;
  }
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return timingSafeEqual(expected, actual);
};

export const createUser = ({ email, password }: CreateUserInput): User => {
  const id = randomUUID();
  const passwordHash = hashPassword(password);
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

export const verifyPassword = (user: User, password: string): boolean =>
  verifyPasswordHash(user.password_hash, password);

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
