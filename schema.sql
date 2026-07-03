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
