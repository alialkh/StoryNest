import Database from 'better-sqlite3';
import { env } from '../config/env.js';

export const db = new Database(env.databaseFile);

db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'FREE',
  premium_until TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TRIGGER IF NOT EXISTS update_users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  UPDATE users SET updated_at = datetime('now') WHERE id = old.id;
END;

CREATE TABLE IF NOT EXISTS stories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  content TEXT NOT NULL,
  title TEXT,
  genre TEXT,
  tone TEXT,
  continued_from_id TEXT,
  word_count INTEGER NOT NULL,
  share_id TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (continued_from_id) REFERENCES stories(id)
);

CREATE TABLE IF NOT EXISTS story_usage (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  usage_date TEXT NOT NULL,
  count INTEGER NOT NULL,
  UNIQUE(user_id, usage_date),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
`);

// Migration: Add title column if it doesn't exist
try {
  db.exec(`ALTER TABLE stories ADD COLUMN title TEXT;`);
} catch (err) {
  // Column already exists, ignore error
}

// Create gamification tables
db.exec(`
CREATE TABLE IF NOT EXISTS user_stats (
  user_id TEXT PRIMARY KEY,
  total_stories INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_story_date TEXT,
  total_xp INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TRIGGER IF NOT EXISTS update_user_stats_updated_at
AFTER UPDATE ON user_stats
FOR EACH ROW
BEGIN
  UPDATE user_stats SET updated_at = datetime('now') WHERE user_id = old.user_id;
END;

CREATE TABLE IF NOT EXISTS user_achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  achievement_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  earned_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, achievement_type),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
`);

// Create public feed tables
db.exec(`
CREATE TABLE IF NOT EXISTS public_stories (
  id TEXT PRIMARY KEY,
  story_id TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  like_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  shared_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public_story_likes (
  id TEXT PRIMARY KEY,
  public_story_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(public_story_id, user_id),
  FOREIGN KEY (public_story_id) REFERENCES public_stories(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public_story_comments (
  id TEXT PRIMARY KEY,
  public_story_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (public_story_id) REFERENCES public_stories(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS daily_share_limit (
  user_id TEXT PRIMARY KEY,
  shared_count INTEGER NOT NULL DEFAULT 0,
  last_reset TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS theme_unlocks (
  id INTEGER PRIMARY KEY,
  theme_id TEXT NOT NULL,
  theme_name TEXT NOT NULL,
  xp_threshold INTEGER NOT NULL,
  unlocked BOOLEAN DEFAULT 0
);

INSERT OR IGNORE INTO theme_unlocks (theme_id, theme_name, xp_threshold) VALUES
('default', 'Enchanted', 0),
('forest', 'Forest', 100),
('lava', 'Lava', 250),
('ocean', 'Ocean', 500),
('twilight', 'Twilight', 750),
('sunset', 'Sunset', 1000),
('midnight', 'Midnight', 2500);

CREATE TABLE IF NOT EXISTS login_streaks (
  user_id TEXT PRIMARY KEY,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_login TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
`);
