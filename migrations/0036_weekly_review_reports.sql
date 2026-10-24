CREATE TABLE IF NOT EXISTS weekly_review_reports (
  week_ending TEXT PRIMARY KEY,
  reviewed_count INTEGER NOT NULL DEFAULT 0,
  approved_count INTEGER NOT NULL DEFAULT 0,
  rejected_count INTEGER NOT NULL DEFAULT 0,
  top_rejection_category TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
