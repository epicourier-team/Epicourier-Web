-- ============================================================================
-- Allow multiple challenge joins (History Support)
-- 
-- Drops the unique constraint on (user_id, challenge_id) to allow users to
-- join the same challenge multiple times (e.g., once per week/month).
-- ============================================================================

ALTER TABLE user_challenges
DROP CONSTRAINT IF EXISTS user_challenges_user_id_challenge_id_key;
