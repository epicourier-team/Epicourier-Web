-- Drop existing function if it exists
DROP FUNCTION IF EXISTS match_recipes_filtered;

-- Create new RPC function that filters recipes by dietary preferences BEFORE similarity search
CREATE OR REPLACE FUNCTION match_recipes_filtered(
    query_embedding vector(384),
    match_count int,
    dietary_prefs text[] DEFAULT NULL,
    allergens text[] DEFAULT NULL
)
RETURNS TABLE (
    id bigint,
    name text,
    description text,
    similarity float
)
LANGUAGE plpgsql
AS $$
DECLARE
    non_veg_keywords text[] := ARRAY[
        'chicken', 'beef', 'pork', 'lamb', 'mutton', 'goat',
        'fish', 'salmon', 'tuna', 'cod', 'tilapia', 'trout',
        'shrimp', 'prawn', 'crab', 'lobster', 'shellfish', 'seafood',
        'meat', 'bacon', 'ham', 'sausage', 'pepperoni', 'salami',
        'turkey', 'duck', 'goose', 'venison', 'rabbit',
        'anchovy', 'sardine', 'mackerel', 'herring'
    ];
    animal_keywords text[] := ARRAY[
        'chicken', 'beef', 'pork', 'lamb', 'fish', 'salmon', 'tuna',
        'shrimp', 'prawn', 'meat', 'bacon', 'ham', 'turkey', 'duck',
        'milk', 'cream', 'butter', 'cheese', 'yogurt', 'ghee',
        'egg', 'honey', 'gelatin', 'whey', 'casein'
    ];
    is_vegetarian boolean := false;
    is_vegan boolean := false;
    keyword text;
BEGIN
    -- Check if vegetarian or vegan preference exists
    IF dietary_prefs IS NOT NULL THEN
        is_vegetarian := EXISTS (
            SELECT 1 FROM unnest(dietary_prefs) AS pref 
            WHERE lower(pref) LIKE '%vegetarian%'
        );
        is_vegan := EXISTS (
            SELECT 1 FROM unnest(dietary_prefs) AS pref 
            WHERE lower(pref) LIKE '%vegan%'
        );
    END IF;

    RETURN QUERY
    SELECT 
        r.id,
        r.name::text,
        r.description::text,
        1 - (r.embedding <=> query_embedding) AS similarity
    FROM "Recipe" r
    WHERE r.embedding IS NOT NULL
    -- Filter by dietary preferences
    AND (
        -- If vegetarian, exclude recipes with non-veg ingredients
        NOT is_vegetarian OR NOT EXISTS (
            SELECT 1 
            FROM "Recipe_Ingredient_Map" rim
            JOIN "Ingredient" i ON rim.ingredient_id = i.id
            WHERE rim.recipe_id = r.id
            AND EXISTS (
                SELECT 1 FROM unnest(non_veg_keywords) AS keyword
                WHERE lower(i.name) LIKE '%' || keyword || '%'
            )
        )
    )
    AND (
        -- If vegan, exclude recipes with any animal products
        NOT is_vegan OR NOT EXISTS (
            SELECT 1 
            FROM "Recipe_Ingredient_Map" rim
            JOIN "Ingredient" i ON rim.ingredient_id = i.id
            WHERE rim.recipe_id = r.id
            AND EXISTS (
                SELECT 1 FROM unnest(animal_keywords) AS keyword
                WHERE lower(i.name) LIKE '%' || keyword || '%'
            )
        )
    )
    -- Filter by allergens
    AND (
        allergens IS NULL OR NOT EXISTS (
            SELECT 1 
            FROM "Recipe_Ingredient_Map" rim
            JOIN "Ingredient" i ON rim.ingredient_id = i.id
            WHERE rim.recipe_id = r.id
            AND EXISTS (
                SELECT 1 FROM unnest(allergens) AS allergen
                WHERE lower(i.name) LIKE '%' || lower(allergen) || '%'
            )
        )
    )
    ORDER BY r.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
