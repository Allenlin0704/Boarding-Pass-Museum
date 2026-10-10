ALTER TABLE flights ADD COLUMN route_scope TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  version TEXT,
  content TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE announcements ADD COLUMN idempotency_key TEXT;
CREATE UNIQUE INDEX announcements_idempotency_key_unique
  ON announcements(idempotency_key)
  WHERE idempotency_key IS NOT NULL;
