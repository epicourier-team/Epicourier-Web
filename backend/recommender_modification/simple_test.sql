-- Simple test: Check if embeddings exist
SELECT 
    id, 
    name,
    embedding IS NOT NULL as has_embedding
FROM "Recipe"
WHERE embedding IS NOT NULL
LIMIT 5;

-- Test with a real embedding from the table
WITH sample AS (
    SELECT embedding FROM "Recipe" WHERE embedding IS NOT NULL LIMIT 1
)
SELECT 
    r.id,
    r.name::text,
    (1 - (r.embedding <=> s.embedding))::float as similarity
FROM "Recipe" r, sample s
WHERE r.embedding IS NOT NULL
ORDER BY r.embedding <=> s.embedding
LIMIT 5;

-- Now test the function with a real embedding
WITH sample AS (
    SELECT embedding FROM "Recipe" WHERE embedding IS NOT NULL LIMIT 1
)
SELECT * FROM match_recipes(
    (SELECT embedding FROM sample),
    5
);
