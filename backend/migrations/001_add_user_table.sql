-- Migration: Add auto-sync trigger for existing User table
-- This migration sets up automatic syncing with Supabase Auth
-- NOTE: The User table already exists with the following structure:
--   - id: BIGINT (auto-increment primary key)
--   - auth_id: UUID (references auth.users.id)
--   - email, username, fullname: VARCHAR
--   - created_at, updated_at: TIMESTAMP

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public."User" (auth_id, email, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NOW(), NOW());
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- If user already exists, just return (prevents errors on re-runs)
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger to automatically create User record on auth signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Verify the trigger was created
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
