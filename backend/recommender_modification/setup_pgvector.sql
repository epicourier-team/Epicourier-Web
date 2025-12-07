-- Enable pgvector extension in Supabase
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to Recipe table (384 dimensions for all-MiniLM-L6-v2)
ALTER TABLE "Recipe" 
ADD COLUMN IF NOT EXISTS embedding vector(384);

-- Create index for fast similarity search using cosine distance
CREATE INDEX IF NOT EXISTS recipe_embedding_idx 
ON "Recipe" USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Recipe' AND column_name = 'embedding';
