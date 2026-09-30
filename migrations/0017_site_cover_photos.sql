CREATE TABLE IF NOT EXISTS site_cover_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image_url TEXT NOT NULL UNIQUE,
  credit TEXT NOT NULL DEFAULT '',
  show_home INTEGER NOT NULL DEFAULT 1 CHECK(show_home IN (0,1)),
  show_login INTEGER NOT NULL DEFAULT 1 CHECK(show_login IN (0,1)),
  show_register INTEGER NOT NULL DEFAULT 1 CHECK(show_register IN (0,1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  submitted_by INTEGER REFERENCES users(id),
  request_id INTEGER UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS site_cover_photos_home ON site_cover_photos(active,show_home,sort_order,id);
CREATE INDEX IF NOT EXISTS site_cover_photos_login ON site_cover_photos(active,show_login,sort_order,id);
CREATE INDEX IF NOT EXISTS site_cover_photos_register ON site_cover_photos(active,show_register,sort_order,id);

CREATE TABLE IF NOT EXISTS site_photo_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER NOT NULL REFERENCES users(id),
  invited_by INTEGER NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'invited' CHECK(status IN ('invited','accepted','declined','uploading','pending_review','approved','rejected')),
  image_url TEXT,
  credit TEXT NOT NULL DEFAULT '',
  show_home INTEGER NOT NULL DEFAULT 1 CHECK(show_home IN (0,1)),
  show_login INTEGER NOT NULL DEFAULT 1 CHECK(show_login IN (0,1)),
  show_register INTEGER NOT NULL DEFAULT 1 CHECK(show_register IN (0,1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  license_confirmed INTEGER NOT NULL DEFAULT 0 CHECK(license_confirmed IN (0,1)),
  license_version TEXT,
  reviewer_id INTEGER REFERENCES users(id),
  review_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  responded_at TEXT,
  submitted_at TEXT,
  reviewed_at TEXT
);

CREATE INDEX IF NOT EXISTS site_photo_requests_admin ON site_photo_requests(admin_id,status,created_at);
CREATE INDEX IF NOT EXISTS site_photo_requests_review ON site_photo_requests(status,created_at);

INSERT OR IGNORE INTO site_cover_photos(image_url,credit,show_home,show_login,show_register,sort_order,active)
VALUES
('/assets/auth-covers/01.jpg','allenlin',1,1,1,1,1),
('/assets/auth-covers/02.jpg','allenlin',1,1,1,2,1),
('/assets/auth-covers/03.jpg','allenlin',1,1,1,3,1),
('/assets/auth-covers/04.jpg','allenlin',1,1,1,4,1),
('/assets/auth-covers/05.jpg','allenlin',1,1,1,5,1),
('/assets/auth-covers/06.jpg','allenlin',1,1,1,6,1),
('/assets/auth-covers/07.jpg','allenlin',1,1,1,7,1);
