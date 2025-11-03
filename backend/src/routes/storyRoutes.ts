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
    res.json(story);
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

storyRouter.get(
  '/:id/favorite/status',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const favorite = isFavorite(req.user!.id, req.params.id);
    res.json({ isFavorite: favorite });
  })
);

storyRouter.get(
  '/favorites/list',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const stories = getFavoritesForUser(req.user!.id);
    res.json({ stories });
  })
);
