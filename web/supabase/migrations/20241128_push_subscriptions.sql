-- =====================================================
-- Push Notifications Database Migration
-- Issue #63: Browser push notification service for achievements
-- =====================================================

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id 
ON push_subscriptions(user_id);

-- Enable Row Level Security
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own subscriptions
CREATE POLICY "Users can view own push subscriptions"
ON push_subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own subscriptions
CREATE POLICY "Users can insert own push subscriptions"
ON push_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own subscriptions
CREATE POLICY "Users can delete own push subscriptions"
ON push_subscriptions FOR DELETE
USING (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, DELETE ON push_subscriptions TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE push_subscriptions_id_seq TO authenticated;

-- =====================================================
-- Optional: Add notification_preferences column to User table
-- =====================================================
-- ALTER TABLE "User" 
-- ADD COLUMN IF NOT EXISTS notification_preferences JSONB 
-- DEFAULT '{"achievements": true, "streaks": true, "challenges": true}'::jsonb;

-- =====================================================
-- Service role policy for sending notifications
-- (backend needs to query all subscriptions for a user)
-- =====================================================
CREATE POLICY "Service role can manage all push subscriptions"
ON push_subscriptions FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
