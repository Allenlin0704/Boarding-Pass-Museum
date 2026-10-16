ALTER TABLE flights ADD COLUMN social_share_consent_updated_at TEXT;

-- Sharing had been a required submission checkbox. Reset that historical
-- non-optional choice so existing contributors are not treated as opted in.
UPDATE flights
SET social_share_consent=0,social_share_consent_updated_at=NULL
WHERE social_share_consent=1;
