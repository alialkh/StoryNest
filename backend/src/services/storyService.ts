import { GoogleGenerativeAI } from '@google/generative-ai';
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
  updateStreakAndXP,
  checkAndAwardAchievements
} from '../db/repositories/gamificationRepository.js';
import {
  getUsageForDate,
  incrementUsage
} from '../db/repositories/usageRepository.js';
import { getUserById, isPremiumActive } from '../db/repositories/userRepository.js';
import type { Story } from '../types/story.js';

// Remove suggestion markers from content
const stripSuggestion = (text?: string): string => {
  if (!text) return '';
  return text.replace(/\*\*(.*?)\*\*/gs, '').trim();
};

const genAI = env.geminiApiKey ? new GoogleGenerativeAI(env.geminiApiKey) : null;

export interface GenerateStoryInput {
  userId: string;
  prompt: string;
  genre?: string | null;
  tone?: string | null;
  archetype?: string | null;
  wordCount?: number | null;
  continuedFromId?: string | null;
}

export interface GenerateStoryResult {
  story: Story;
  remaining: number | null;
}

const fallbackStory = (prompt: string): string => {
  const now = dayjs().format('MMMM D, YYYY');
  return `On ${now}, inspiration sparks from the prompt: ${prompt}. Without the help of the live AI service, StoryNest weaves this placeholder tale. It reminds you that imagination survives even offline. A real build would call the AI provider's API to craft a vivid, 200-word narrative, but for now, picture a detective staring into a mirror, realizing the mystery has always been inside. He exhales, knowing the next version of this app will finish the scene with a twist ending.`;
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

const buildPrompt = (prompt: string, genre?: string | null, tone?: string | null, archetype?: string | null, wordCount?: number | null, continuedStory?: Story | null) => {
  const isFollowUp = !!continuedStory;
  
  const userLine = isFollowUp
    ? `Continue the following story in no more than ${wordCount ?? 400} words, maintaining coherence and offering a twist or emotional closing.

Story so far:
${stripSuggestion(continuedStory!.content)}

Prompt for the next chapter: ${prompt}`
    : `Write a short story (minimum ${Math.round((wordCount ?? 200) * 0.5)} words, maximum ${wordCount ?? 400} words) about ${prompt}.`;

  const qualifiers = [
    genre ? `Genre: ${genre}` : null,
    tone ? `Tone: ${tone}` : null,
    archetype ? `Main Character Archetype: ${archetype}` : null,
    wordCount ? `Target word count: ${wordCount} words` : null
  ]
    .filter(Boolean)
    .join('\n');

  return {
    system: `You are an award-winning creative writer who crafts short, vivid 100-400 word stories that end with a twist or emotional conclusion.
    Your task is to generate a short story from a prompt that you are provided with.
    You operate within a system where a user will provide you with a prompt, genre, tone, and character archetype, and you will produce a short story, or build from a previous story.
    
    CRITICAL OUTPUT FORMAT:
    ${isFollowUp 
      ? `1. Do NOT generate a new title. The original story title is already set and should not change.
    2. Write only the story content with proper formatting:
       - Use backticks around text for BOLD emphasis: \`bold text\`
       - Use underscores around text for ITALIC emphasis: _italic text_
    3. After the story ends, add a single line break, then on a new line write a compelling one-sentence idea for what could happen next. Wrap this idea in double asterisks, for example: **The next challenge awaits.**
    4. Do not include any other text outside this format. Do not include a title.`
      : `1. Begin with a story title surrounded by double asterisks on its own line: **Your Title Here**
    2. Write the story content with proper formatting:
       - Use backticks around text for BOLD emphasis: \`bold text\`
       - Use underscores around text for ITALIC emphasis: _italic text_
    3. After the story ends, add a single line break, then on a new line write a compelling one-sentence idea for what could happen next. Wrap this idea in double asterisks, for example: **The mystery deepens.**
    4. Do not include any other text outside this format.`}
    
    STORY GUIDELINES:
    - Your short story should reflect the prompt, genre, tone, and character archetype that is requested.
    - If a character archetype is provided, ensure the protagonist embodies the characteristics and motivations of that archetype throughout the story.
    - If you are provided with a previous story to continue from, thoroughly read the previous story and build off of it as if it was a chapter in a book, so it flows smoothly and carries a meaningful plot.
    - You may use online resources to augment your short story to make it more impactful.
    - Do not include inline source markers such as "(Source 1)" or "(Source X)" in the output.
    - Use formatting symbols to emphasize important words and emotions throughout the narrative.
    ${
      qualifiers ? `\n${qualifiers}` : ''
    }`,
    user: userLine
  };
};

const callAI = async (prompt: string, genre?: string | null, tone?: string | null, archetype?: string | null, wordCount?: number | null, continuedStory?: Story | null): Promise<string> => {
  const instructions = buildPrompt(prompt, genre, tone, archetype, wordCount, continuedStory);
  if (!genAI) {
    return fallbackStory(prompt);
  }

  const modelName = 'gemini-flash-latest';
  const model = genAI.getGenerativeModel({ model: modelName });
  const parts = [
    { text: instructions.system },
    { text: '\n---\n' },
    { text: instructions.user }
  ];

  // LLM request logging
  const preview = (s: string, n = 300) => (s.length > n ? s.slice(0, n) + '…' : s);
  const combined = `${instructions.system}\n---\n${instructions.user}`;
  const start = Date.now();
  console.info('[LLM] Request start', {
    model: modelName,
    genre: genre ?? undefined,
    tone: tone ?? undefined,
    continued: Boolean(continuedStory),
    prevLen: continuedStory ? continuedStory.content.length : 0
  });
  console.debug('[LLM] Request preview', preview(combined));

  try {
    const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
    const text = result.response.text();
    const ms = Date.now() - start;
    if (!text) {
      throw new Error('Failed to generate story');
    }
    console.info('[LLM] Response received', { model: modelName, ms, textLen: text.length });
    console.debug('[LLM] Response preview', preview(text));
    return text.trim();
  } catch (err) {
    const ms = Date.now() - start;
    console.error('[LLM] Request failed', { model: modelName, ms, error: (err as Error).message });
    throw err;
  }
};

export const generateStory = async ({
  userId,
  prompt,
  genre = null,
  tone = null,
  archetype = null,
  wordCount = null,
  continuedFromId = null
}: GenerateStoryInput): Promise<GenerateStoryResult> => {
  const { remaining } = ensureDailyLimit(userId);
  const continuedStory = continuedFromId ? getStoryById(continuedFromId) : null;
  const rawContent = await callAI(prompt, genre, tone, archetype, wordCount, continuedStory ?? undefined);
  
  console.debug('[Story] Raw LLM response (first 200 chars):', rawContent.substring(0, 200));
  console.debug('[Story] Raw LLM response (last 200 chars):', rawContent.substring(Math.max(0, rawContent.length - 200)));
  
  let title: string | null = null;
  let content = rawContent;
  
  if (!continuedStory) {
    // For initial stories: extract title from LLM response
    // Match title with optional whitespace, newlines, etc.
    const titleMatch = rawContent.match(/^\s*\*\*([^*]+)\*\*/);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
      console.info('[Title] Extracted title (initial story):', title);
      // Remove the title from content so only story remains
      content = rawContent.replace(/^\s*\*\*[^*]+\*\*\s*/, '').trim();
      console.debug('[Content] After title removal (first 150 chars):', content.substring(0, 150));
      console.debug('[Content] After title removal (last 150 chars):', content.substring(Math.max(0, content.length - 150)));
    } else {
      console.warn('[Title] No title match found in response for initial story');
      console.debug('[Title] Response start:', rawContent.substring(0, 200));
    }
  } else {
    // For follow-up stories: keep original title, don't extract new one
    // The LLM should NOT have included a title (per instructions)
    title = continuedStory.title;
    content = rawContent.trim();
    console.info('[Title] Using original title for follow-up:', title);
    console.debug('[Content] Follow-up story content (last 150 chars):', content.substring(Math.max(0, content.length - 150)));
  }
  
  const story = createStory({
    userId,
    prompt,
    content,
    title,
    genre,
    tone,
    continuedFromId
  });

  // Update gamification stats
  updateStreakAndXP(userId, 10); // 10 XP per story
  const newAchievements = checkAndAwardAchievements(userId);
  if (newAchievements.length > 0) {
    console.info('[Gamification] New achievements:', newAchievements.map(a => a.title));
  }

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
