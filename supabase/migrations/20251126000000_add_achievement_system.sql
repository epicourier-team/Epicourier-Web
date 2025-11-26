-- Create achievement_definitions table
-- Stores the definitions of all possible achievements/badges in the system
CREATE TABLE IF NOT EXISTS achievement_definitions (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL, -- Unique identifier (e.g., 'first_meal', 'green_week')
  title TEXT NOT NULL, -- Display name (e.g., 'First Meal Logged')
  description TEXT, -- Human-readable description
  icon TEXT, -- Icon identifier for UI (e.g., 'utensils', 'leaf', 'calendar')
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  criteria JSONB NOT NULL, -- Achievement criteria (e.g., {"type": "count", "metric": "meals_logged", "target": 1})
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create user_achievements table
-- Tracks which achievements each user has earned
CREATE TABLE IF NOT EXISTS user_achievements (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id INT NOT NULL REFERENCES achievement_definitions(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT NOW(),
  progress JSONB, -- Optional progress data (e.g., {"current": 5, "target": 10})
  UNIQUE(user_id, achievement_id) -- Prevent duplicate achievements
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned_at ON user_achievements(earned_at DESC);
CREATE INDEX IF NOT EXISTS idx_achievement_definitions_name ON achievement_definitions(name);

-- Enable Row Level Security
ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievement_definitions
-- All authenticated users can read achievement definitions
CREATE POLICY "Authenticated users can view achievement definitions"
  ON achievement_definitions FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for user_achievements
-- Users can only view their own achievements
CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

-- Only the system (via service role) can insert achievements
-- This prevents users from manually granting themselves badges
CREATE POLICY "System can insert achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (false); -- Blocked at RLS level, API uses service role

-- Users cannot update or delete achievements once earned
CREATE POLICY "Achievements are immutable"
  ON user_achievements FOR UPDATE
  USING (false);

CREATE POLICY "Achievements cannot be deleted by users"
  ON user_achievements FOR DELETE
  USING (false);

-- Add comments for documentation
COMMENT ON TABLE achievement_definitions IS 'Defines all possible achievements/badges in the gamification system';
COMMENT ON TABLE user_achievements IS 'Tracks which achievements each user has earned';
COMMENT ON COLUMN achievement_definitions.criteria IS 'JSONB: {type: count|streak|threshold, metric: string, target: number}';
COMMENT ON COLUMN user_achievements.progress IS 'JSONB: Optional progress tracking data';

-- Insert seed data for initial achievements
INSERT INTO achievement_definitions (name, title, description, icon, tier, criteria) VALUES
  ('first_meal', 'First Meal', 'Log your very first meal', 'utensils', 'bronze', '{"type": "count", "metric": "meals_logged", "target": 1}'),
  ('consistent_tracker', '7-Day Streak', 'Log meals for 7 consecutive days', 'calendar', 'silver', '{"type": "streak", "metric": "days_tracked", "target": 7}'),
  ('green_champion', 'Green Champion', 'Use 5 sustainable recipes', 'leaf', 'silver', '{"type": "count", "metric": "green_recipes", "target": 5}'),
  ('nutrition_aware', 'Nutrition Aware', 'Check nutrient dashboard 10 times', 'activity', 'bronze', '{"type": "count", "metric": "dashboard_views", "target": 10}'),
  ('meal_master', 'Meal Master', 'Log 30 total meals', 'chef-hat', 'gold', '{"type": "count", "metric": "meals_logged", "target": 30}'),
  ('streak_legend', '30-Day Streak', 'Maintain a 30-day tracking streak', 'flame', 'gold', '{"type": "streak", "metric": "days_tracked", "target": 30}'),
  ('eco_warrior', 'Eco Warrior', 'Use 20 sustainable recipes', 'tree', 'gold', '{"type": "count", "metric": "green_recipes", "target": 20}'),
  ('data_enthusiast', 'Data Enthusiast', 'View nutrient dashboard 50 times', 'chart', 'silver', '{"type": "count", "metric": "dashboard_views", "target": 50}')
ON CONFLICT (name) DO NOTHING;
