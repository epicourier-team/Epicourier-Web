# Recipe Embedding Storage with Supabase pgvector

This folder contains scripts to add vector embedding storage to the recommender system using Supabase's pgvector extension.

## Setup Steps

### 1. Enable pgvector in Supabase

Run the SQL script in your Supabase SQL Editor:

```bash
# Copy the contents of setup_pgvector.sql and run in Supabase Dashboard > SQL Editor
```

Or manually:
1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Paste and execute `setup_pgvector.sql`

### 2. Populate Embeddings

Run the population script to compute and store embeddings for all recipes:

```bash
cd backend
python recommender_modification/populate_embeddings.py
```

This will:
- Load all recipes from database
- Compute 384-dimensional embeddings using `all-MiniLM-L6-v2`
- Store embeddings in the `Recipe.embedding` column
- Takes ~5-10 minutes for 1000 recipes

### 3. Update recommender.py

Replace the `get_recipe_embeddings` function in `api/recommender.py` with the version from `updated_recommender.py`:

```python
# Copy the function from updated_recommender.py
# Replace the existing get_recipe_embeddings function in api/recommender.py
```

## Performance Improvement

**Before (No Caching):**
- Every request: ~10 seconds (computing 1000 embeddings)

**After (pgvector Caching):**
- First request: ~10 seconds (one-time computation)
- Subsequent requests: ~0.5 seconds (loading from database)

**Speed improvement: 20x faster!**

## Files

- `setup_pgvector.sql` - SQL script to add embedding column
- `populate_embeddings.py` - One-time script to populate all embeddings
- `updated_recommender.py` - Updated function with caching logic
- `README.md` - This file

## Verification

After setup, verify embeddings are stored:

```sql
SELECT id, name, embedding IS NOT NULL as has_embedding 
FROM "Recipe" 
LIMIT 10;
```

All recipes should show `has_embedding = true`.
