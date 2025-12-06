-- Seed Data: Inventory test data for development
-- Run this SQL in Supabase SQL Editor after logging in
-- Replace 'YOUR_USER_ID' with your actual auth.users id

-- First, get some common ingredient IDs from the Ingredient table
-- Common ingredients that likely exist in your database

DO $$
DECLARE
    v_user_id UUID;
    v_ingredient_ids INT[];
    v_names TEXT[];
BEGIN
    -- Get current user ID (run this while logged in, or replace with actual UUID)
    SELECT auth.uid() INTO v_user_id;
    
    -- If no user found, you can manually set it:
    -- v_user_id := 'your-uuid-here'::UUID;
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'No user found. Please login or set user ID manually.';
        RETURN;
    END IF;

    RAISE NOTICE 'Inserting inventory for user: %', v_user_id;

    -- Insert inventory items with various expiration scenarios
    -- Uses ON CONFLICT to update if item already exists
    
    -- FRIDGE items (fresh, short shelf life)
    INSERT INTO user_inventory (user_id, ingredient_id, quantity, unit, location, expiration_date, min_quantity, notes)
    SELECT 
        v_user_id,
        i.id,
        CASE i.name
            WHEN 'Milk' THEN 2
            WHEN 'Eggs' THEN 12
            WHEN 'Butter' THEN 1
            WHEN 'Cheese' THEN 200
            WHEN 'Yogurt' THEN 4
            WHEN 'Cream' THEN 1
            ELSE 1
        END,
        CASE i.name
            WHEN 'Eggs' THEN 'pieces'
            WHEN 'Cheese' THEN 'g'
            WHEN 'Yogurt' THEN 'cups'
            ELSE 'unit'
        END,
        'fridge',
        CASE i.name
            WHEN 'Milk' THEN CURRENT_DATE + INTERVAL '2 days'  -- Critical
            WHEN 'Eggs' THEN CURRENT_DATE + INTERVAL '10 days' -- Good
            WHEN 'Butter' THEN CURRENT_DATE + INTERVAL '30 days' -- Good
            WHEN 'Cheese' THEN CURRENT_DATE + INTERVAL '5 days' -- Warning
            WHEN 'Yogurt' THEN CURRENT_DATE - INTERVAL '1 day' -- Expired!
            WHEN 'Cream' THEN CURRENT_DATE + INTERVAL '1 day' -- Critical
            ELSE CURRENT_DATE + INTERVAL '7 days'
        END,
        CASE i.name
            WHEN 'Milk' THEN 1
            WHEN 'Eggs' THEN 6
            ELSE NULL
        END,
        CASE i.name
            WHEN 'Yogurt' THEN 'Check before use - might be expired'
            ELSE NULL
        END
    FROM "Ingredient" i
    WHERE i.name IN ('Milk', 'Eggs', 'Butter', 'Cheese', 'Yogurt', 'Cream')
    ON CONFLICT (user_id, ingredient_id, location) 
    DO UPDATE SET 
        quantity = EXCLUDED.quantity,
        expiration_date = EXCLUDED.expiration_date,
        min_quantity = EXCLUDED.min_quantity,
        notes = EXCLUDED.notes,
        updated_at = NOW();

    -- PANTRY items (dry goods, longer shelf life)
    INSERT INTO user_inventory (user_id, ingredient_id, quantity, unit, location, expiration_date, min_quantity, notes)
    SELECT 
        v_user_id,
        i.id,
        CASE i.name
            WHEN 'Rice' THEN 500
            WHEN 'Pasta' THEN 250
            WHEN 'Flour' THEN 1000
            WHEN 'Sugar' THEN 500
            WHEN 'Salt' THEN 200
            WHEN 'Olive Oil' THEN 500
            WHEN 'Soy Sauce' THEN 250
            WHEN 'Garlic' THEN 5
            WHEN 'Onion' THEN 3
            ELSE 1
        END,
        CASE i.name
            WHEN 'Garlic' THEN 'cloves'
            WHEN 'Onion' THEN 'pieces'
            ELSE 'g'
        END,
        'pantry',
        CASE i.name
            WHEN 'Rice' THEN CURRENT_DATE + INTERVAL '180 days'
            WHEN 'Pasta' THEN CURRENT_DATE + INTERVAL '365 days'
            WHEN 'Flour' THEN CURRENT_DATE + INTERVAL '90 days'
            WHEN 'Sugar' THEN CURRENT_DATE + INTERVAL '730 days'
            WHEN 'Salt' THEN NULL  -- Salt doesn't expire
            WHEN 'Olive Oil' THEN CURRENT_DATE + INTERVAL '60 days'
            WHEN 'Soy Sauce' THEN CURRENT_DATE + INTERVAL '365 days'
            WHEN 'Garlic' THEN CURRENT_DATE + INTERVAL '14 days'
            WHEN 'Onion' THEN CURRENT_DATE + INTERVAL '21 days'
            ELSE CURRENT_DATE + INTERVAL '90 days'
        END,
        CASE i.name
            WHEN 'Rice' THEN 200
            WHEN 'Pasta' THEN 100
            WHEN 'Flour' THEN 500
            WHEN 'Salt' THEN 100
            ELSE NULL
        END,
        NULL
    FROM "Ingredient" i
    WHERE i.name IN ('Rice', 'Pasta', 'Flour', 'Sugar', 'Salt', 'Olive Oil', 'Soy Sauce', 'Garlic', 'Onion')
    ON CONFLICT (user_id, ingredient_id, location) 
    DO UPDATE SET 
        quantity = EXCLUDED.quantity,
        expiration_date = EXCLUDED.expiration_date,
        min_quantity = EXCLUDED.min_quantity,
        updated_at = NOW();

    -- FREEZER items (frozen, long shelf life)
    INSERT INTO user_inventory (user_id, ingredient_id, quantity, unit, location, expiration_date, min_quantity, notes)
    SELECT 
        v_user_id,
        i.id,
        CASE i.name
            WHEN 'Chicken' THEN 500
            WHEN 'Beef' THEN 300
            WHEN 'Pork' THEN 400
            WHEN 'Fish' THEN 250
            WHEN 'Shrimp' THEN 200
            ELSE 200
        END,
        'g',
        'freezer',
        CASE i.name
            WHEN 'Chicken' THEN CURRENT_DATE + INTERVAL '90 days'
            WHEN 'Beef' THEN CURRENT_DATE + INTERVAL '120 days'
            WHEN 'Pork' THEN CURRENT_DATE + INTERVAL '60 days'
            WHEN 'Fish' THEN CURRENT_DATE + INTERVAL '45 days'
            WHEN 'Shrimp' THEN CURRENT_DATE + INTERVAL '30 days'
            ELSE CURRENT_DATE + INTERVAL '60 days'
        END,
        NULL,
        CASE i.name
            WHEN 'Chicken' THEN 'Boneless breast'
            WHEN 'Fish' THEN 'Salmon fillet'
            ELSE NULL
        END
    FROM "Ingredient" i
    WHERE i.name IN ('Chicken', 'Beef', 'Pork', 'Fish', 'Shrimp')
    ON CONFLICT (user_id, ingredient_id, location) 
    DO UPDATE SET 
        quantity = EXCLUDED.quantity,
        expiration_date = EXCLUDED.expiration_date,
        notes = EXCLUDED.notes,
        updated_at = NOW();

    -- Add some LOW STOCK items to test alerts
    UPDATE user_inventory 
    SET quantity = 50, min_quantity = 200
    WHERE user_id = v_user_id 
    AND ingredient_id = (SELECT id FROM "Ingredient" WHERE name = 'Rice' LIMIT 1);

    UPDATE user_inventory 
    SET quantity = 50, min_quantity = 100
    WHERE user_id = v_user_id 
    AND ingredient_id = (SELECT id FROM "Ingredient" WHERE name = 'Pasta' LIMIT 1);

    RAISE NOTICE 'Inventory seed data inserted successfully!';
END $$;

-- Verify the data
SELECT 
    ui.id,
    i.name as ingredient_name,
    ui.quantity,
    ui.unit,
    ui.location,
    ui.expiration_date,
    CASE 
        WHEN ui.expiration_date < CURRENT_DATE THEN 'EXPIRED'
        WHEN ui.expiration_date <= CURRENT_DATE + INTERVAL '2 days' THEN 'CRITICAL'
        WHEN ui.expiration_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'WARNING'
        ELSE 'GOOD'
    END as expiration_status,
    CASE 
        WHEN ui.min_quantity IS NOT NULL AND ui.quantity <= ui.min_quantity THEN 'LOW STOCK'
        ELSE 'OK'
    END as stock_status,
    ui.notes
FROM user_inventory ui
JOIN "Ingredient" i ON ui.ingredient_id = i.id
ORDER BY ui.location, ui.expiration_date NULLS LAST;
