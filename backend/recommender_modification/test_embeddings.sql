-- Check if embeddings exist and their format
SELECT 
    id, 
    name,
    embedding IS NOT NULL as has_embedding,
    pg_typeof(embedding) as embedding_type,
    array_length(embedding::float[], 1) as embedding_length
FROM "Recipe"
WHERE embedding IS NOT NULL
LIMIT 5;

-- Try direct vector comparison (should return results)
SELECT 
    id,
    name,
    embedding <=> '[0,0,0,0,0,0,0,0,0,0]'::vector(10) as distance
FROM "Recipe"
WHERE embedding IS NOT NULL
LIMIT 5;

-- Test if the function works with a real embedding from the table
WITH sample_embedding AS (
    SELECT embedding FROM "Recipe" WHERE embedding IS NOT NULL LIMIT 1
)
SELECT * FROM match_recipes(
    (SELECT embedding FROM sample_embedding),
    5
);
