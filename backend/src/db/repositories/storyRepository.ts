import { randomUUID } from 'crypto';
import { db } from '../index.js';
import type { Story } from '../../types/story.js';

export interface CreateStoryInput {
  userId: string;
  prompt: string;
  content: string;
  title?: string | null;
  genre?: string | null;
  tone?: string | null;
  continuedFromId?: string | null;
}

export const createStory = ({
  userId,
  prompt,
  content,
  title = null,
  genre = null,
  tone = null,
  continuedFromId = null
}: CreateStoryInput): Story => {
  const id = randomUUID();
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const stmt = db.prepare(
    `INSERT INTO stories (id, user_id, prompt, content, title, genre, tone, continued_from_id, word_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  stmt.run(id, userId, prompt, content, title, genre, tone, continuedFromId, wordCount);
  return getStoryById(id)!;
};

export const getStoriesForUser = (userId: string): Story[] => {
  const stmt = db.prepare(
    `SELECT * FROM stories WHERE user_id = ? ORDER BY datetime(created_at) DESC`
  );
  return stmt.all(userId) as Story[];
};

export const getStoryById = (id: string): Story | null => {
  const stmt = db.prepare('SELECT * FROM stories WHERE id = ?');
  const story = stmt.get(id) as Story | undefined;
  return story ?? null;
};

export const getStoryByShareId = (shareId: string): Story | null => {
  const stmt = db.prepare('SELECT * FROM stories WHERE share_id = ?');
  const story = stmt.get(shareId) as Story | undefined;
  return story ?? null;
};

export const assignShareId = (id: string, shareId: string): Story | null => {
  const stmt = db.prepare('UPDATE stories SET share_id = ? WHERE id = ?');
  stmt.run(shareId, id);
  return getStoryById(id);
};

export const updateStoryTitle = (id: string, title: string): Story | null => {
  const stmt = db.prepare('UPDATE stories SET title = ? WHERE id = ?');
  stmt.run(title, id);
  return getStoryById(id);
};
