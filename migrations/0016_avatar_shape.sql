ALTER TABLE users ADD COLUMN avatar_shape TEXT NOT NULL DEFAULT 'circle'
  CHECK(avatar_shape IN ('circle','square'));
