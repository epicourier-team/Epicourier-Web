-- Helper to generate immutable month start dates for indexes/generated columns
CREATE OR REPLACE FUNCTION immutable_month_start(d DATE)
RETURNS DATE
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT DATE_TRUNC('month', d)::DATE;
$$;

-- Create nutrient_tracking table for storing daily aggregated nutrient data
CREATE TABLE IF NOT EXISTS nutrient_tracking (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  month_start DATE GENERATED ALWAYS AS (immutable_month_start(date)) STORED,
  calories_kcal NUMERIC(10,2) DEFAULT 0,
  protein_g NUMERIC(10,2) DEFAULT 0,
  carbs_g NUMERIC(10,2) DEFAULT 0,
  fats_g NUMERIC(10,2) DEFAULT 0,
  fiber_g NUMERIC(10,2) DEFAULT 0,
  sugar_g NUMERIC(10,2) DEFAULT 0,
  sodium_mg NUMERIC(10,2) DEFAULT 0,
  meal_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create index for efficient queries by user and date
CREATE INDEX idx_nutrient_tracking_user_date ON nutrient_tracking(user_id, date DESC);

-- Use generated month_start column to keep index expression immutable
CREATE INDEX idx_nutrient_tracking_user_month ON nutrient_tracking(user_id, month_start);

-- Enable Row Level Security
ALTER TABLE nutrient_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own nutrient data
CREATE POLICY "Users can view own nutrient data"
  ON nutrient_tracking FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own nutrient data
CREATE POLICY "Users can insert own nutrient data"
  ON nutrient_tracking FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own nutrient data
CREATE POLICY "Users can update own nutrient data"
  ON nutrient_tracking FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own nutrient data
CREATE POLICY "Users can delete own nutrient data"
  ON nutrient_tracking FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE nutrient_tracking IS 'Stores daily aggregated nutrient data calculated from user meal logs';
