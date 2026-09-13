CREATE TABLE oauth_identities (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  provider TEXT NOT NULL CHECK(provider IN ('apple','microsoft')),
  subject TEXT NOT NULL,
  email_at_link TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_at TEXT,
  UNIQUE(provider, subject),
  UNIQUE(user_id, provider)
);
CREATE TABLE oauth_authorizations (
  state_hash TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK(provider IN ('apple','microsoft')),
  code_verifier TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX oauth_authorizations_expires_at ON oauth_authorizations(expires_at);
