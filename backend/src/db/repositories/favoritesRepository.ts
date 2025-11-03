import { randomUUID } from 'crypto';
import { db } from '../index.js';
import type { Story } from '../../types/story.js';

export const addFavorite = (userId: string, storyId: string): boolean => {
  try {
    const stmt = db.prepare(
      `INSERT INTO story_favorites (id, user_id, story_id)
       VALUES (?, ?, ?)`
    );
    stmt.run(randomUUID(), userId, storyId);
    return true;
  } catch (err) {
    // Likely a constraint violation (already favorited)
    return false;
  }
};

export const removeFavorite = (userId: string, storyId: string): boolean => {
  const stmt = db.prepare(
    `DELETE FROM story_favorites WHERE user_id = ? AND story_id = ?`
  );
  const result = stmt.run(userId, storyId);
  return result.changes > 0;
};

export const isFavorite = (userId: string, storyId: string): boolean => {
  const stmt = db.prepare(
    `SELECT 1 FROM story_favorites WHERE user_id = ? AND story_id = ? LIMIT 1`
  );
  const result = stmt.get(userId, storyId);
  return result !== undefined;
};

export const getFavoritesForUser = (userId: string): Story[] => {
  const stmt = db.prepare(
    `SELECT s.* FROM stories s
     INNER JOIN story_favorites sf ON s.id = sf.story_id
     WHERE sf.user_id = ?
     ORDER BY sf.created_at DESC`
  );
  return stmt.all(userId) as Story[];
};

export const getFavoriteCount = (userId: string): number => {
  const stmt = db.prepare(
    `SELECT COUNT(*) as count FROM story_favorites WHERE user_id = ?`
  );
  const result = stmt.get(userId) as { count: number } | undefined;
  return result?.count ?? 0;
};
