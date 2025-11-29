-- Migration: Create user_inventory table
-- Issue: #78
-- Description: Track user's available ingredients at home (pantry, fridge, freezer)

-- ============================================================================
-- TABLE: user_inventory
-- ============================================================================
-- Stores user's inventory of ingredients at home
-- Used for recipe matching and expiration tracking

CREATE TABLE IF NOT EXISTS public.user_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ingredient_id INTEGER NOT NULL REFERENCES public."Ingredient"(id) ON DELETE CASCADE,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
    unit VARCHAR(50),
    location VARCHAR(50) NOT NULL DEFAULT 'pantry' 
        CHECK (location IN ('pantry', 'fridge', 'freezer', 'other')),
    expiration_date DATE,
    min_quantity DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure each user has only one entry per ingredient per location
    CONSTRAINT unique_user_ingredient_location UNIQUE (user_id, ingredient_id, location)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for querying user's inventory
CREATE INDEX idx_user_inventory_user_id ON public.user_inventory(user_id);

-- Index for filtering by location
CREATE INDEX idx_user_inventory_location ON public.user_inventory(user_id, location);

-- Index for expiration date queries (find expiring items)
CREATE INDEX idx_user_inventory_expiration ON public.user_inventory(user_id, expiration_date)
    WHERE expiration_date IS NOT NULL;

-- Index for low stock alerts (items below minimum quantity)
CREATE INDEX idx_user_inventory_low_stock ON public.user_inventory(user_id)
    WHERE min_quantity IS NOT NULL AND quantity <= min_quantity;

-- Index for ingredient lookup (for recipe matching)
CREATE INDEX idx_user_inventory_ingredient ON public.user_inventory(ingredient_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp on row modification
CREATE OR REPLACE FUNCTION update_user_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_inventory_updated_at
    BEFORE UPDATE ON public.user_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_user_inventory_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own inventory
CREATE POLICY "Users can view own inventory"
    ON public.user_inventory
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert into their own inventory
CREATE POLICY "Users can create own inventory items"
    ON public.user_inventory
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own inventory
CREATE POLICY "Users can update own inventory"
    ON public.user_inventory
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete from their own inventory
CREATE POLICY "Users can delete own inventory items"
    ON public.user_inventory
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View: Items expiring within the next 7 days
CREATE OR REPLACE VIEW public.expiring_inventory AS
SELECT 
    ui.*,
    i.name AS ingredient_name,
    (ui.expiration_date - CURRENT_DATE) AS days_until_expiration
FROM public.user_inventory ui
JOIN public."Ingredient" i ON ui.ingredient_id = i.id
WHERE ui.expiration_date IS NOT NULL
  AND ui.expiration_date <= CURRENT_DATE + INTERVAL '7 days'
  AND ui.expiration_date >= CURRENT_DATE
ORDER BY ui.expiration_date ASC;

-- View: Low stock items (quantity at or below minimum)
CREATE OR REPLACE VIEW public.low_stock_inventory AS
SELECT 
    ui.*,
    i.name AS ingredient_name,
    (ui.min_quantity - ui.quantity) AS quantity_needed
FROM public.user_inventory ui
JOIN public."Ingredient" i ON ui.ingredient_id = i.id
WHERE ui.min_quantity IS NOT NULL
  AND ui.quantity <= ui.min_quantity
ORDER BY (ui.min_quantity - ui.quantity) DESC;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.user_inventory IS 'User inventory tracking for ingredients at home';
COMMENT ON COLUMN public.user_inventory.id IS 'Unique identifier for the inventory entry';
COMMENT ON COLUMN public.user_inventory.user_id IS 'Reference to the user who owns this inventory';
COMMENT ON COLUMN public.user_inventory.ingredient_id IS 'Reference to the ingredient in the database';
COMMENT ON COLUMN public.user_inventory.quantity IS 'Current quantity available';
COMMENT ON COLUMN public.user_inventory.unit IS 'Unit of measurement (e.g., kg, pieces, ml)';
COMMENT ON COLUMN public.user_inventory.location IS 'Storage location: pantry, fridge, freezer, or other';
COMMENT ON COLUMN public.user_inventory.expiration_date IS 'Expected expiration date for perishables';
COMMENT ON COLUMN public.user_inventory.min_quantity IS 'Minimum quantity threshold for low stock alerts';
COMMENT ON COLUMN public.user_inventory.notes IS 'Optional notes (e.g., brand, purchase date)';
COMMENT ON COLUMN public.user_inventory.created_at IS 'Timestamp when the item was added to inventory';
COMMENT ON COLUMN public.user_inventory.updated_at IS 'Timestamp when the item was last modified';
COMMENT ON VIEW public.expiring_inventory IS 'Items expiring within 7 days';
COMMENT ON VIEW public.low_stock_inventory IS 'Items at or below minimum stock threshold';
