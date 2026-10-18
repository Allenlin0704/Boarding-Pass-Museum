CREATE TABLE IF NOT EXISTS users (
id INTEGER PRIMARY KEY AUTOINCREMENT,
username TEXT NOT NULL,
email TEXT NOT NULL UNIQUE,
password TEXT NOT NULL,
role TEXT DEFAULT 'user',
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
avatar_shape TEXT NOT NULL DEFAULT 'circle' CHECK(avatar_shape IN ('circle','square'))
);


CREATE TABLE IF NOT EXISTS flights (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER NOT NULL,
airline TEXT,
flight TEXT,
route TEXT,
date TEXT,
aircraft TEXT,
airport TEXT,
image TEXT,
story TEXT,
status TEXT DEFAULT 'pending',
reject_reason TEXT,
reviewer_id INTEGER,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
submission_type TEXT NOT NULL DEFAULT 'boarding_pass',
ticket_format TEXT NOT NULL DEFAULT 'paper',
ticket_category TEXT NOT NULL DEFAULT '',
departure_country TEXT NOT NULL DEFAULT '',
arrival_country TEXT NOT NULL DEFAULT '',
special_tags TEXT NOT NULL DEFAULT '[]',
route_scope TEXT NOT NULL DEFAULT '',
cabin_class TEXT NOT NULL DEFAULT 'economy',
cabin_class_verified INTEGER NOT NULL DEFAULT 0 CHECK(cabin_class_verified IN (0,1)),
airline_iata TEXT NOT NULL DEFAULT '',
airline_icao TEXT NOT NULL DEFAULT '',
airport_iata TEXT NOT NULL DEFAULT '',
airport_icao TEXT NOT NULL DEFAULT '',
issue_airport TEXT
);


CREATE TABLE IF NOT EXISTS email_codes (
id INTEGER PRIMARY KEY AUTOINCREMENT,
email TEXT NOT NULL,
code TEXT NOT NULL,
expires_at DATETIME NOT NULL,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS favorites (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER NOT NULL,
flight_id INTEGER NOT NULL
);


CREATE TABLE IF NOT EXISTS appeals (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER NOT NULL,
flight_id INTEGER NOT NULL,
reason TEXT NOT NULL,
status TEXT DEFAULT 'pending',
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS updates (
id INTEGER PRIMARY KEY AUTOINCREMENT,
title TEXT,
content TEXT,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
