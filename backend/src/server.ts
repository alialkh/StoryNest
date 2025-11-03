import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { authRouter } from './routes/authRoutes.js';
import { storyRouter } from './routes/storyRoutes.js';
import { billingRouter } from './routes/billingRoutes.js';
import { gamificationRouter } from './routes/gamificationRoutes.js';
import publicFeedRouter from './routes/publicFeedRoutes.js';
import './db/index.js';

const app = express();

app.use(cors());
app.use(express.json());

// Rate limiting middleware
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW = 250; // milliseconds
const RATE_LIMIT_MAX_REQUESTS = 1; // 1 request per 250ms

app.use((req, res, next) => {
  // Get client IP address
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown';
  
  const now = Date.now();
  const entry = rateLimitStore.get(clientIp);

  if (!entry || now > entry.resetTime) {
    // Create new window
    rateLimitStore.set(clientIp, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    next();
  } else if (entry.count < RATE_LIMIT_MAX_REQUESTS) {
    // Within limit
    entry.count++;
    next();
  } else {
    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    console.warn(`[Rate Limit] ${clientIp} exceeded rate limit. Retry after ${retryAfter}s`);
    res.status(429).set('Retry-After', retryAfter.toString()).json({
      error: 'Too many requests',
      message: `Rate limit exceeded. Maximum 1 request per ${RATE_LIMIT_WINDOW}ms`,
      retryAfter
    });
  }
});

// Logging middleware to log all requests and responses
app.use((req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;

  res.send = function(data: any) {
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log(`  Status: ${res.statusCode}`);
    console.log(`  Duration: ${duration}ms`);
    if (req.body && Object.keys(req.body).length > 0) {
      console.log(`  Request Body:`, req.body);
    }
    if (data) {
      console.log(`  Response:`, typeof data === 'string' ? data.substring(0, 200) : data);
    }
    return originalSend.call(this, data);
  };

  next();
});

app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'StoryNest backend running' });
});

app.use('/auth', authRouter);
app.use('/stories', storyRouter);
app.use('/billing', billingRouter);
app.use('/gamification', gamificationRouter);
app.use('/feed', publicFeedRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: err instanceof Error ? err.message : 'Internal server error' });
});

app.listen(env.port, () => {
  console.log(`StoryNest backend listening on port ${env.port}`);
});
