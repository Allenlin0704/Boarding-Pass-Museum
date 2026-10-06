ALTER TABLE flights ADD COLUMN social_share_consent INTEGER NOT NULL DEFAULT 0 CHECK(social_share_consent IN (0,1));
ALTER TABLE flights ADD COLUMN airline_iata TEXT NOT NULL DEFAULT '';
ALTER TABLE flights ADD COLUMN airline_icao TEXT NOT NULL DEFAULT '';
ALTER TABLE flights ADD COLUMN airport_iata TEXT NOT NULL DEFAULT '';
ALTER TABLE flights ADD COLUMN airport_icao TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS staff_chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  message TEXT NOT NULL CHECK(length(message) BETWEEN 1 AND 2000),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS staff_chat_messages_recent ON staff_chat_messages(id DESC);
