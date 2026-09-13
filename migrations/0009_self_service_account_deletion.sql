-- A deletion request is self-service: its 48-hour cooling-off period is
-- recorded separately from its finalization, so linked public records remain
-- intact while personal account data can be anonymized.
ALTER TABLE users ADD COLUMN deleted_at TEXT;
ALTER TABLE account_deletion_requests ADD COLUMN execute_at TEXT;
ALTER TABLE account_deletion_requests ADD COLUMN finalized_at TEXT;
CREATE INDEX account_deletion_requests_execute_at
  ON account_deletion_requests(status, execute_at);
