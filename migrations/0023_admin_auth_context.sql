ALTER TABLE auth_sessions ADD COLUMN auth_context TEXT NOT NULL DEFAULT 'public'
  CHECK(auth_context IN ('public','admin'));
ALTER TABLE oauth_authorizations ADD COLUMN auth_context TEXT NOT NULL DEFAULT 'public'
  CHECK(auth_context IN ('public','admin'));
