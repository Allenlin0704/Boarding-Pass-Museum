ALTER TABLE flights ADD COLUMN hidden_at TEXT;
UPDATE flights SET hidden_at=CURRENT_TIMESTAMP WHERE status='hidden' AND hidden_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_flights_hidden_retention ON flights(status,hidden_at);

ALTER TABLE appeals ADD COLUMN resolved_at TEXT;
UPDATE appeals SET resolved_at=created_at WHERE status!='pending' AND resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_appeals_flight_resolution ON appeals(flight_id,status,resolved_at);

CREATE TRIGGER IF NOT EXISTS flights_set_hidden_at
AFTER UPDATE OF status ON flights
WHEN NEW.status='hidden' AND (OLD.status!='hidden' OR NEW.hidden_at IS NULL)
BEGIN
  UPDATE flights SET hidden_at=CURRENT_TIMESTAMP WHERE id=NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS flights_set_hidden_at_insert
AFTER INSERT ON flights
WHEN NEW.status='hidden' AND NEW.hidden_at IS NULL
BEGIN
  UPDATE flights SET hidden_at=CURRENT_TIMESTAMP WHERE id=NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS flights_clear_hidden_at
AFTER UPDATE OF status ON flights
WHEN NEW.status!='hidden' AND NEW.hidden_at IS NOT NULL
BEGIN
  UPDATE flights SET hidden_at=NULL WHERE id=NEW.id;
END;
