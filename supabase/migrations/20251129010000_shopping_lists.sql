-- Migration: Create shopping_lists table
-- Issue: #76
-- Description: Shopping list metadata for users to organize their grocery shopping

-- ============================================================================
-- TABLE: shopping_lists
-- ============================================================================
-- Stores user's shopping list metadata
-- Each user can have multiple shopping lists (e.g., "Weekly Groceries", "Party Planning")

CREATE TABLE IF NOT EXISTS public.shopping_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for querying user's shopping lists
CREATE INDEX idx_shopping_lists_user_id ON public.shopping_lists(user_id);

-- Index for filtering active (non-archived) lists
CREATE INDEX idx_shopping_lists_user_archived ON public.shopping_lists(user_id, is_archived);

-- Index for sorting by updated_at (most recently updated first)
CREATE INDEX idx_shopping_lists_updated_at ON public.shopping_lists(updated_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp on row modification
CREATE OR REPLACE FUNCTION update_shopping_lists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_shopping_lists_updated_at
    BEFORE UPDATE ON public.shopping_lists
    FOR EACH ROW
    EXECUTE FUNCTION update_shopping_lists_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own shopping lists
CREATE POLICY "Users can view own shopping lists"
    ON public.shopping_lists
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own shopping lists
CREATE POLICY "Users can create own shopping lists"
    ON public.shopping_lists
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own shopping lists
CREATE POLICY "Users can update own shopping lists"
    ON public.shopping_lists
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own shopping lists
CREATE POLICY "Users can delete own shopping lists"
    ON public.shopping_lists
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.shopping_lists IS 'User shopping list metadata for organizing grocery shopping';
COMMENT ON COLUMN public.shopping_lists.id IS 'Unique identifier for the shopping list';
COMMENT ON COLUMN public.shopping_lists.user_id IS 'Reference to the user who owns this list';
COMMENT ON COLUMN public.shopping_lists.name IS 'Display name of the shopping list';
COMMENT ON COLUMN public.shopping_lists.description IS 'Optional description or notes for the list';
COMMENT ON COLUMN public.shopping_lists.is_archived IS 'Whether the list is archived (soft delete)';
COMMENT ON COLUMN public.shopping_lists.created_at IS 'Timestamp when the list was created';
COMMENT ON COLUMN public.shopping_lists.updated_at IS 'Timestamp when the list was last modified';
