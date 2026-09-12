CREATE TABLE sa_pins (
  user_id INTEGER PRIMARY KEY,
  pin_hash TEXT NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE sa_passkeys (
  credential_id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  public_key TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  transports TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_at TEXT
);
CREATE TABLE sa_webauthn_challenges (
  session_hash TEXT NOT NULL,
  kind TEXT NOT NULL,
  challenge TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  PRIMARY KEY(session_hash, kind)
);
CREATE TABLE sa_stepups (
  session_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  verified_until TEXT NOT NULL,
  method TEXT NOT NULL
);
