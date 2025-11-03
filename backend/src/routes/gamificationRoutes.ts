import { Router } from 'express';
import { authenticate, type AuthenticatedRequest } from '../middleware/authenticate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getUserStats, getUserAchievements } from '../db/repositories/gamificationRepository.js';

export const gamificationRouter = Router();

/**
 * GET /gamification/stats
 * Get current user's gamification stats (streaks, XP, story count)
 */
gamificationRouter.get(
  '/stats',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const stats = getUserStats(req.user!.id);
    res.json({ stats });
  })
);

/**
 * GET /gamification/achievements
 * Get current user's earned achievements
 */
gamificationRouter.get(
  '/achievements',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const achievements = getUserAchievements(req.user!.id);
    res.json({ achievements });
  })
);
