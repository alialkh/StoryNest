import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { authRouter } from './routes/authRoutes.js';
import { storyRouter } from './routes/storyRoutes.js';
import { billingRouter } from './routes/billingRoutes.js';
import './db/index.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'StoryNest backend running' });
});

app.use('/auth', authRouter);
app.use('/stories', storyRouter);
app.use('/billing', billingRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: err instanceof Error ? err.message : 'Internal server error' });
});

app.listen(env.port, () => {
  console.log(`StoryNest backend listening on port ${env.port}`);
});
