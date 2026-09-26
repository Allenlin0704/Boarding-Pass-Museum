ALTER TABLE flights ADD COLUMN submission_type TEXT NOT NULL DEFAULT 'boarding_pass';
ALTER TABLE flights ADD COLUMN ticket_format TEXT NOT NULL DEFAULT 'paper';
ALTER TABLE flights ADD COLUMN departure_country TEXT NOT NULL DEFAULT '';
ALTER TABLE flights ADD COLUMN arrival_country TEXT NOT NULL DEFAULT '';
ALTER TABLE flights ADD COLUMN special_tags TEXT NOT NULL DEFAULT '[]';

CREATE TABLE IF NOT EXISTS flight_corrections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  flight_id INTEGER NOT NULL REFERENCES flights(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','dismissed')),
  decision TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS flight_correction_pending_once
  ON flight_corrections(flight_id,user_id) WHERE status='pending';
CREATE INDEX IF NOT EXISTS flight_correction_queue
  ON flight_corrections(status,created_at);
