-- Migration: Fix ingredient_id type mismatch
-- Issue: Type mismatch between Ingredient.id (BIGINT) and shopping_list_items/user_inventory ingredient_id (INTEGER)
-- Description: Change ingredient_id columns to BIGINT to match Ingredient table

-- ============================================================================
-- Fix shopping_list_items table
-- ============================================================================

-- Drop the existing foreign key constraint first
ALTER TABLE public.shopping_list_items 
    DROP CONSTRAINT IF EXISTS shopping_list_items_ingredient_id_fkey;

-- Change the column type from INTEGER to BIGINT
ALTER TABLE public.shopping_list_items 
    ALTER COLUMN ingredient_id TYPE BIGINT;

-- Re-add the foreign key constraint
ALTER TABLE public.shopping_list_items 
    ADD CONSTRAINT shopping_list_items_ingredient_id_fkey 
    FOREIGN KEY (ingredient_id) 
    REFERENCES public."Ingredient"(id) 
    ON DELETE SET NULL;

-- ============================================================================
-- Fix user_inventory table
-- ============================================================================

-- First, drop the views that depend on the ingredient_id column
DROP VIEW IF EXISTS public.expiring_inventory;
DROP VIEW IF EXISTS public.low_stock_inventory;

-- Drop the existing foreign key constraint
ALTER TABLE public.user_inventory 
    DROP CONSTRAINT IF EXISTS user_inventory_ingredient_id_fkey;

-- Change the column type from INTEGER to BIGINT
ALTER TABLE public.user_inventory 
    ALTER COLUMN ingredient_id TYPE BIGINT;

-- Re-add the foreign key constraint
ALTER TABLE public.user_inventory 
    ADD CONSTRAINT user_inventory_ingredient_id_fkey 
    FOREIGN KEY (ingredient_id) 
    REFERENCES public."Ingredient"(id) 
    ON DELETE CASCADE;

-- Recreate the views
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
-- Comments
-- ============================================================================

COMMENT ON COLUMN public.shopping_list_items.ingredient_id IS 'Reference to ingredient in database (BIGINT to match Ingredient.id)';
COMMENT ON COLUMN public.user_inventory.ingredient_id IS 'Reference to ingredient in database (BIGINT to match Ingredient.id)';
COMMENT ON VIEW public.expiring_inventory IS 'Items expiring within 7 days';
COMMENT ON VIEW public.low_stock_inventory IS 'Items at or below minimum stock threshold';
