import notificationsRepository from '../db/repositories/notificationsRepository.js';
import followsRepository from '../db/repositories/followsRepository.js';
import { getUserById } from '../db/repositories/userRepository.js';

/**
 * Notification Service
 * Handles creation and delivery of push notifications for user events
 */

/**
 * Notify user when someone likes their shared story
 * Creates a notification but only if:
 * 1. The liker is not the story owner
 * 2. The story owner has a valid email for push notifications
 * 
 * @param publicStoryId - ID of the public story that was liked
 * @param storyOwnerId - ID of the user who owns the story
 * @param likerId - ID of the user who liked the story
 * @param storyTitle - Title of the story for notification body
 * @returns true if notification was created, false otherwise
 */
export const notifyStoryLike = (
  publicStoryId: string,
  storyOwnerId: string,
  likerId: string,
  storyTitle: string
): boolean => {
  // Don't notify if user likes their own story
  if (storyOwnerId === likerId) {
    return false;
  }

  try {
    const liker = getUserById(likerId);
    if (!liker) {
      return false;
    }

    const title = '❤️ Story Liked';
    const body = `${liker.email.split('@')[0]} liked "${storyTitle}"`;

    notificationsRepository.createNotification(
      storyOwnerId,
      title,
      body,
      {
        type: 'story_like',
        public_story_id: publicStoryId,
        actor_id: likerId,
      }
    );

    return true;
  } catch (error) {
    console.error('Error creating like notification:', error);
    return false;
  }
};

/**
 * Notify user when someone starts following them
 * 
 * @param followedUserId - ID of the user being followed
 * @param followerUserId - ID of the user who started following
 * @returns true if notification was created, false otherwise
 */
export const notifyNewFollower = (
  followedUserId: string,
  followerUserId: string
): boolean => {
  try {
    const follower = getUserById(followerUserId);
    if (!follower) {
      return false;
    }

    const title = '👥 New Follower';
    const body = `${follower.email.split('@')[0]} started following you`;

    notificationsRepository.createNotification(
      followedUserId,
      title,
      body,
      {
        type: 'new_follower',
        actor_id: followerUserId,
      }
    );

    return true;
  } catch (error) {
    console.error('Error creating follower notification:', error);
    return false;
  }
};

/**
 * Get unread notification count for user (for badge display)
 * 
 * @param userId - ID of the user
 * @returns number of unread notifications
 */
export const getUnreadCount = (userId: string): number => {
  try {
    return notificationsRepository.getUnreadCount(userId);
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

/**
 * Get recent unread notifications for user
 * 
 * @param userId - ID of the user
 * @param limit - Maximum number of notifications to return
 * @returns Array of unread notifications
 */
export const getRecentNotifications = (userId: string, limit = 20) => {
  try {
    return notificationsRepository.getUnreadNotifications(userId, limit);
  } catch (error) {
    console.error('Error getting recent notifications:', error);
    return [];
  }
};

/**
 * Mark notification as read (when user views it)
 * 
 * @param notificationId - ID of the notification
 * @returns true if successful
 */
export const readNotification = (notificationId: string): boolean => {
  try {
    return notificationsRepository.markAsRead(notificationId);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

/**
 * Mark all notifications as read for user
 * 
 * @param userId - ID of the user
 * @returns number of notifications marked as read
 */
export const readAllNotifications = (userId: string): number => {
  try {
    return notificationsRepository.markAllAsRead(userId);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return 0;
  }
};
