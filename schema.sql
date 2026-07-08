CREATE TABLE IF NOT EXISTS clips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  topic TEXT DEFAULT '',
  posted_date TEXT NOT NULL,
  notes TEXT DEFAULT '',
  link_x TEXT DEFAULT '',
  link_youtube TEXT DEFAULT '',
  link_instagram TEXT DEFAULT '',
  link_tiktok TEXT DEFAULT '',
  views_x INTEGER DEFAULT 0,
  views_youtube INTEGER DEFAULT 0,
  views_instagram INTEGER DEFAULT 0,
  views_tiktok INTEGER DEFAULT 0,
  reviewed INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clips_posted_date ON clips(posted_date);
CREATE INDEX IF NOT EXISTS idx_clips_reviewed ON clips(reviewed);

CREATE TABLE IF NOT EXISTS plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL DEFAULT 'Untitled Show Plan',
  episode_date TEXT DEFAULT '',
  content TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_plans_updated ON plans(updated_at);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  muted INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
