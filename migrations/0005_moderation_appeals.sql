ALTER TABLE community_comments ADD COLUMN needs_review INTEGER NOT NULL DEFAULT 0;
ALTER TABLE moderation_actions ADD COLUMN previous_state TEXT;
ALTER TABLE moderation_actions ADD COLUMN penalty_days INTEGER NOT NULL DEFAULT 0;
ALTER TABLE moderation_actions ADD COLUMN deducted INTEGER NOT NULL DEFAULT 0;
ALTER TABLE moderation_actions ADD COLUMN revoked_at TEXT;
-- A second concurrent moderation transaction must roll back before any penalty is applied.
CREATE TRIGGER prevent_duplicate_post_penalty BEFORE UPDATE OF status ON community_posts
WHEN NEW.status='hidden' AND OLD.status='hidden' AND OLD.needs_review=0 AND NEW.deleted_at IS OLD.deleted_at
BEGIN SELECT RAISE(ABORT,'moderation_conflict'); END;
CREATE TRIGGER prevent_duplicate_comment_penalty BEFORE UPDATE OF status ON community_comments
WHEN NEW.status='hidden' AND OLD.status='hidden' AND OLD.needs_review=0
BEGIN SELECT RAISE(ABORT,'moderation_conflict'); END;
