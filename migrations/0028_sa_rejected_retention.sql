ALTER TABLE flights ADD COLUMN rejected_at TEXT;

-- Keep a retention clock only when the audit trail identifies account 1 as
-- the SA reviewer. Do not infer dates for rows with no reliable review event.
UPDATE flights
SET rejected_at = (
  SELECT MAX(fr.created_at)
  FROM flight_reviews fr
  WHERE fr.flight_id = flights.id
    AND fr.reviewer_id = 1
    AND fr.status = 'rejected'
)
WHERE status = 'rejected'
  AND reviewer_id = 1
  AND EXISTS (
    SELECT 1 FROM flight_reviews fr
    WHERE fr.flight_id = flights.id
      AND fr.reviewer_id = 1
      AND fr.status = 'rejected'
  );

CREATE INDEX IF NOT EXISTS idx_flights_sa_rejected_retention
  ON flights(status, reviewer_id, rejected_at);

CREATE TABLE IF NOT EXISTS r2_cleanup_queue (
  object_key TEXT PRIMARY KEY,
  queued_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
