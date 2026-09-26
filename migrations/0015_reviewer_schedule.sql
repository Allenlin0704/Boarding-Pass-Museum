CREATE TABLE reviewer_schedule (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO reviewer_schedule(user_id,active,sort_order)
SELECT user_id,1,user_id FROM admin_memberships;

CREATE INDEX reviewer_schedule_active_order ON reviewer_schedule(active,sort_order,user_id);
