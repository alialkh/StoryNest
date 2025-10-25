import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService.js';
import { getUserById } from '../db/repositories/userRepository.js';

export interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Missing authorization header' });
  }
  const [, token] = authHeader.split(' ');
  if (!token) {
    return res.status(401).json({ message: 'Invalid authorization header' });
  }
  try {
    const { userId } = verifyToken(token);
    const user = getUserById(userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    req.user = { id: userId };
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
