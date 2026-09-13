CREATE TABLE oauth_identities_next (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  provider TEXT NOT NULL CHECK(provider IN ('apple','microsoft','github')),
  subject TEXT NOT NULL,
  email_at_link TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_at TEXT,
  UNIQUE(provider, subject),
  UNIQUE(user_id, provider)
);
INSERT INTO oauth_identities_next SELECT * FROM oauth_identities;
DROP TABLE oauth_identities;
ALTER TABLE oauth_identities_next RENAME TO oauth_identities;

CREATE TABLE oauth_authorizations_next (
  state_hash TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK(provider IN ('apple','microsoft','github')),
  code_verifier TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id INTEGER,
  nonce TEXT
);
INSERT INTO oauth_authorizations_next SELECT state_hash,provider,code_verifier,expires_at,created_at,user_id,nonce FROM oauth_authorizations;
DROP TABLE oauth_authorizations;
ALTER TABLE oauth_authorizations_next RENAME TO oauth_authorizations;
CREATE INDEX oauth_authorizations_expires_at ON oauth_authorizations(expires_at);

