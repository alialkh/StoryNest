import { db } from '../index.js';
import { randomUUID } from 'crypto';
import dayjs from 'dayjs';

export interface UserStats {
  user_id: string;
  total_stories: number;
  current_streak: number;
  longest_streak: number;
  last_story_date: string | null;
  total_xp: number;
  created_at: string;
  updated_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_type: string;
  title: string;
  description: string | null;
  xp_reward: number;
  earned_at: string;
}

// Achievement definitions
export const ACHIEVEMENTS = {
  FIRST_STORY: {
    type: 'first_story',
    title: 'Story Starter',
    description: 'Create your first story',
    xp: 50
  },
  FIVE_STORIES: {
    type: 'five_stories',
    title: 'Rising Author',
    description: 'Create 5 stories',
    xp: 100
  },
  TEN_STORIES: {
    type: 'ten_stories',
    title: 'Prolific Writer',
    description: 'Create 10 stories',
    xp: 250
  },
  TWENTY_STORIES: {
    type: 'twenty_stories',
    title: 'Master Storyteller',
    description: 'Create 20 stories',
    xp: 500
  },
  FIFTY_STORIES: {
    type: 'fifty_stories',
    title: 'Epic Author',
    description: 'Create 50 stories',
    xp: 750
  },
  HUNDRED_STORIES: {
    type: 'hundred_stories',
    title: 'Legend of the Craft',
    description: 'Create 100 stories',
    xp: 1500
  },
  FIVE_HUNDRED_STORIES: {
    type: 'five_hundred_stories',
    title: 'Immortal Wordsmith',
    description: 'Create 500 stories',
    xp: 5000
  },
  THREE_DAY_STREAK: {
    type: 'three_day_streak',
    title: 'Consistent Creator',
    description: 'Create stories for 3 consecutive days',
    xp: 150
  },
  SEVEN_DAY_STREAK: {
    type: 'seven_day_streak',
    title: 'Week Warrior',
    description: 'Create stories for 7 consecutive days',
    xp: 350
  },
  THIRTY_DAY_STREAK: {
    type: 'thirty_day_streak',
    title: 'Legend Writer',
    description: 'Create stories for 30 consecutive days',
    xp: 1000
  }
};

export const getOrCreateUserStats = (userId: string): UserStats => {
  const stmt = db.prepare('SELECT * FROM user_stats WHERE user_id = ?');
  let stats = stmt.get(userId) as UserStats | undefined;

  if (!stats) {
    const createStmt = db.prepare(`
      INSERT INTO user_stats (user_id, total_stories, current_streak, longest_streak, total_xp)
      VALUES (?, 0, 0, 0, 0)
    `);
    createStmt.run(userId);
    stats = stmt.get(userId) as UserStats;
  }

  return stats;
};

export const updateStreakAndXP = (userId: string, storyXP: number = 10): UserStats => {
  const stats = getOrCreateUserStats(userId);
  const today = dayjs().format('YYYY-MM-DD');
  const lastDate = stats.last_story_date ? dayjs(stats.last_story_date).format('YYYY-MM-DD') : null;
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

  let newStreak = stats.current_streak;
  if (lastDate === today) {
    // Already created a story today, don't increase streak
    newStreak = stats.current_streak;
  } else if (lastDate === yesterday) {
    // Created story yesterday, continue streak
    newStreak = stats.current_streak + 1;
  } else {
    // Reset streak
    newStreak = 1;
  }

  const longestStreak = Math.max(stats.longest_streak, newStreak);
  const newTotalXP = stats.total_xp + storyXP;

  const updateStmt = db.prepare(`
    UPDATE user_stats
    SET total_stories = total_stories + 1,
        current_streak = ?,
        longest_streak = ?,
        last_story_date = datetime('now'),
        total_xp = ?
    WHERE user_id = ?
  `);

  updateStmt.run(newStreak, longestStreak, newTotalXP, userId);
  return getOrCreateUserStats(userId);
};

export const hasAchievement = (userId: string, achievementType: string): boolean => {
  const stmt = db.prepare(
    'SELECT 1 FROM user_achievements WHERE user_id = ? AND achievement_type = ? LIMIT 1'
  );
  return !!stmt.get(userId, achievementType);
};

