import 'dotenv/config';

export const env = {
  port: parseInt(process.env.PORT ?? '4000', 10),
  jwtSecret: process.env.JWT_SECRET ?? 'development-secret',
  openAiApiKey: process.env.OPENAI_API_KEY,
  stripeKey: process.env.STRIPE_SECRET_KEY,
  databaseFile: process.env.DATABASE_FILE ?? './storynest.db',
  freeStoryDailyLimit: parseInt(process.env.FREE_STORY_DAILY_LIMIT ?? '3', 10)
} as const;
