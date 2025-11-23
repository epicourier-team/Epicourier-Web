-- Create nutrient_goals table to store a user's target macros and micros
CREATE TABLE IF NOT EXISTS nutrient_goals (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  calories_kcal NUMERIC(10, 2) DEFAULT 0,
  protein_g NUMERIC(10, 2) DEFAULT 0,
  carbs_g NUMERIC(10, 2) DEFAULT 0,
  fats_g NUMERIC(10, 2) DEFAULT 0,
  sodium_mg NUMERIC(10, 2) DEFAULT 0,
  fiber_g NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Primary key enforces single-row-per-user and provides an index for lookups

-- Enable Row Level Security
ALTER TABLE nutrient_goals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own nutrient goals
CREATE POLICY "Users can view own nutrient goals"
  ON nutrient_goals FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own nutrient goals
CREATE POLICY "Users can insert own nutrient goals"
  ON nutrient_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own nutrient goals
CREATE POLICY "Users can update own nutrient goals"
  ON nutrient_goals FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own nutrient goals
CREATE POLICY "Users can delete own nutrient goals"
  ON nutrient_goals FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE nutrient_goals IS 'Stores per-user nutrient targets for goal tracking';
