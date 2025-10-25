import { randomUUID } from 'crypto';
import dayjs from 'dayjs';
import { db } from '../index.js';
import type { StoryUsage } from '../../types/usage.js';

const formatDate = (date: dayjs.Dayjs) => date.startOf('day').format('YYYY-MM-DD');

export const getUsageForDate = (userId: string, date = dayjs()): StoryUsage | null => {
  const stmt = db.prepare('SELECT * FROM story_usage WHERE user_id = ? AND usage_date = ?');
  const record = stmt.get(userId, formatDate(date)) as StoryUsage | undefined;
  return record ?? null;
};

export const incrementUsage = (userId: string, date = dayjs()): StoryUsage => {
  const usageDate = formatDate(date);
  const existing = getUsageForDate(userId, date);
  if (existing) {
    const stmt = db.prepare('UPDATE story_usage SET count = count + 1 WHERE id = ?');
    stmt.run(existing.id);
    return { ...existing, count: existing.count + 1 };
  }
  const id = randomUUID();
  const stmt = db.prepare(
    'INSERT INTO story_usage (id, user_id, usage_date, count) VALUES (?, ?, ?, ?)' 
  );
  stmt.run(id, userId, usageDate, 1);
  return { id, user_id: userId, usage_date: usageDate, count: 1 };
};
