import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  registerUser,
  authenticateUser,
  issueToken
} from '../services/authService.js';
import { getUserById } from '../db/repositories/userRepository.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/authenticate.js';

export const authRouter = Router();

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const user = registerUser(req.body);
    const token = issueToken(user);
    res.status(201).json({ user: { id: user.id, email: user.email, tier: user.tier }, token });
  })
);

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { user, token } = authenticateUser(req.body);
    res.json({ user: { id: user.id, email: user.email, tier: user.tier }, token });
  })
);

authRouter.get(
  '/me',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = getUserById(req.user!.id);
    res.json({ user: user && { id: user.id, email: user.email, tier: user.tier } });
  })
);
