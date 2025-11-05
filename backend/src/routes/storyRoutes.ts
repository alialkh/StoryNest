import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/authenticate.js';
import {
  generateStory,
  listStories,
  shareStory,
  getSharedStory,
  getRemainingStories
} from '../services/storyService.js';
import { updateStoryTitle, getStoryById } from '../db/repositories/storyRepository.js';
import { addFavorite, removeFavorite, isFavorite, getFavoritesForUser } from '../db/repositories/favoritesRepository.js';
import followsRepository from '../db/repositories/followsRepository.js';

/**
 * Story Routes
 * 
 * Base URL: /stories
 * Authentication: Most endpoints require JWT token
 * 
 * Endpoints:
 * - POST /generate: Create new story
 * - GET /: List all user's stories
 * - POST /:id/share: Create public share link
 * - GET /shared/:shareId: Get publicly shared story
 * - GET /:id: Get story by ID
 * - PATCH /:id/title: Update story title
 * - POST /:id/favorite: Add story to favorites
 * - DELETE /:id/favorite: Remove story from favorites
 * - GET /:id/favorite/status: Check if story is favorited
 * - GET /favorites/list: Get all favorited stories
 */
export const storyRouter = Router();

storyRouter.post(
  '/generate',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { prompt, genre, tone, archetype, continuedFromId } = req.body;
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }
    const result = await generateStory({
      userId: req.user!.id,
      prompt,
      genre,
      tone,
      archetype,
      continuedFromId
    });
    res.status(201).json(result);
  })
);

storyRouter.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const stories = listStories(req.user!.id);
    const remaining = getRemainingStories(req.user!.id);
    res.json({ stories, remaining });
  })
);

storyRouter.post(
  '/:id/share',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const story = shareStory(req.params.id);
    res.json({ story, shareUrl: `${process.env.APP_URL ?? 'http://localhost:3000'}/stories/${story.share_id}` });
  })
);

storyRouter.get(
  '/shared/:shareId',
  asyncHandler(async (req, res) => {
    const story = getSharedStory(req.params.shareId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    res.json({ story });
  })
);

storyRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const story = getStoryById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    res.json({ story });
  })
);

storyRouter.patch(
  '/:id/title',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { title } = req.body;
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ message: 'Title is required and must be a string' });
    }
    const story = updateStoryTitle(req.params.id, title.trim());
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    res.json({ story });
  })
);

/**
 * POST /stories/:id/favorite
 * Add a story to user's favorites
 * 
 * @auth Required (JWT token)
 * @param id - Story ID to favorite
 * @returns 201 { success: true } on success
 * @returns 400 if story already favorited
 * @returns 401 if not authenticated
 * 
 * Uses UNIQUE constraint on (user_id, story_id) to prevent duplicates
 */
storyRouter.post(
  '/:id/favorite',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const success = addFavorite(req.user!.id, req.params.id);
    if (!success) {
      return res.status(400).json({ message: 'Story is already favorited' });
    }
    res.status(201).json({ success: true });
  })
);

/**
 * DELETE /stories/:id/favorite
 * Remove a story from user's favorites
 * 
 * @auth Required (JWT token)
 * @param id - Story ID to unfavorite
 * @returns 200 { success: true } on success
 * @returns 404 if story not in favorites
 * @returns 401 if not authenticated
 * 
 * Idempotent: Safe to call multiple times
 */
storyRouter.delete(
  '/:id/favorite',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const success = removeFavorite(req.user!.id, req.params.id);
    if (!success) {
      return res.status(404).json({ message: 'Story is not favorited' });
    }
    res.json({ success: true });
  })
);

/**
 * GET /stories/:id/favorite/status
 * Check if a story is favorited by the current user
 * 
 * @auth Required (JWT token)
 * @param id - Story ID to check
 * @returns 200 { isFavorite: boolean }
 * @returns 401 if not authenticated
 * 
 * Used to display correct heart icon state when opening a story
 */
