-- Drop the old function if it exists
DROP FUNCTION IF EXISTS match_recipes(vector, int);

-- Create the corrected RPC function
CREATE OR REPLACE FUNCTION match_recipes(
    query_embedding vector(384),
    match_count int
)
RETURNS TABLE (
    id bigint,
    name text,
    description text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.name::text,
        r.description::text,
        (1 - (r.embedding <=> query_embedding))::float as similarity
    FROM "Recipe" r
    WHERE r.embedding IS NOT NULL
    ORDER BY r.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Test the function
SELECT * FROM match_recipes(
    array_fill(0.0, ARRAY[384])::vector(384),
    5
);
