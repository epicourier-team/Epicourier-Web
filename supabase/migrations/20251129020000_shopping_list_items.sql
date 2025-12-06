-- Migration: Create shopping_list_items table
-- Issue: #77
-- Description: Individual items within a shopping list

-- ============================================================================
-- TABLE: shopping_list_items
-- ============================================================================
-- Stores individual items in a shopping list
-- Items can be linked to ingredients from the database or be custom text

CREATE TABLE IF NOT EXISTS public.shopping_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shopping_list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
    ingredient_id INTEGER REFERENCES public."Ingredient"(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10, 2) DEFAULT 1,
    unit VARCHAR(50),
    category VARCHAR(100) DEFAULT 'Other',
    is_checked BOOLEAN NOT NULL DEFAULT FALSE,
    position INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for querying items by shopping list
CREATE INDEX idx_shopping_list_items_list_id ON public.shopping_list_items(shopping_list_id);

-- Index for sorting items by position within a list
CREATE INDEX idx_shopping_list_items_position ON public.shopping_list_items(shopping_list_id, position);

-- Index for filtering checked/unchecked items
CREATE INDEX idx_shopping_list_items_checked ON public.shopping_list_items(shopping_list_id, is_checked);

-- Index for grouping by category
CREATE INDEX idx_shopping_list_items_category ON public.shopping_list_items(shopping_list_id, category);

-- Index for ingredient lookup (find items linked to specific ingredient)
CREATE INDEX idx_shopping_list_items_ingredient ON public.shopping_list_items(ingredient_id) 
    WHERE ingredient_id IS NOT NULL;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view items in their own shopping lists
CREATE POLICY "Users can view own shopping list items"
    ON public.shopping_list_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.shopping_lists sl
            WHERE sl.id = shopping_list_id
            AND sl.user_id = auth.uid()
        )
    );

-- Policy: Users can insert items into their own shopping lists
CREATE POLICY "Users can create items in own shopping lists"
    ON public.shopping_list_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.shopping_lists sl
            WHERE sl.id = shopping_list_id
            AND sl.user_id = auth.uid()
        )
    );

-- Policy: Users can update items in their own shopping lists
CREATE POLICY "Users can update items in own shopping lists"
    ON public.shopping_list_items
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.shopping_lists sl
            WHERE sl.id = shopping_list_id
            AND sl.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.shopping_lists sl
            WHERE sl.id = shopping_list_id
            AND sl.user_id = auth.uid()
        )
    );

-- Policy: Users can delete items from their own shopping lists
CREATE POLICY "Users can delete items from own shopping lists"
    ON public.shopping_list_items
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.shopping_lists sl
            WHERE sl.id = shopping_list_id
            AND sl.user_id = auth.uid()
        )
    );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.shopping_list_items IS 'Individual items within a shopping list';
COMMENT ON COLUMN public.shopping_list_items.id IS 'Unique identifier for the item';
COMMENT ON COLUMN public.shopping_list_items.shopping_list_id IS 'Reference to the parent shopping list';
COMMENT ON COLUMN public.shopping_list_items.ingredient_id IS 'Optional reference to ingredient in database (for autocomplete/matching)';
COMMENT ON COLUMN public.shopping_list_items.item_name IS 'Display name of the item (can be custom text)';
COMMENT ON COLUMN public.shopping_list_items.quantity IS 'Amount needed (e.g., 2, 0.5)';
COMMENT ON COLUMN public.shopping_list_items.unit IS 'Unit of measurement (e.g., kg, pieces, cups)';
COMMENT ON COLUMN public.shopping_list_items.category IS 'Category for grouping (e.g., Produce, Dairy, Meat)';
COMMENT ON COLUMN public.shopping_list_items.is_checked IS 'Whether the item has been purchased/checked off';
COMMENT ON COLUMN public.shopping_list_items.position IS 'Order position for drag-and-drop sorting';
COMMENT ON COLUMN public.shopping_list_items.notes IS 'Optional notes (e.g., brand preference, store location)';
COMMENT ON COLUMN public.shopping_list_items.created_at IS 'Timestamp when the item was added';
