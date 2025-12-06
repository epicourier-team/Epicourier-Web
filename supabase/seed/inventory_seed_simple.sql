-- ============================================================================
-- INVENTORY SEED DATA - Simple Version
-- ============================================================================
-- 
-- HOW TO USE:
-- 1. Login to your Epicourier app first
-- 2. Open Supabase Dashboard -> SQL Editor
-- 3. Copy and paste this entire SQL
-- 4. Click "Run"
--
-- This will insert test inventory items with:
-- - Various expiration statuses (expired, critical, warning, good)
-- - Different locations (fridge, pantry, freezer)
-- - Some low stock items
-- ============================================================================

-- Get the current user's ID and insert inventory
INSERT INTO user_inventory (user_id, ingredient_id, quantity, unit, location, expiration_date, min_quantity, notes)
VALUES
    -- ========== FRIDGE ITEMS ==========
    -- Expired (Yogurt-like item - using Milk)
    (auth.uid(), 38, 2, 'cups', 'fridge', CURRENT_DATE - INTERVAL '1 day', NULL, '⚠️ Check before use - might be expired'),
    
    -- Critical (expires in 1-2 days)
    (auth.uid(), 39, 6, 'pieces', 'fridge', CURRENT_DATE + INTERVAL '1 day', 3, 'Fresh eggs - use soon!'),
    (auth.uid(), 44, 150, 'g', 'fridge', CURRENT_DATE + INTERVAL '2 days', 100, 'Cheddar cheese'),
    
    -- Warning (expires in 3-7 days)
    (auth.uid(), 24, 200, 'g', 'fridge', CURRENT_DATE + INTERVAL '5 days', NULL, 'Butter - salted'),
    (auth.uid(), 8, 100, 'g', 'fridge', CURRENT_DATE + INTERVAL '6 days', NULL, 'Feta cheese for salads'),
    
    -- Good (expires in 7+ days)
    (auth.uid(), 45, 80, 'g', 'fridge', CURRENT_DATE + INTERVAL '30 days', NULL, 'Parmesan - grated'),

    -- ========== PANTRY ITEMS ==========
    -- Good shelf life items
    (auth.uid(), 41, 500, 'g', 'pantry', CURRENT_DATE + INTERVAL '180 days', 200, 'All-purpose flour'),
    (auth.uid(), 40, 400, 'g', 'pantry', CURRENT_DATE + INTERVAL '365 days', 200, 'Granulated sugar'),
    (auth.uid(), 43, 200, 'g', 'pantry', NULL, 100, 'Table salt - never expires'),
    (auth.uid(), 2, 500, 'ml', 'pantry', CURRENT_DATE + INTERVAL '90 days', 200, 'Extra virgin olive oil'),
    (auth.uid(), 33, 300, 'ml', 'pantry', CURRENT_DATE + INTERVAL '365 days', NULL, 'Soy sauce'),
    (auth.uid(), 48, 350, 'g', 'pantry', CURRENT_DATE + INTERVAL '730 days', NULL, 'Pure honey'),
    
    -- Low stock items for testing alerts
    (auth.uid(), 7, 10, 'g', 'pantry', CURRENT_DATE + INTERVAL '14 days', 50, 'Minced garlic - LOW!'),
    (auth.uid(), 3, 50, 'g', 'pantry', CURRENT_DATE + INTERVAL '7 days', 100, 'Chopped onion - need more!'),

    -- ========== FREEZER ITEMS ==========
    -- Frozen proteins
    (auth.uid(), 12, 400, 'g', 'freezer', CURRENT_DATE + INTERVAL '60 days', NULL, 'Chicken breasts - boneless'),
    (auth.uid(), 32, 300, 'g', 'freezer', CURRENT_DATE + INTERVAL '45 days', NULL, 'Salmon fillets'),
    (auth.uid(), 1, 250, 'g', 'freezer', CURRENT_DATE + INTERVAL '30 days', NULL, 'Raw king prawns')

ON CONFLICT (user_id, ingredient_id, location) 
DO UPDATE SET 
    quantity = EXCLUDED.quantity,
    unit = EXCLUDED.unit,
    expiration_date = EXCLUDED.expiration_date,
    min_quantity = EXCLUDED.min_quantity,
    notes = EXCLUDED.notes,
    updated_at = NOW();

-- ============================================================================
-- VERIFY: Show all inserted inventory items
-- ============================================================================
SELECT 
    i.name as "Ingredient",
    ui.quantity,
    ui.unit,
    ui.location,
    ui.expiration_date as "Expires",
    CASE 
        WHEN ui.expiration_date IS NULL THEN '∞ No expiry'
        WHEN ui.expiration_date < CURRENT_DATE THEN '🔴 EXPIRED'
        WHEN ui.expiration_date <= CURRENT_DATE + INTERVAL '2 days' THEN '🟠 Critical'
        WHEN ui.expiration_date <= CURRENT_DATE + INTERVAL '7 days' THEN '🟡 Warning'
        ELSE '🟢 Good'
    END as "Status",
    CASE 
        WHEN ui.min_quantity IS NOT NULL AND ui.quantity <= ui.min_quantity THEN '⚠️ LOW STOCK'
        ELSE '✓ OK'
    END as "Stock",
    ui.notes
FROM user_inventory ui
JOIN "Ingredient" i ON ui.ingredient_id = i.id
WHERE ui.user_id = auth.uid()
ORDER BY 
    ui.location,
    CASE 
        WHEN ui.expiration_date IS NULL THEN 999
        WHEN ui.expiration_date < CURRENT_DATE THEN 0
        WHEN ui.expiration_date <= CURRENT_DATE + INTERVAL '2 days' THEN 1
        WHEN ui.expiration_date <= CURRENT_DATE + INTERVAL '7 days' THEN 2
        ELSE 3
    END,
    ui.expiration_date;
