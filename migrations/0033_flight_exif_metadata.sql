-- Keep a small, privacy-filtered metadata summary only while a submission is
-- under review. The original image is never stored by this feature.
CREATE TABLE IF NOT EXISTS flight_exif (
  flight_id INTEGER PRIMARY KEY REFERENCES flights(id) ON DELETE CASCADE,
  metadata_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
