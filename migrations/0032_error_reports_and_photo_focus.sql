ALTER TABLE site_cover_photos ADD COLUMN focus_x REAL NOT NULL DEFAULT 18;
ALTER TABLE site_cover_photos ADD COLUMN focus_y REAL NOT NULL DEFAULT 47;
ALTER TABLE site_photo_requests ADD COLUMN focus_x REAL NOT NULL DEFAULT 18;
ALTER TABLE site_photo_requests ADD COLUMN focus_y REAL NOT NULL DEFAULT 47;

CREATE TABLE IF NOT EXISTS error_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  category TEXT NOT NULL,
  code TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  page TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','resolved','ignored')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS error_reports_status_created ON error_reports(status,created_at DESC);
CREATE INDEX IF NOT EXISTS error_reports_user_created ON error_reports(user_id,created_at DESC);
