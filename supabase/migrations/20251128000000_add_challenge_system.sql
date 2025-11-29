-- ============================================================================
-- Challenge System Database Schema
-- Issue #57: feat(database): Challenge system database schema
-- 
-- This migration creates tables to support weekly/monthly challenges
-- in the gamification system.
-- ============================================================================

-- Create challenges table
-- Stores system-defined or admin-created challenges
CREATE TABLE IF NOT EXISTS challenges (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,           -- Unique identifier (e.g., 'weekly_green_5')
  title TEXT NOT NULL,                 -- Display name (e.g., 'Green Week Champion')
  description TEXT,                    -- Human-readable description
  type TEXT NOT NULL CHECK (type IN ('weekly', 'monthly', 'special')),
  criteria JSONB NOT NULL,             -- Challenge criteria (e.g., {"metric": "green_recipes", "target": 5})
  reward_achievement_id INTEGER REFERENCES achievement_definitions(id) ON DELETE SET NULL,
  start_date DATE,                     -- NULL for recurring challenges
  end_date DATE,                       -- NULL for recurring challenges
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create user_challenges table
-- Tracks user participation and progress in challenges
CREATE TABLE IF NOT EXISTS user_challenges (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  progress JSONB,                      -- Progress tracking (e.g., {"current": 3, "target": 5})
  completed_at TIMESTAMP,              -- NULL if not completed
  UNIQUE(user_id, challenge_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_challenges_type ON challenges(type);
CREATE INDEX IF NOT EXISTS idx_challenges_is_active ON challenges(is_active);
CREATE INDEX IF NOT EXISTS idx_challenges_dates ON challenges(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_challenge_id ON user_challenges(challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_completed_at ON user_challenges(completed_at);

-- Enable Row Level Security
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for challenges table
-- ============================================================================

-- All authenticated users can view active challenges
CREATE POLICY "Authenticated users can view active challenges"
  ON challenges FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Only admins/system can manage challenges (blocked at RLS level)
CREATE POLICY "System can insert challenges"
  ON challenges FOR INSERT
  WITH CHECK (false);

CREATE POLICY "System can update challenges"
  ON challenges FOR UPDATE
  USING (false);

CREATE POLICY "System can delete challenges"
  ON challenges FOR DELETE
  USING (false);

-- ============================================================================
-- RLS Policies for user_challenges table
-- ============================================================================

-- Users can view their own challenge participation
CREATE POLICY "Users can view own challenges"
  ON user_challenges FOR SELECT
  USING (auth.uid() = user_id);

-- Users can join challenges (insert their own participation)
CREATE POLICY "Users can join challenges"
  ON user_challenges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- System can update progress (via service role)
-- Users cannot manually update their progress
CREATE POLICY "System can update challenge progress"
  ON user_challenges FOR UPDATE
  USING (false);

-- Users cannot delete their challenge participation
CREATE POLICY "Challenge participation cannot be deleted"
  ON user_challenges FOR DELETE
  USING (false);

-- ============================================================================
-- Table Comments
-- ============================================================================

COMMENT ON TABLE challenges IS 'System-defined challenges (weekly, monthly, special) for the gamification system';
COMMENT ON TABLE user_challenges IS 'Tracks user participation and progress in challenges';

COMMENT ON COLUMN challenges.type IS 'Challenge type: weekly, monthly, or special (one-time events)';
COMMENT ON COLUMN challenges.criteria IS 'JSONB: {metric: string, target: number, period?: string}';
COMMENT ON COLUMN challenges.reward_achievement_id IS 'Optional achievement awarded upon challenge completion';
COMMENT ON COLUMN user_challenges.progress IS 'JSONB: {current: number, target: number}';
COMMENT ON COLUMN user_challenges.completed_at IS 'Timestamp when challenge was completed, NULL if in progress';

-- ============================================================================
-- Seed Data: Initial Challenges
-- ============================================================================

INSERT INTO challenges (name, title, description, type, criteria, start_date, end_date, is_active) VALUES
  -- Weekly Recurring Challenges (no start/end date)
  ('weekly_green_5', 'Green Week Champion', 'Log 5 sustainable/green recipes this week', 'weekly', 
   '{"metric": "green_recipes", "target": 5, "period": "week"}', NULL, NULL, true),
  
  ('weekly_meals_14', 'Consistent Logger', 'Log at least 14 meals this week (2 per day average)', 'weekly',
   '{"metric": "meals_logged", "target": 14, "period": "week"}', NULL, NULL, true),
  
  ('weekly_streak_7', 'Week Warrior', 'Maintain a 7-day logging streak', 'weekly',
   '{"metric": "streak_days", "target": 7, "period": "week"}', NULL, NULL, true),

  -- Monthly Recurring Challenges
  ('monthly_nutrient_80', 'Nutrition Master', 'Achieve 80% of your nutrient goals for 20+ days this month', 'monthly',
   '{"metric": "nutrient_goal_days", "target": 20, "period": "month"}', NULL, NULL, true),
  
  ('monthly_green_20', 'Eco Champion', 'Use 20 sustainable recipes this month', 'monthly',
   '{"metric": "green_recipes", "target": 20, "period": "month"}', NULL, NULL, true),
  
  ('monthly_meals_60', 'Meal Planning Pro', 'Log 60 meals this month (consistent 2/day)', 'monthly',
   '{"metric": "meals_logged", "target": 60, "period": "month"}', NULL, NULL, true)

ON CONFLICT (name) DO NOTHING;
