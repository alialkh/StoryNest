import { db } from '../index';
import crypto from 'crypto';

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

class FollowsRepository {
  /**
   * Add a follow relationship between two users
   * @throws Error if trying to follow self or already following
   */
  addFollow(followerId: string, followingId: string): Follow {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    const id = crypto.randomUUID();
    const stmt = db.prepare(`
      INSERT INTO user_follows (id, follower_id, following_id)
      VALUES (?, ?, ?)
    `);

    try {
      stmt.run(id, followerId, followingId);
      return {
        id,
        follower_id: followerId,
        following_id: followingId,
        created_at: new Date().toISOString(),
      };
    } catch (error: any) {
      if (error.message.includes('UNIQUE')) {
        throw new Error('Already following this user');
      }
      throw error;
    }
  }

  /**
   * Remove a follow relationship between two users
   */
  removeFollow(followerId: string, followingId: string): boolean {
    const stmt = db.prepare(`
      DELETE FROM user_follows
      WHERE follower_id = ? AND following_id = ?
    `);

    const result = stmt.run(followerId, followingId);
    return (result.changes ?? 0) > 0;
  }

  /**
   * Check if a user is following another user
   */
  isFollowing(followerId: string, followingId: string): boolean {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM user_follows
      WHERE follower_id = ? AND following_id = ?
    `);

    const result = stmt.get(followerId, followingId) as any;
    return result.count > 0;
  }

  /**
   * Get list of users that a user is following
   */
  getFollowing(userId: string, limit = 50, offset = 0): Follow[] {
    const stmt = db.prepare(`
      SELECT * FROM user_follows
      WHERE follower_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);

    return stmt.all(userId, limit, offset) as Follow[];
  }

  /**
   * Get list of users following a user
   */
  getFollowers(userId: string, limit = 50, offset = 0): Follow[] {
    const stmt = db.prepare(`
      SELECT * FROM user_follows
      WHERE following_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);

    return stmt.all(userId, limit, offset) as Follow[];
  }

  /**
   * Get follow stats for a user
   */
  getFollowStats(userId: string): {
    following_count: number;
    followers_count: number;
  } {
    const followingStmt = db.prepare(`
      SELECT COUNT(*) as count FROM user_follows WHERE follower_id = ?
    `);
    const followersStmt = db.prepare(`
      SELECT COUNT(*) as count FROM user_follows WHERE following_id = ?
    `);

    const following = (followingStmt.get(userId) as any).count;
    const followers = (followersStmt.get(userId) as any).count;

    return {
      following_count: following,
      followers_count: followers,
    };
  }

  /**
   * Get IDs of users that a user is following (for query optimization)
   */
  getFollowingIds(userId: string): string[] {
    const stmt = db.prepare(`
      SELECT following_id FROM user_follows
      WHERE follower_id = ?
    `);

    const results = stmt.all(userId) as any[];
    return results.map((r) => r.following_id);
  }
}

export default new FollowsRepository();
