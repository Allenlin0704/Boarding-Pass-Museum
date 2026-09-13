ALTER TABLE oauth_authorizations ADD COLUMN user_id INTEGER;
ALTER TABLE oauth_authorizations ADD COLUMN nonce TEXT;