storyRouter.get(
  '/:id/favorite/status',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const favorite = isFavorite(req.user!.id, req.params.id);
    res.json({ isFavorite: favorite });
  })
);

/**
 * GET /stories/favorites/list
 * Get all stories favorited by current user
 * 
 * @auth Required (JWT token)
 * @returns 200 { stories: Story[] } - Sorted by favorite date (newest first)
 * @returns 401 if not authenticated
 * 
 * NOTE: Route must be registered AFTER /:id routes to avoid conflict
 * (/:id/favorite/status comes before /favorites/list in URL matching)
 * 
 * Used by LibraryScreen to populate Favorites tab
 */
storyRouter.get(
  '/favorites/list',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const stories = getFavoritesForUser(req.user!.id);
    res.json({ stories });
  })
);

/**
 * POST /stories/users/:userId/follow
 * Follow a user to see their shared stories
 * 
 * @auth Required (JWT token)
 * @param userId - User ID to follow
 * @returns 201 { success: true, following: true }
 * @returns 400 if trying to follow self or already following
 * @returns 401 if not authenticated
 * @returns 404 if user doesn't exist
 */
storyRouter.post(
  '/users/:userId/follow',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const targetUserId = req.params.userId;
    const currentUserId = req.user!.id;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    try {
      followsRepository.addFollow(currentUserId, targetUserId);
      res.status(201).json({ success: true, following: true });
    } catch (error: any) {
      if (error.message.includes('already following')) {
        return res.status(400).json({ message: 'Already following this user' });
      }
      throw error;
    }
  })
);

/**
 * DELETE /stories/users/:userId/follow
 * Unfollow a user
 * 
 * @auth Required (JWT token)
 * @param userId - User ID to unfollow
 * @returns 200 { success: true, following: false }
 * @returns 401 if not authenticated
 */
storyRouter.delete(
  '/users/:userId/follow',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const success = followsRepository.removeFollow(req.user!.id, req.params.userId);
    res.json({ success, following: false });
  })
);

/**
 * GET /stories/users/:userId/following
 * Get list of users that a user is following
 * 
 * @auth Optional (JWT token)
 * @param userId - User ID
 * @query limit - Max number of follows to return (default: 50)
 * @query offset - Number of follows to skip (default: 0)
 * @returns 200 { follows: Follow[] }
 */
storyRouter.get(
  '/users/:userId/following',
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const follows = followsRepository.getFollowing(req.params.userId, limit, offset);
    res.json({ follows });
  })
);

/**
 * GET /stories/users/:userId/followers
 * Get list of users following a user
 * 
 * @auth Optional (JWT token)
 * @param userId - User ID
 * @query limit - Max number of followers to return (default: 50)
 * @query offset - Number of followers to skip (default: 0)
 * @returns 200 { follows: Follow[] }
 */
storyRouter.get(
  '/users/:userId/followers',
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const follows = followsRepository.getFollowers(req.params.userId, limit, offset);
    res.json({ follows });
  })
);

/**
 * GET /stories/users/:userId/follow-status
 * Check if current user is following a user
 * 
 * @auth Required (JWT token)
 * @param userId - User ID to check
 * @returns 200 { isFollowing: boolean }
 * @returns 401 if not authenticated
 */
storyRouter.get(
  '/users/:userId/follow-status',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const isFollowing = followsRepository.isFollowing(req.user!.id, req.params.userId);
    res.json({ isFollowing });
  })
);

/**
 * GET /stories/users/:userId/stats
 * Get follow statistics for a user
 * 
 * @auth Optional (JWT token)
 * @param userId - User ID
 * @returns 200 { following_count: number, followers_count: number }
 */
storyRouter.get(
  '/users/:userId/stats',
  asyncHandler(async (req, res) => {
    const stats = followsRepository.getFollowStats(req.params.userId);
    res.json(stats);
  })
);

