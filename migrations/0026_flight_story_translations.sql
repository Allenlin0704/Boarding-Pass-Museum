CREATE TABLE IF NOT EXISTS flight_story_translations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  flight_id INTEGER NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
  target TEXT NOT NULL CHECK(target IN ('en','zh-CN','zh-TW')),
  source_hash TEXT NOT NULL,
  translated TEXT NOT NULL,
  provider TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(flight_id,target,source_hash)
);

CREATE INDEX IF NOT EXISTS idx_flight_story_translations_flight
  ON flight_story_translations(flight_id,target);
