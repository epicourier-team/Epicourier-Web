-- Seed Data: Shopping list test data for development
-- Run this SQL in Supabase SQL Editor after logging in
-- Replace 'YOUR_USER_ID' with your actual auth.users id

-- ============================================================================
-- SHOPPING LIST SEED DATA
-- ============================================================================
-- Creates sample shopping lists with items in various categories and states
-- Includes both linked ingredients and custom items

DO $$
DECLARE
    v_user_id UUID;
    v_weekly_list_id UUID;
    v_party_list_id UUID;
    v_baking_list_id UUID;
    v_archived_list_id UUID;
    v_position INT;
BEGIN
    -- Get current user ID (run this while logged in, or replace with actual UUID)
    SELECT auth.uid() INTO v_user_id;
    
    -- If no user found, you can manually set it:
    -- v_user_id := 'your-uuid-here'::UUID;
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'No user found. Please login or set user ID manually.';
        RETURN;
    END IF;

    RAISE NOTICE 'Inserting shopping lists for user: %', v_user_id;

    -- ========================================================================
    -- CREATE SHOPPING LISTS
    -- ========================================================================
    
    -- 1. Weekly Groceries (Active, most used)
    INSERT INTO shopping_lists (user_id, name, description, is_archived)
    VALUES (
        v_user_id, 
        'Weekly Groceries', 
        'Regular weekly shopping list for household essentials',
        FALSE
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_weekly_list_id;

    -- If list already exists, get its ID
    IF v_weekly_list_id IS NULL THEN
        SELECT id INTO v_weekly_list_id 
        FROM shopping_lists 
        WHERE user_id = v_user_id AND name = 'Weekly Groceries'
        LIMIT 1;
    END IF;

    -- 2. Party Planning
    INSERT INTO shopping_lists (user_id, name, description, is_archived)
    VALUES (
        v_user_id, 
        'Party Planning', 
        'Ingredients for the weekend BBQ party',
        FALSE
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_party_list_id;

    IF v_party_list_id IS NULL THEN
        SELECT id INTO v_party_list_id 
        FROM shopping_lists 
        WHERE user_id = v_user_id AND name = 'Party Planning'
        LIMIT 1;
    END IF;

    -- 3. Baking Project
    INSERT INTO shopping_lists (user_id, name, description, is_archived)
    VALUES (
        v_user_id, 
        'Baking Project', 
        'Items needed for birthday cake',
        FALSE
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_baking_list_id;

    IF v_baking_list_id IS NULL THEN
        SELECT id INTO v_baking_list_id 
        FROM shopping_lists 
        WHERE user_id = v_user_id AND name = 'Baking Project'
        LIMIT 1;
    END IF;

    -- 4. Archived list (Old completed list)
    INSERT INTO shopping_lists (user_id, name, description, is_archived)
    VALUES (
        v_user_id, 
        'Last Week Groceries', 
        'Completed shopping from last week',
        TRUE
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_archived_list_id;

    IF v_archived_list_id IS NULL THEN
        SELECT id INTO v_archived_list_id 
        FROM shopping_lists 
        WHERE user_id = v_user_id AND name = 'Last Week Groceries'
        LIMIT 1;
    END IF;

    -- ========================================================================
    -- WEEKLY GROCERIES ITEMS (Mixed states: checked and unchecked)
    -- ========================================================================
    
    -- Clear existing items for this list to avoid duplicates
    DELETE FROM shopping_list_items WHERE shopping_list_id = v_weekly_list_id;
    
    v_position := 0;

    -- Dairy items (some checked, some not)
    INSERT INTO shopping_list_items (shopping_list_id, ingredient_id, item_name, quantity, unit, category, is_checked, position, notes)
    SELECT 
        v_weekly_list_id,
        i.id,
        i.name,
        CASE i.name
            WHEN 'Milk' THEN 2
            WHEN 'Eggs' THEN 12
            WHEN 'Butter' THEN 1
            WHEN 'Cheese' THEN 200
            WHEN 'Yogurt' THEN 4
            ELSE 1
        END,
        CASE i.name
            WHEN 'Eggs' THEN 'pieces'
            WHEN 'Cheese' THEN 'g'
            WHEN 'Yogurt' THEN 'cups'
            ELSE 'carton'
        END,
        'Dairy',
        CASE i.name
            WHEN 'Milk' THEN TRUE  -- Already bought
            WHEN 'Eggs' THEN TRUE  -- Already bought
            ELSE FALSE
        END,
        ROW_NUMBER() OVER (ORDER BY i.name),
        CASE i.name
            WHEN 'Cheese' THEN 'Get cheddar for sandwiches'
            WHEN 'Yogurt' THEN 'Greek yogurt preferred'
            ELSE NULL
        END
    FROM "Ingredient" i
    WHERE i.name IN ('Milk', 'Eggs', 'Butter', 'Cheese', 'Yogurt');

    -- Produce items
    INSERT INTO shopping_list_items (shopping_list_id, ingredient_id, item_name, quantity, unit, category, is_checked, position, notes)
    SELECT 
        v_weekly_list_id,
        i.id,
        i.name,
        CASE i.name
            WHEN 'Onion' THEN 3
            WHEN 'Garlic' THEN 1
            WHEN 'Tomato' THEN 4
            WHEN 'Carrot' THEN 6
            WHEN 'Potato' THEN 5
            WHEN 'Broccoli' THEN 1
            ELSE 1
        END,
        CASE i.name
            WHEN 'Garlic' THEN 'head'
            WHEN 'Broccoli' THEN 'head'
            ELSE 'pieces'
        END,
        'Produce',
        FALSE,
        10 + ROW_NUMBER() OVER (ORDER BY i.name),
        CASE i.name
            WHEN 'Tomato' THEN 'Ripe for salads'
            ELSE NULL
        END
    FROM "Ingredient" i
    WHERE i.name IN ('Onion', 'Garlic', 'Tomato', 'Carrot', 'Potato', 'Broccoli');

    -- Meat items
    INSERT INTO shopping_list_items (shopping_list_id, ingredient_id, item_name, quantity, unit, category, is_checked, position, notes)
    SELECT 
        v_weekly_list_id,
        i.id,
        i.name,
        CASE i.name
            WHEN 'Chicken' THEN 500
            WHEN 'Beef' THEN 400
            ELSE 300
        END,
        'g',
        'Meat',
        FALSE,
        20 + ROW_NUMBER() OVER (ORDER BY i.name),
        CASE i.name
            WHEN 'Chicken' THEN 'Boneless breast for stir fry'
            WHEN 'Beef' THEN 'Ground beef for tacos'
            ELSE NULL
        END
    FROM "Ingredient" i
    WHERE i.name IN ('Chicken', 'Beef', 'Pork');

    -- Custom items (no ingredient_id - user-created)
    INSERT INTO shopping_list_items (shopping_list_id, ingredient_id, item_name, quantity, unit, category, is_checked, position, notes)
    VALUES 
        (v_weekly_list_id, NULL, 'Paper Towels', 2, 'rolls', 'Household', FALSE, 30, 'Get the large ones'),
        (v_weekly_list_id, NULL, 'Dish Soap', 1, 'bottle', 'Household', TRUE, 31, NULL),
        (v_weekly_list_id, NULL, 'Trash Bags', 1, 'box', 'Household', FALSE, 32, '13 gallon size');

    -- ========================================================================
    -- PARTY PLANNING ITEMS
    -- ========================================================================
    
    DELETE FROM shopping_list_items WHERE shopping_list_id = v_party_list_id;

    -- BBQ meats
    INSERT INTO shopping_list_items (shopping_list_id, ingredient_id, item_name, quantity, unit, category, is_checked, position, notes)
    SELECT 
        v_party_list_id,
        i.id,
        i.name,
        CASE i.name
            WHEN 'Beef' THEN 2000
            WHEN 'Chicken' THEN 1500
            WHEN 'Pork' THEN 1000
            ELSE 500
        END,
        'g',
        'Meat',
        FALSE,
        ROW_NUMBER() OVER (ORDER BY i.name),
        CASE i.name
            WHEN 'Beef' THEN 'Ribeye steaks for grilling'
            WHEN 'Chicken' THEN 'Wings and drumsticks'
            WHEN 'Pork' THEN 'Ribs'
            ELSE NULL
        END
    FROM "Ingredient" i
    WHERE i.name IN ('Beef', 'Chicken', 'Pork');

    -- Veggies for grilling
    INSERT INTO shopping_list_items (shopping_list_id, ingredient_id, item_name, quantity, unit, category, is_checked, position, notes)
    SELECT 
        v_party_list_id,
        i.id,
        i.name,
        CASE i.name
            WHEN 'Onion' THEN 5
            WHEN 'Bell Pepper' THEN 6
            WHEN 'Corn' THEN 8
            ELSE 4
        END,
        'pieces',
        'Produce',
        FALSE,
        10 + ROW_NUMBER() OVER (ORDER BY i.name),
        NULL
    FROM "Ingredient" i
    WHERE i.name IN ('Onion', 'Bell Pepper', 'Corn', 'Mushroom');

    -- Party supplies (custom items)
    INSERT INTO shopping_list_items (shopping_list_id, ingredient_id, item_name, quantity, unit, category, is_checked, position, notes)
    VALUES 
        (v_party_list_id, NULL, 'Charcoal', 2, 'bags', 'Supplies', FALSE, 20, NULL),
        (v_party_list_id, NULL, 'BBQ Sauce', 2, 'bottles', 'Condiments', FALSE, 21, 'Original and spicy'),
        (v_party_list_id, NULL, 'Paper Plates', 50, 'pieces', 'Supplies', FALSE, 22, 'Heavy duty'),
        (v_party_list_id, NULL, 'Napkins', 100, 'pieces', 'Supplies', FALSE, 23, NULL),
        (v_party_list_id, NULL, 'Ice', 3, 'bags', 'Drinks', FALSE, 24, 'Get extra'),
        (v_party_list_id, NULL, 'Soft Drinks', 24, 'cans', 'Drinks', FALSE, 25, 'Assorted flavors');

    -- ========================================================================
    -- BAKING PROJECT ITEMS
    -- ========================================================================
    
    DELETE FROM shopping_list_items WHERE shopping_list_id = v_baking_list_id;

    -- Baking ingredients
    INSERT INTO shopping_list_items (shopping_list_id, ingredient_id, item_name, quantity, unit, category, is_checked, position, notes)
    SELECT 
        v_baking_list_id,
        i.id,
        i.name,
        CASE i.name
            WHEN 'Flour' THEN 1000
            WHEN 'Sugar' THEN 500
            WHEN 'Butter' THEN 250
            WHEN 'Eggs' THEN 6
            WHEN 'Cream' THEN 500
            WHEN 'Vanilla' THEN 1
            ELSE 1
        END,
        CASE i.name
            WHEN 'Eggs' THEN 'pieces'
            WHEN 'Vanilla' THEN 'bottle'
            ELSE 'g'
        END,
        'Baking',
        CASE i.name
            WHEN 'Flour' THEN TRUE
            WHEN 'Sugar' THEN TRUE
            ELSE FALSE
        END,
        ROW_NUMBER() OVER (ORDER BY i.name),
        CASE i.name
            WHEN 'Flour' THEN 'All-purpose flour'
            WHEN 'Butter' THEN 'Unsalted butter, room temp'
            WHEN 'Cream' THEN 'Heavy whipping cream'
            ELSE NULL
        END
    FROM "Ingredient" i
    WHERE i.name IN ('Flour', 'Sugar', 'Butter', 'Eggs', 'Cream', 'Vanilla');

    -- Custom baking items
    INSERT INTO shopping_list_items (shopping_list_id, ingredient_id, item_name, quantity, unit, category, is_checked, position, notes)
    VALUES 
        (v_baking_list_id, NULL, 'Baking Powder', 1, 'can', 'Baking', FALSE, 10, 'Check expiry date'),
        (v_baking_list_id, NULL, 'Food Coloring', 1, 'set', 'Baking', FALSE, 11, 'Gel-based preferred'),
        (v_baking_list_id, NULL, 'Sprinkles', 2, 'containers', 'Decoration', FALSE, 12, 'Rainbow and chocolate'),
        (v_baking_list_id, NULL, 'Candles', 1, 'pack', 'Decoration', FALSE, 13, 'Birthday candles');

    -- ========================================================================
    -- ARCHIVED LIST ITEMS (All checked - completed shopping)
    -- ========================================================================
    
    DELETE FROM shopping_list_items WHERE shopping_list_id = v_archived_list_id;

    INSERT INTO shopping_list_items (shopping_list_id, ingredient_id, item_name, quantity, unit, category, is_checked, position, notes)
    SELECT 
        v_archived_list_id,
        i.id,
        i.name,
        CASE i.name
            WHEN 'Milk' THEN 1
            WHEN 'Bread' THEN 1
            WHEN 'Rice' THEN 1000
            WHEN 'Pasta' THEN 500
            ELSE 1
        END,
        CASE i.name
            WHEN 'Rice' THEN 'g'
            WHEN 'Pasta' THEN 'g'
            WHEN 'Bread' THEN 'loaf'
            ELSE 'carton'
        END,
        CASE i.name
            WHEN 'Milk' THEN 'Dairy'
            WHEN 'Bread' THEN 'Bakery'
            ELSE 'Pantry'
        END,
        TRUE,  -- All items checked in archived list
        ROW_NUMBER() OVER (ORDER BY i.name),
        NULL
    FROM "Ingredient" i
    WHERE i.name IN ('Milk', 'Bread', 'Rice', 'Pasta');

    RAISE NOTICE 'Shopping list seed data inserted successfully!';
    RAISE NOTICE 'Created lists: Weekly Groceries, Party Planning, Baking Project, Last Week Groceries (archived)';
END $$;

-- ============================================================================
-- VERIFY THE DATA
-- ============================================================================

-- View all shopping lists
SELECT 
    sl.id,
    sl.name,
    sl.description,
    sl.is_archived,
    COUNT(sli.id) as item_count,
    COUNT(CASE WHEN sli.is_checked THEN 1 END) as checked_count,
    sl.created_at,
    sl.updated_at
FROM shopping_lists sl
LEFT JOIN shopping_list_items sli ON sl.id = sli.shopping_list_id
GROUP BY sl.id
ORDER BY sl.is_archived, sl.updated_at DESC;

-- View items in Weekly Groceries list with details
SELECT 
    sli.position,
    sli.item_name,
    COALESCE(i.name, 'Custom Item') as ingredient,
    sli.quantity,
    sli.unit,
    sli.category,
    CASE WHEN sli.is_checked THEN '✓' ELSE '○' END as status,
    sli.notes
FROM shopping_list_items sli
LEFT JOIN "Ingredient" i ON sli.ingredient_id = i.id
JOIN shopping_lists sl ON sli.shopping_list_id = sl.id
WHERE sl.name = 'Weekly Groceries'
ORDER BY sli.category, sli.position;

-- Summary by category
SELECT 
    sl.name as list_name,
    sli.category,
    COUNT(*) as total_items,
    COUNT(CASE WHEN sli.is_checked THEN 1 END) as completed,
    COUNT(CASE WHEN NOT sli.is_checked THEN 1 END) as remaining
FROM shopping_lists sl
JOIN shopping_list_items sli ON sl.id = sli.shopping_list_id
WHERE NOT sl.is_archived
GROUP BY sl.name, sli.category
ORDER BY sl.name, sli.category;
