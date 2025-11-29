-- Streak System Database Schema
-- Epic #67: Streak tracking for user engagement

-- Create streak_history table for tracking various streak types
CREATE TABLE IF NOT EXISTS streak_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  streak_type TEXT NOT NULL CHECK (streak_type IN ('daily_log', 'nutrient_goal', 'green_recipe')),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE(user_id, streak_type)
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_streak_history_user_id ON streak_history(user_id);
CREATE INDEX IF NOT EXISTS idx_streak_history_streak_type ON streak_history(streak_type);

-- Enable Row Level Security
ALTER TABLE streak_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see and modify their own streak data
CREATE POLICY "Users can view own streaks"
  ON streak_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streaks"
  ON streak_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks"
  ON streak_history FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update streak on activity
CREATE OR REPLACE FUNCTION update_streak(
  p_user_id UUID,
  p_streak_type TEXT,
  p_activity_date DATE DEFAULT CURRENT_DATE
)
RETURNS streak_history AS $$
DECLARE
  v_streak streak_history;
  v_days_since_last INTEGER;
BEGIN
  -- Get or create streak record
  INSERT INTO streak_history (user_id, streak_type, current_streak, longest_streak, last_activity_date)
  VALUES (p_user_id, p_streak_type, 0, 0, NULL)
  ON CONFLICT (user_id, streak_type) DO NOTHING;
  
  -- Get current streak record
  SELECT * INTO v_streak FROM streak_history 
  WHERE user_id = p_user_id AND streak_type = p_streak_type;
  
  -- Calculate days since last activity
  IF v_streak.last_activity_date IS NULL THEN
    v_days_since_last := NULL;
  ELSE
    v_days_since_last := p_activity_date - v_streak.last_activity_date;
  END IF;
  
  -- Update streak based on activity
  IF v_days_since_last IS NULL OR v_days_since_last > 1 THEN
    -- First activity or streak broken - start new streak
    UPDATE streak_history
    SET current_streak = 1,
        last_activity_date = p_activity_date,
        updated_at = timezone('utc', now())
    WHERE user_id = p_user_id AND streak_type = p_streak_type;
  ELSIF v_days_since_last = 1 THEN
    -- Consecutive day - increment streak
    UPDATE streak_history
    SET current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        last_activity_date = p_activity_date,
        updated_at = timezone('utc', now())
    WHERE user_id = p_user_id AND streak_type = p_streak_type;
  ELSIF v_days_since_last = 0 THEN
    -- Same day activity - no change needed, but update timestamp
    UPDATE streak_history
    SET updated_at = timezone('utc', now())
    WHERE user_id = p_user_id AND streak_type = p_streak_type;
  END IF;
  
  -- Return updated streak
  SELECT * INTO v_streak FROM streak_history 
  WHERE user_id = p_user_id AND streak_type = p_streak_type;
  
  RETURN v_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on function
GRANT EXECUTE ON FUNCTION update_streak TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE streak_history IS 'Tracks user streaks for gamification (daily logging, nutrient goals, green recipes)';
COMMENT ON COLUMN streak_history.streak_type IS 'Type of streak: daily_log, nutrient_goal, green_recipe';
COMMENT ON COLUMN streak_history.current_streak IS 'Current consecutive days count';
COMMENT ON COLUMN streak_history.longest_streak IS 'Personal best streak count';
