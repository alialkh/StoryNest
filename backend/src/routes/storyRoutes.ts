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

export const storyRouter = Router();

storyRouter.post(
  '/generate',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { prompt, genre, tone, continuedFromId } = req.body;
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }
    const result = await generateStory({
      userId: req.user!.id,
      prompt,
      genre,
      tone,
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