export const awardAchievement = (
  userId: string,
  achievementType: string,
  title: string,
  description: string | null = null,
  xpReward: number = 0
): UserAchievement | null => {
  // Check if already earned
  if (hasAchievement(userId, achievementType)) {
    return null;
  }

  const id = randomUUID();
  const stmt = db.prepare(`
    INSERT INTO user_achievements (id, user_id, achievement_type, title, description, xp_reward)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, userId, achievementType, title, description, xpReward);

  // Add XP for the achievement
  if (xpReward > 0) {
    const xpStmt = db.prepare('UPDATE user_stats SET total_xp = total_xp + ? WHERE user_id = ?');
    xpStmt.run(xpReward, userId);
  }

  const getStmt = db.prepare('SELECT * FROM user_achievements WHERE id = ?');
  return getStmt.get(id) as UserAchievement;
};

export const checkAndAwardAchievements = (userId: string): UserAchievement[] => {
  const stats = getOrCreateUserStats(userId);
  const awarded: UserAchievement[] = [];

  // Story count achievements
  if (stats.total_stories === 1) {
    const ach = awardAchievement(
      userId,
      ACHIEVEMENTS.FIRST_STORY.type,
      ACHIEVEMENTS.FIRST_STORY.title,
      ACHIEVEMENTS.FIRST_STORY.description,
      ACHIEVEMENTS.FIRST_STORY.xp
    );
    if (ach) awarded.push(ach);
  } else if (stats.total_stories === 5) {
    const ach = awardAchievement(
      userId,
      ACHIEVEMENTS.FIVE_STORIES.type,
      ACHIEVEMENTS.FIVE_STORIES.title,
      ACHIEVEMENTS.FIVE_STORIES.description,
      ACHIEVEMENTS.FIVE_STORIES.xp
    );
    if (ach) awarded.push(ach);
  } else if (stats.total_stories === 10) {
    const ach = awardAchievement(
      userId,
      ACHIEVEMENTS.TEN_STORIES.type,
      ACHIEVEMENTS.TEN_STORIES.title,
      ACHIEVEMENTS.TEN_STORIES.description,
      ACHIEVEMENTS.TEN_STORIES.xp
    );
    if (ach) awarded.push(ach);
  } else if (stats.total_stories === 20) {
    const ach = awardAchievement(
      userId,
      ACHIEVEMENTS.TWENTY_STORIES.type,
      ACHIEVEMENTS.TWENTY_STORIES.title,
      ACHIEVEMENTS.TWENTY_STORIES.description,
      ACHIEVEMENTS.TWENTY_STORIES.xp
    );
    if (ach) awarded.push(ach);
  } else if (stats.total_stories === 50) {
    const ach = awardAchievement(
      userId,
      ACHIEVEMENTS.FIFTY_STORIES.type,
      ACHIEVEMENTS.FIFTY_STORIES.title,
      ACHIEVEMENTS.FIFTY_STORIES.description,
      ACHIEVEMENTS.FIFTY_STORIES.xp
    );
    if (ach) awarded.push(ach);
  } else if (stats.total_stories === 100) {
    const ach = awardAchievement(
      userId,
      ACHIEVEMENTS.HUNDRED_STORIES.type,
      ACHIEVEMENTS.HUNDRED_STORIES.title,
      ACHIEVEMENTS.HUNDRED_STORIES.description,
      ACHIEVEMENTS.HUNDRED_STORIES.xp
    );
    if (ach) awarded.push(ach);
  } else if (stats.total_stories === 500) {
    const ach = awardAchievement(
      userId,
      ACHIEVEMENTS.FIVE_HUNDRED_STORIES.type,
      ACHIEVEMENTS.FIVE_HUNDRED_STORIES.title,
      ACHIEVEMENTS.FIVE_HUNDRED_STORIES.description,
      ACHIEVEMENTS.FIVE_HUNDRED_STORIES.xp
    );
    if (ach) awarded.push(ach);
  }

  // Streak achievements
  if (stats.current_streak === 3) {
    const ach = awardAchievement(
      userId,
      ACHIEVEMENTS.THREE_DAY_STREAK.type,
      ACHIEVEMENTS.THREE_DAY_STREAK.title,
      ACHIEVEMENTS.THREE_DAY_STREAK.description,
      ACHIEVEMENTS.THREE_DAY_STREAK.xp
    );
    if (ach) awarded.push(ach);
  } else if (stats.current_streak === 7) {
    const ach = awardAchievement(
      userId,
      ACHIEVEMENTS.SEVEN_DAY_STREAK.type,
      ACHIEVEMENTS.SEVEN_DAY_STREAK.title,
      ACHIEVEMENTS.SEVEN_DAY_STREAK.description,
      ACHIEVEMENTS.SEVEN_DAY_STREAK.xp
    );
    if (ach) awarded.push(ach);
  } else if (stats.current_streak === 30) {
    const ach = awardAchievement(
      userId,
      ACHIEVEMENTS.THIRTY_DAY_STREAK.type,
      ACHIEVEMENTS.THIRTY_DAY_STREAK.title,
      ACHIEVEMENTS.THIRTY_DAY_STREAK.description,
      ACHIEVEMENTS.THIRTY_DAY_STREAK.xp
    );
    if (ach) awarded.push(ach);
  }

  return awarded;
};

export const getUserStats = (userId: string): UserStats => {
  return getOrCreateUserStats(userId);
};

export const getUserAchievements = (userId: string): UserAchievement[] => {
  const stmt = db.prepare(
    'SELECT * FROM user_achievements WHERE user_id = ? ORDER BY earned_at DESC'
  );
  return stmt.all(userId) as UserAchievement[];
};

export const awardXp = (userId: string, amount: number): UserStats => {
  const stats = getOrCreateUserStats(userId);
  const newTotal = stats.total_xp + amount;
  
  const updateStmt = db.prepare(`
    UPDATE user_stats 
    SET total_xp = total_xp + ?, updated_at = datetime('now')
    WHERE user_id = ?
  `);
  updateStmt.run(amount, userId);

  return getOrCreateUserStats(userId);
};
