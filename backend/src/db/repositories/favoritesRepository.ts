import { randomUUID } from 'crypto';
import { db } from '../index.js';
import type { Story } from '../../types/story.js';

/**
 * Favorites Repository
 * 
 * Manages user story favorites in the database
 * Table: story_favorites (id, user_id, story_id, created_at)
 * 
 * Key Constraints:
 * - UNIQUE(user_id, story_id): User can only favorite a story once
 * - Foreign keys with cascade delete: Removes favorites when story/user deleted
 * 
 * All functions are synchronous (better-sqlite3 synchronous API)
 */

/**
 * Add a story to user's favorites
 * @param userId - The user ID
 * @param storyId - The story ID to favorite
 * @returns true if added, false if already exists or error occurs
 * 
 * Note: Gracefully handles duplicate attempts (returns false for constraint violations)
 */
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

/**
 * Remove a story from user's favorites
 * @param userId - The user ID
 * @param storyId - The story ID to unfavorite
 * @returns true if removed, false if not found
 */
export const removeFavorite = (userId: string, storyId: string): boolean => {
  const stmt = db.prepare(
    `DELETE FROM story_favorites WHERE user_id = ? AND story_id = ?`
  );
  const result = stmt.run(userId, storyId);
  return result.changes > 0;
};

/**
 * Check if a story is favorited by user
 * @param userId - The user ID
 * @param storyId - The story ID to check
 * @returns true if favorited, false otherwise
 */
export const isFavorite = (userId: string, storyId: string): boolean => {
  const stmt = db.prepare(
    `SELECT 1 FROM story_favorites WHERE user_id = ? AND story_id = ? LIMIT 1`
  );
  const result = stmt.get(userId, storyId);
  return result !== undefined;
};

/**
 * Get all stories favorited by a user
 * @param userId - The user ID
 * @returns Array of Story objects, sorted by favorite date (newest first)
 * 
 * Uses JOIN to get full story details, not just favorite records
 */
export const getFavoritesForUser = (userId: string): Story[] => {
  const stmt = db.prepare(
    `SELECT s.* FROM stories s
     INNER JOIN story_favorites sf ON s.id = sf.story_id
     WHERE sf.user_id = ?
     ORDER BY sf.created_at DESC`
  );
  return stmt.all(userId) as Story[];
};

/**
 * Count how many stories a user has favorited
 * @param userId - The user ID
 * @returns Number of favorited stories
 */
export const getFavoriteCount = (userId: string): number => {
  const stmt = db.prepare(
    `SELECT COUNT(*) as count FROM story_favorites WHERE user_id = ?`
  );
  const result = stmt.get(userId) as { count: number } | undefined;
  return result?.count ?? 0;
};
