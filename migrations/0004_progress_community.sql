UPDATE flights SET status='screening' WHERE status='pending';
ALTER TABLE users ADD COLUMN banned_until TEXT;
ALTER TABLE users ADD COLUMN permanent_ban INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN posting_until TEXT;
ALTER TABLE users ADD COLUMN reporting_until TEXT;
ALTER TABLE users ADD COLUMN warning_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN malicious_reports INTEGER NOT NULL DEFAULT 0;
ALTER TABLE community_posts ADD COLUMN image TEXT;
ALTER TABLE community_posts ADD COLUMN needs_review INTEGER NOT NULL DEFAULT 0;
ALTER TABLE community_posts ADD COLUMN deleted_at TEXT;
ALTER TABLE community_comments ADD COLUMN status TEXT NOT NULL DEFAULT 'visible';
ALTER TABLE community_comments ADD COLUMN moderation_reason TEXT;
CREATE TABLE IF NOT EXISTS flight_reviews(id INTEGER PRIMARY KEY,flight_id INTEGER NOT NULL,user_id INTEGER NOT NULL,reviewer_id INTEGER NOT NULL,previous_status TEXT NOT NULL,status TEXT NOT NULL,reason TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX flight_reviews_user ON flight_reviews(user_id,created_at);
CREATE INDEX flight_reviews_reviewer ON flight_reviews(reviewer_id,status);
CREATE TABLE IF NOT EXISTS flight_approvals(flight_id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL,approved_at TEXT NOT NULL,submitted_at TEXT NOT NULL,airline TEXT,airport TEXT,flight_date TEXT,historical INTEGER NOT NULL DEFAULT 0);
-- Existing records have no review timestamps. Preserve that limitation explicitly.
INSERT OR IGNORE INTO flight_approvals SELECT id,user_id,created_at,created_at,airline,airport,date,1 FROM flights WHERE status='approved';
CREATE TABLE IF NOT EXISTS user_achievements(user_id INTEGER NOT NULL,code TEXT NOT NULL,awarded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(user_id,code));
CREATE TABLE IF NOT EXISTS level_adjustments(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL,amount INTEGER NOT NULL,reason TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS community_reports(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL,target_type TEXT NOT NULL,target_id INTEGER NOT NULL,category TEXT NOT NULL,reason TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',resolution TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,resolved_at TEXT);
CREATE UNIQUE INDEX community_report_pending ON community_reports(user_id,target_type,target_id) WHERE status='pending';
CREATE TABLE IF NOT EXISTS notifications(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL,content TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,read_at TEXT);
CREATE TABLE IF NOT EXISTS moderation_actions(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL,actor_id INTEGER NOT NULL,target_type TEXT NOT NULL,target_id INTEGER NOT NULL,severity TEXT NOT NULL,reason TEXT NOT NULL,clause TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS moderation_appeals(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL,action_id INTEGER NOT NULL,reason TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',decision TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,due_at TEXT NOT NULL);
CREATE UNIQUE INDEX moderation_appeal_pending ON moderation_appeals(user_id,action_id) WHERE status='pending';
CREATE TABLE IF NOT EXISTS admin_memberships(user_id INTEGER PRIMARY KEY,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO admin_memberships(user_id) SELECT id FROM users WHERE role='administrator' OR (id=1 AND role='superadministrator');
ALTER TABLE flight_reviews ADD COLUMN historical INTEGER NOT NULL DEFAULT 0;
INSERT INTO flight_reviews(flight_id,user_id,reviewer_id,previous_status,status,reason,historical)
SELECT id,user_id,reviewer_id,'unknown',status,reject_reason,1 FROM flights WHERE status IN ('approved','rejected') AND reviewer_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS progress_cache(user_id INTEGER PRIMARY KEY,level INTEGER NOT NULL DEFAULT 0,priority INTEGER NOT NULL DEFAULT 0,year INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS flight_submissions(flight_id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL,submitted_at TEXT NOT NULL);
INSERT OR IGNORE INTO flight_submissions SELECT id,user_id,created_at FROM flights;
CREATE TRIGGER IF NOT EXISTS record_submission AFTER INSERT ON flights BEGIN
INSERT OR IGNORE INTO flight_submissions VALUES(NEW.id,NEW.user_id,NEW.created_at);
END;
CREATE TRIGGER IF NOT EXISTS record_admin_membership AFTER UPDATE OF role ON users WHEN NEW.role='administrator' OR (NEW.id=1 AND NEW.role='superadministrator') BEGIN
INSERT OR IGNORE INTO admin_memberships(user_id) VALUES(NEW.id);
END;
CREATE INDEX IF NOT EXISTS flights_review_queue ON flights(status,reviewer_id);
CREATE INDEX IF NOT EXISTS community_reports_queue ON community_reports(status);
