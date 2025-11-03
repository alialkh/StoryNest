import { db } from '../index.js';
import { randomUUID } from 'crypto';

export interface PublicStory {
  id: string;
  story_id: string;
  user_id: string;
  title: string;
  excerpt: string;
  like_count: number;
  comment_count: number;
  shared_at: string;
  text?: string;
}

export interface PublicStoryLike {
  id: string;
  public_story_id: string;
  user_id: string;
  created_at: string;
}

export interface PublicStoryComment {
  id: string;
  public_story_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

// Sanitize input to prevent XSS attacks (remove HTML tags)
const sanitizeInput = (input: string, maxLength: number = 500): string => {
  const trimmed = input.trim().substring(0, maxLength);
  // Remove any HTML tags by replacing them with empty string
  return trimmed.replace(/<[^>]*>/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

// Check if user can share today (1 per day limit)
export const canShareStory = (userId: string): boolean => {
  const stmt = db.prepare(`
    SELECT shared_count, last_reset FROM daily_share_limit WHERE user_id = ?
  `);
  const result = stmt.get(userId) as any;

  if (!result) return true; // First time sharing

  const today = new Date().toISOString().split('T')[0];
  const lastReset = result.last_reset.split('T')[0];

  // If last reset was today, check if they've already shared
  if (lastReset === today) {
    return result.shared_count < 1;
  }

  // Day has changed, reset the counter
  return true;
};

// Share a story to public feed
export const shareStoryPublic = (
  storyId: string,
  userId: string,
  title: string,
  content: string
): PublicStory | null => {
  // Check share limit
  if (!canShareStory(userId)) {
    throw new Error('You can only share 1 story per day');
  }

  const id = randomUUID();
  const excerpt = sanitizeInput(content.substring(0, 200));
  const sanitizedTitle = sanitizeInput(title);

  try {
    const insertStmt = db.prepare(`
      INSERT INTO public_stories (id, story_id, user_id, title, excerpt)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertStmt.run(id, storyId, userId, sanitizedTitle, excerpt);

    // Update daily share limit
    const today = new Date().toISOString();
    const updateLimitStmt = db.prepare(`
      INSERT INTO daily_share_limit (user_id, shared_count, last_reset)
      VALUES (?, 1, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        shared_count = CASE 
          WHEN date(last_reset) = date(?) THEN shared_count + 1
          ELSE 1
        END,
        last_reset = CASE
          WHEN date(last_reset) = date(?) THEN last_reset
          ELSE ?
        END
    `);
    updateLimitStmt.run(userId, today, today, today, today);

    const getStmt = db.prepare(`
      SELECT 
        ps.id,
        ps.story_id,
        ps.user_id,
        ps.title,
        ps.excerpt,
        s.content as text,
        ps.like_count,
        ps.comment_count,
        ps.shared_at
      FROM public_stories ps
      LEFT JOIN stories s ON ps.story_id = s.id
      WHERE ps.id = ?
    `);
    return getStmt.get(id) as PublicStory;
  } catch (err) {
    console.error('Error sharing story:', err);
    return null;
  }
};

// Get public feed (paginated)
export const getPublicFeed = (limit: number = 20, offset: number = 0): PublicStory[] => {
  const stmt = db.prepare(`
    SELECT 
      ps.id,
      ps.story_id,
      ps.user_id,
      ps.title,
      ps.excerpt,
      s.content as text,
      ps.like_count,
      ps.comment_count,
      ps.shared_at
    FROM public_stories ps
    LEFT JOIN stories s ON ps.story_id = s.id
    ORDER BY ps.shared_at DESC
    LIMIT ? OFFSET ?
  `);
  return stmt.all(limit, offset) as PublicStory[];
};

// Like a public story
export const likeStory = (publicStoryId: string, userId: string): boolean => {
  try {
    const id = randomUUID();
    const insertStmt = db.prepare(`
      INSERT INTO public_story_likes (id, public_story_id, user_id)
      VALUES (?, ?, ?)
    `);
    insertStmt.run(id, publicStoryId, userId);

    // Increment like count
    const updateStmt = db.prepare(`
      UPDATE public_stories SET like_count = like_count + 1 WHERE id = ?
    `);
    updateStmt.run(publicStoryId);

    return true;
  } catch (err) {
    // Likely a duplicate like, which is fine
    return false;
  }
};

// Unlike a story
export const unlikeStory = (publicStoryId: string, userId: string): boolean => {
  try {
    const deleteStmt = db.prepare(`
      DELETE FROM public_story_likes WHERE public_story_id = ? AND user_id = ?
    `);
    const result = deleteStmt.run(publicStoryId, userId);

    if (result.changes > 0) {
      // Decrement like count
      const updateStmt = db.prepare(`
        UPDATE public_stories SET like_count = MAX(0, like_count - 1) WHERE id = ?
      `);
      updateStmt.run(publicStoryId);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error unliking story:', err);
    return false;
  }
};

// Check if user has liked a story
export const hasUserLiked = (publicStoryId: string, userId: string): boolean => {
  const stmt = db.prepare(`
    SELECT 1 FROM public_story_likes WHERE public_story_id = ? AND user_id = ? LIMIT 1
  `);
  return !!stmt.get(publicStoryId, userId);
};

// Add comment to story
export const addComment = (
  publicStoryId: string,
  userId: string,
  content: string
): PublicStoryComment | null => {
  const sanitizedContent = sanitizeInput(content, 500);

  if (!sanitizedContent) {
    throw new Error('Comment cannot be empty');
  }

  try {
    const id = randomUUID();
    const insertStmt = db.prepare(`
      INSERT INTO public_story_comments (id, public_story_id, user_id, content)
      VALUES (?, ?, ?, ?)
    `);
    insertStmt.run(id, publicStoryId, userId, sanitizedContent);

    // Increment comment count
    const updateStmt = db.prepare(`
      UPDATE public_stories SET comment_count = comment_count + 1 WHERE id = ?
    `);
    updateStmt.run(publicStoryId);

    const getStmt = db.prepare('SELECT * FROM public_story_comments WHERE id = ?');
    return getStmt.get(id) as PublicStoryComment;
  } catch (err) {
    console.error('Error adding comment:', err);
    return null;
  }
};

// Get comments for a story
export const getStoryComments = (publicStoryId: string, limit: number = 20): PublicStoryComment[] => {
  const stmt = db.prepare(`
    SELECT * FROM public_story_comments
    WHERE public_story_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `);
  return stmt.all(publicStoryId, limit) as PublicStoryComment[];
};

// Get theme unlocks for user based on XP
export const getThemeUnlocks = (userXp: number) => {
  const stmt = db.prepare(`
    SELECT id, theme_id, theme_name, xp_threshold, 
           (? >= xp_threshold) as unlocked
    FROM theme_unlocks
    ORDER BY xp_threshold ASC
  `);
  return stmt.all(userXp) as any[];
};

// Get user's login streak
export const getLoginStreak = (userId: string) => {
  const stmt = db.prepare('SELECT * FROM login_streaks WHERE user_id = ?');
  const result = stmt.get(userId) as any;
  return result || { user_id: userId, current_streak: 0, longest_streak: 0, last_login: null };
};

// Update login streak
export const updateLoginStreak = (userId: string): number => {
  const today = new Date().toISOString().split('T')[0];
  const streak = getLoginStreak(userId);

  if (!streak.last_login) {
    // First login
    const insertStmt = db.prepare(`
      INSERT INTO login_streaks (user_id, current_streak, longest_streak, last_login)
      VALUES (?, 1, 1, ?)
    `);
    insertStmt.run(userId, today);
    return 1;
  }

  const lastLoginDate = streak.last_login.split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (lastLoginDate === today) {
    // Already logged in today
    return streak.current_streak;
  }

  if (lastLoginDate === yesterday) {
    // Streak continues
    const newStreak = streak.current_streak + 1;
    const updateStmt = db.prepare(`
      UPDATE login_streaks 
      SET current_streak = ?, longest_streak = MAX(longest_streak, ?), last_login = ?
      WHERE user_id = ?
    `);
    updateStmt.run(newStreak, newStreak, today, userId);
    return newStreak;
  }

  // Streak broken
  const updateStmt = db.prepare(`
    UPDATE login_streaks 
    SET current_streak = 1, last_login = ?
    WHERE user_id = ?
  `);
  updateStmt.run(today, userId);
  return 1;
};
