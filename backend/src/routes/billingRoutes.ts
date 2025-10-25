import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/authenticate.js';
import { activatePremium, createCheckoutSession } from '../services/billingService.js';

export const billingRouter = Router();

billingRouter.post(
  '/checkout',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const session = await createCheckoutSession(req.user!.id);
    res.json(session);
  })
);

billingRouter.post(
  '/webhook/mock-upgrade',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = activatePremium(req.user!.id);
    res.json({ user: { id: user.id, email: user.email, tier: user.tier } });
  })
);
