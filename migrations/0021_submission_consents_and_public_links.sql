ALTER TABLE flights ADD COLUMN rules_consent INTEGER NOT NULL DEFAULT 0 CHECK(rules_consent IN (0,1));

CREATE TABLE IF NOT EXISTS site_public_links (
  key TEXT PRIMARY KEY,
  url TEXT NOT NULL DEFAULT '',
  updated_by INTEGER REFERENCES users(id),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO site_public_links(key,url) VALUES('wechat','');
