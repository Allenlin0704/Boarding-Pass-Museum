-- =====================================
-- BoardingPassMuseum Content System
-- =====================================


-- 展品 / 投稿表

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

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(user_id)
    REFERENCES users(id)

);



-- 收藏

CREATE TABLE IF NOT EXISTS favorites (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    flight_id INTEGER NOT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(user_id)
    REFERENCES users(id),

    FOREIGN KEY(flight_id)
    REFERENCES flights(id)

);



-- 用户申诉

CREATE TABLE IF NOT EXISTS appeals (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    flight_id INTEGER NOT NULL,

    reason TEXT NOT NULL,

    status TEXT DEFAULT 'pending',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(user_id)
    REFERENCES users(id),

    FOREIGN KEY(flight_id)
    REFERENCES flights(id)

);



-- 更新日志

CREATE TABLE IF NOT EXISTS updates (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    version TEXT NOT NULL,

    title TEXT NOT NULL,

    content TEXT NOT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP

);