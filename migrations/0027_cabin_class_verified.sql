ALTER TABLE flights ADD COLUMN cabin_class_verified INTEGER NOT NULL DEFAULT 0 CHECK(cabin_class_verified IN (0,1));
