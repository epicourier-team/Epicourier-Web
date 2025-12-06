-- ============================================================================
-- Fix RLS Policy for user_challenges table
-- Issue #123: Challenge progress not syncing to database
--
-- The original policy blocked ALL updates. We need to allow users to update
-- their own challenge progress through the API.
-- ============================================================================

-- Drop the restrictive policy
DROP POLICY IF EXISTS "System can update challenge progress" ON user_challenges;

-- Create a new policy that allows users to update their own challenges
CREATE POLICY "Users can update own challenge progress"
  ON user_challenges FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add comment explaining the policy
COMMENT ON POLICY "Users can update own challenge progress" ON user_challenges 
  IS 'Allows users to update their own challenge progress and completion status';
