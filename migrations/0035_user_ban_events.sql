ALTER TABLE users ADD COLUMN account_banned_until TEXT;
ALTER TABLE users ADD COLUMN account_permanent_ban INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS user_ban_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  target_user_id INTEGER NOT NULL,
  actor_user_id INTEGER NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('ban','unban')),
  reason TEXT NOT NULL DEFAULT '',
  permanent INTEGER NOT NULL DEFAULT 0,
  banned_until TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_user_ban_events_target_created
  ON user_ban_events(target_user_id,created_at DESC);
