-- Account deletion is deliberately a review workflow.  A request never
-- deletes content by itself; an SA must review it before any irreversible
-- follow-up can be arranged.
CREATE TABLE account_deletion_requests (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE,
  reason TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','cancelled')),
  requested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TEXT,
  reviewer_id INTEGER,
  decision_note TEXT
);

CREATE INDEX account_deletion_requests_status_requested_at
  ON account_deletion_requests(status, requested_at);
