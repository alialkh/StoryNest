import { Configuration, OpenAIApi } from 'openai';
import { randomUUID } from 'crypto';
import dayjs from 'dayjs';
import { env } from '../config/env.js';
import {
  createStory,
  assignShareId,
  getStoriesForUser,
  getStoryById,
  getStoryByShareId
} from '../db/repositories/storyRepository.js';
import {
  getUsageForDate,
  incrementUsage
} from '../db/repositories/usageRepository.js';
import { getUserById, isPremiumActive } from '../db/repositories/userRepository.js';
import type { Story } from '../types/story.js';

const configuration = env.openAiApiKey
  ? new Configuration({ apiKey: env.openAiApiKey })
  : null;

const openai = configuration ? new OpenAIApi(configuration) : null;

export interface GenerateStoryInput {
  userId: string;
  prompt: string;
  genre?: string | null;
  tone?: string | null;
  continuedFromId?: string | null;
}

export interface GenerateStoryResult {
  story: Story;
  remaining: number | null;
}

const fallbackStory = (prompt: string): string => {
  const now = dayjs().format('MMMM D, YYYY');
  return `On ${now}, inspiration sparks from the prompt: ${prompt}. Without the help of the live AI service, StoryNest weaves this placeholder tale. It reminds you that imagination survives even offline. A real build would call OpenAI's API to craft a vivid, 200-word narrative, but for now, picture a detective staring into a mirror, realizing the mystery has always been inside. He exhales, knowing the next version of this app will finish the scene with a twist ending.`;
};

export const getRemainingStories = (userId: string): number | null => {
  const user = getUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  if (isPremiumActive(user)) {
    return null;
  }
  const usage = getUsageForDate(userId);
  const used = usage?.count ?? 0;
  const remaining = env.freeStoryDailyLimit - used;
  return remaining > 0 ? remaining : 0;
};

export const ensureDailyLimit = (userId: string): { remaining: number | null } => {
  const remaining = getRemainingStories(userId);
  if (remaining === null) {
    return { remaining: null };
  }
  if (remaining <= 0) {
    throw new Error('Daily limit reached');
  }
  return { remaining };
};

const buildPrompt = (prompt: string, genre?: string | null, tone?: string | null, continuedStory?: Story | null) => {
  const userLine = continuedStory
    ? `Continue the following story in no more than 200 words, maintaining coherence and offering a twist or emotional closing.

Story so far:
${continuedStory.content}

Prompt for the next part: ${prompt}`
    : `Write a short story (maximum 200 words) about ${prompt}.`;

  const qualifiers = [
    genre ? `Genre: ${genre}` : null,
    tone ? `Tone: ${tone}` : null
  ]
    .filter(Boolean)
    .join('\n');

  return {
    system: `You are a creative fiction writer who crafts short, vivid 200-word stories that end with a twist or emotional conclusion.${
      qualifiers ? `\n${qualifiers}` : ''
    }`,
    user: userLine
  };
};

const callOpenAI = async (prompt: string, genre?: string | null, tone?: string | null, continuedStory?: Story | null): Promise<string> => {
  const instructions = buildPrompt(prompt, genre, tone, continuedStory);
  if (!openai) {
    return fallbackStory(prompt);
  }
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.9,
    max_tokens: 300,
    messages: [
      { role: 'system', content: instructions.system },
      { role: 'user', content: instructions.user }
    ]
  });
  const text = response.choices[0]?.message?.content;
  if (!text) {
    throw new Error('Failed to generate story');
  }
  return text.trim();
};

export const generateStory = async ({
  userId,
  prompt,
  genre = null,
  tone = null,
  continuedFromId = null
}: GenerateStoryInput): Promise<GenerateStoryResult> => {
  const { remaining } = ensureDailyLimit(userId);
  const continuedStory = continuedFromId ? getStoryById(continuedFromId) : null;
  const content = await callOpenAI(prompt, genre, tone, continuedStory ?? undefined);
  const story = createStory({
    userId,
    prompt,
    content,
    genre,
    tone,
    continuedFromId
  });
  if (remaining !== null) {
    incrementUsage(userId);
    const nextRemaining = getRemainingStories(userId);
    return { story, remaining: nextRemaining }; // ensures accurate count post-generation
  }
  return { story, remaining: null };
};

export const listStories = (userId: string) => getStoriesForUser(userId);

export const shareStory = (storyId: string): Story => {
  const story = getStoryById(storyId);
  if (!story) throw new Error('Story not found');
  if (!story.share_id) {
    const shareId = randomUUID();
    return assignShareId(storyId, shareId)!;
  }
  return story;
};

export const getSharedStory = (shareId: string): Story | null => getStoryByShareId(shareId);
