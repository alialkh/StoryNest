import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as publicFeedRepository from '../db/repositories/publicFeedRepository.js';
import { getStoryById } from '../db/repositories/storyRepository.js';
import { getUserById } from '../db/repositories/userRepository.js';
import { awardXp, getUserStats } from '../db/repositories/gamificationRepository.js';

const router = Router();

// Get public feed (no auth required)
router.get(
  '/feed',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const limit = Math.min(parseInt(req.query?.limit as string) || 20, 100);
    const offset = parseInt(req.query?.offset as string) || 0;

    const stories = publicFeedRepository.getPublicFeed(limit, offset);
    res.json(stories);
  })
);

// Share story to public feed (premium only)
router.post(
  '/feed/share',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { storyId } = req.body as { storyId?: string };
    const userId = req.user!.id;

    if (!storyId) {
      res.status(400).json({ error: 'storyId required' });
      return;
    }

    // Check if premium
    const user = getUserById(userId);
    if (!user || user.tier !== 'PREMIUM') {
      res.status(403).json({ error: 'Premium membership required' });
      return;
    }

    // Verify story ownership
    const story = getStoryById(storyId);
    if (!story || story.user_id !== userId) {
      res.status(403).json({ error: 'Cannot share story you do not own' });
      return;
    }

    // Share to public feed
    try {
      const publicStory = publicFeedRepository.shareStoryPublic(
        storyId,
        userId,
        story.title || 'Untitled',
        story.content
      );

      if (!publicStory) {
        res.status(400).json({ error: 'Failed to share story' });
        return;
      }

      // Award XP for sharing
      const xpAmount = 50;
      awardXp(userId, xpAmount);

      res.json({ publicStory, xpGained: xpAmount });
    } catch (error: any) {
      if (error.message.includes('daily')) {
        res.status(429).json({ error: error.message });
      } else {
        throw error;
      }
    }
  })
);

// Like a story
router.post(
  '/feed/:publicStoryId/like',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { publicStoryId } = req.params;
    const userId = req.user!.id;

    const success = publicFeedRepository.likeStory(publicStoryId, userId);
    if (success) {
      res.json({ liked: true });
    } else {
      // Already liked, so unlike instead
      const unlikeSuccess = publicFeedRepository.unlikeStory(publicStoryId, userId);
      res.json({ liked: !unlikeSuccess });
    }
  })
);

// Unlike a story
router.delete(
  '/feed/:publicStoryId/like',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { publicStoryId } = req.params;
    const userId = req.user!.id;

    const success = publicFeedRepository.unlikeStory(publicStoryId, userId);
    res.json({ unliked: success });
  })
);

// Check if user has liked a story
router.get(
  '/feed/:publicStoryId/liked',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { publicStoryId } = req.params;
    const userId = req.user!.id;

    const liked = publicFeedRepository.hasUserLiked(publicStoryId, userId);
    res.json({ liked });
  })
);

// Add comment to story
router.post(
  '/feed/:publicStoryId/comment',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { publicStoryId } = req.params;
    const { content } = req.body as { content?: string };
    const userId = req.user!.id;

    if (!content) {
      res.status(400).json({ error: 'Comment content required' });
      return;
    }

    try {
      const comment = publicFeedRepository.addComment(publicStoryId, userId, content);
      if (!comment) {
        res.status(400).json({ error: 'Failed to add comment' });
        return;
      }
      res.json(comment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  })
);

// Get comments for a story
router.get(
  '/feed/:publicStoryId/comments',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { publicStoryId } = req.params;
    const limit = Math.min(parseInt(req.query?.limit as string) || 20, 100);

    const comments = publicFeedRepository.getStoryComments(publicStoryId, limit);
    res.json(comments);
  })
);

// Delete own comment
router.delete(
  '/feed/comment/:commentId',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { commentId } = req.params;
    const userId = req.user!.id;

    // TODO: Implement comment deletion (need commentRepository)
    res.status(501).json({ error: 'Not implemented' });
  })
);

// Get theme unlocks based on user's current XP
router.get(
  '/themes/unlocks',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    
    // Get user's stats to retrieve total XP
    const stats = getUserStats(userId);

    // Get theme unlocks based on XP
    const unlockedThemes = publicFeedRepository.getThemeUnlocks(stats.total_xp);
    res.json(unlockedThemes);
  })
);

export default router;
