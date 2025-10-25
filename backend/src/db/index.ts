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
