import jwt from 'jsonwebtoken';
import { z } from 'zod';
import {
  createUser,
  getUserByEmail,
  verifyPassword
} from '../db/repositories/userRepository.js';
import { awardXp } from '../db/repositories/gamificationRepository.js';
import { updateLoginStreak } from '../db/repositories/publicFeedRepository.js';
import type { User } from '../types/user.js';
import { env } from '../config/env.js';

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const registerUser = (payload: unknown): User => {
  const data = authSchema.parse(payload);
  const existing = getUserByEmail(data.email);
  if (existing) {
    throw new Error('Email already registered');
  }
  return createUser(data);
};

export const authenticateUser = (payload: unknown): { user: User; token: string } => {
  const data = authSchema.parse(payload);
  const user = getUserByEmail(data.email);
  if (!user || !verifyPassword(user, data.password)) {
    throw new Error('Invalid credentials');
  }

  // Update login streak and award XP
  const streakDays = updateLoginStreak(user.id);
  const xpBonus = Math.min(streakDays * 5, 50); // 5 XP per streak day, max 50
  awardXp(user.id, xpBonus);

  const token = jwt.sign({ sub: user.id }, env.jwtSecret, { expiresIn: '7d' });
  return { user, token };
};

export const issueToken = (user: User): string => {
  return jwt.sign({ sub: user.id }, env.jwtSecret, { expiresIn: '7d' });
};

export const verifyToken = (token: string): { userId: string } => {
  const decoded = jwt.verify(token, env.jwtSecret) as { sub: string };
  return { userId: decoded.sub };
};
