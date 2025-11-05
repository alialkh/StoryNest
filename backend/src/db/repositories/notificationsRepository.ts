import { db } from '../index';
import crypto from 'crypto';

export interface PushNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  data: string | null;
  read: boolean;
  created_at: string;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  auth_key: string;
  p256dh_key: string;
  created_at: string;
}

class NotificationsRepository {
  /**
   * Create a new push notification for a user
   */
  createNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ): PushNotification {
    const id = crypto.randomUUID();
    const stmt = db.prepare(`
      INSERT INTO push_notifications (id, user_id, title, body, data)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      userId,
      title,
      body,
      data ? JSON.stringify(data) : null
    );

    return {
      id,
      user_id: userId,
      title,
      body,
      data: data ? JSON.stringify(data) : null,
      read: false,
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Get unread notifications for a user
   */
  getUnreadNotifications(
    userId: string,
    limit = 50
  ): PushNotification[] {
    const stmt = db.prepare(`
      SELECT * FROM push_notifications
      WHERE user_id = ? AND read = 0
      ORDER BY created_at DESC
      LIMIT ?
    `);

    return stmt.all(userId, limit) as PushNotification[];
  }

  /**
   * Get all notifications for a user
   */
  getNotifications(
    userId: string,
    limit = 50,
    offset = 0
  ): PushNotification[] {
    const stmt = db.prepare(`
      SELECT * FROM push_notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);

    return stmt.all(userId, limit, offset) as PushNotification[];
  }

  /**
   * Mark a notification as read
   */
  markAsRead(notificationId: string): boolean {
    const stmt = db.prepare(`
      UPDATE push_notifications
      SET read = 1
      WHERE id = ?
    `);

    const result = stmt.run(notificationId);
    return (result.changes ?? 0) > 0;
  }

  /**
   * Mark all notifications as read for a user
   */
  markAllAsRead(userId: string): number {
    const stmt = db.prepare(`
      UPDATE push_notifications
      SET read = 1
      WHERE user_id = ? AND read = 0
    `);

    const result = stmt.run(userId);
    return result.changes ?? 0;
  }

  /**
   * Delete a notification
   */
  deleteNotification(notificationId: string): boolean {
    const stmt = db.prepare(`
      DELETE FROM push_notifications
      WHERE id = ?
    `);

    const result = stmt.run(notificationId);
    return (result.changes ?? 0) > 0;
  }

  /**
   * Get unread notification count for a user
   */
  getUnreadCount(userId: string): number {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM push_notifications
      WHERE user_id = ? AND read = 0
    `);

    const result = stmt.get(userId) as any;
    return result.count ?? 0;
  }

  /**
   * Subscribe a user to push notifications
   */
  addSubscription(
    userId: string,
    endpoint: string,
    authKey: string,
    p256dhKey: string
  ): PushSubscription {
    const id = crypto.randomUUID();
    const stmt = db.prepare(`
      INSERT INTO push_subscriptions (id, user_id, endpoint, auth_key, p256dh_key)
      VALUES (?, ?, ?, ?, ?)
    `);

    try {
      stmt.run(id, userId, endpoint, authKey, p256dhKey);
      return {
        id,
        user_id: userId,
        endpoint,
        auth_key: authKey,
        p256dh_key: p256dhKey,
        created_at: new Date().toISOString(),
      };
    } catch (error: any) {
      if (error.message.includes('UNIQUE')) {
        // Already subscribed with this endpoint, update instead
        const updateStmt = db.prepare(`
          UPDATE push_subscriptions
          SET auth_key = ?, p256dh_key = ?
          WHERE endpoint = ?
        `);
        updateStmt.run(authKey, p256dhKey, endpoint);

        const getStmt = db.prepare(`
          SELECT * FROM push_subscriptions WHERE endpoint = ?
        `);
        return getStmt.get(endpoint) as PushSubscription;
      }
      throw error;
    }
  }

  /**
   * Get all subscriptions for a user
   */
  getSubscriptions(userId: string): PushSubscription[] {
    const stmt = db.prepare(`
      SELECT * FROM push_subscriptions
      WHERE user_id = ?
    `);

    return stmt.all(userId) as PushSubscription[];
  }

  /**
   * Remove a subscription
   */
  removeSubscription(endpoint: string): boolean {
    const stmt = db.prepare(`
      DELETE FROM push_subscriptions
      WHERE endpoint = ?
    `);

    const result = stmt.run(endpoint);
    return (result.changes ?? 0) > 0;
  }
}

export default new NotificationsRepository();
