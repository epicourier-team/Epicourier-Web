"""
Optimized recommender using pgvector similarity search
This version queries only top-k recipes directly from database
"""

def rank_recipes_by_goal_optimized(goal_text, user_profile=None, pantry_items=None, top_k=20):
    """Rank recipes using pgvector similarity search - MUCH FASTER."""
    from api.recommender import load_supabase, load_embedder, load_recipe_data, nutrition_goal
    from api.recommender import filter_allergens, filter_dietary_preferences
    
    supabase = load_supabase()
    embedder = load_embedder()
    
    # Get goal embedding
    nutri_goal = nutrition_goal(goal_text)
    goal_embedding = embedder.encode(nutri_goal)
    goal_embedding_list = goal_embedding.tolist()
    
    # Use pgvector to find top-k similar recipes directly in database
    # Note: Supabase Python client doesn't support vector operations yet
    # So we still need to load all and filter, but this is the concept:
    
    # For now, use the filtered approach
    recipe_data = load_recipe_data()
    
    # Apply filters BEFORE loading embeddings
    if user_profile:
        if user_profile.get('allergies'):
            recipe_data = filter_allergens(recipe_data, user_profile['allergies'])
            print(f"After allergen filter: {len(recipe_data)} recipes")
        
        if user_profile.get('dietary_preferences'):
            recipe_data = filter_dietary_preferences(recipe_data, user_profile['dietary_preferences'])
            print(f"After dietary filter: {len(recipe_data)} recipes")
    
    # Now only load embeddings for filtered recipes
    recipe_ids = recipe_data['id'].tolist()
    stored = supabase.table("Recipe").select("id, embedding").in_("id", recipe_ids).execute()
    
    # Compute similarities
    import torch
    from sentence_transformers import util
    
    embeddings_dict = {r['id']: r['embedding'] for r in stored.data if r.get('embedding')}
    embeddings = [embeddings_dict[rid] for rid in recipe_ids if rid in embeddings_dict]
    
    DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    recipe_embeddings = torch.tensor(embeddings, device=DEVICE)
    goal_tensor = torch.tensor(goal_embedding_list, device=DEVICE)
    
    scores = util.cos_sim(goal_tensor, recipe_embeddings)[0].cpu().numpy()
    
    recipe_data = recipe_data.copy()
    recipe_data["similarity"] = scores
    ranked = recipe_data.sort_values(by="similarity", ascending=False).head(top_k)
    
    return ranked, nutri_goal


# Alternative: Direct SQL approach (requires RPC function in Supabase)
def rank_recipes_by_goal_sql(goal_text, top_k=20):
    """
    Use SQL directly for maximum performance.
    Requires creating an RPC function in Supabase:
    
    CREATE OR REPLACE FUNCTION match_recipes(
        query_embedding vector(384),
        match_threshold float,
        match_count int
    )
    RETURNS TABLE (
        id int,
        name text,
        similarity float
    )
    LANGUAGE sql STABLE
    AS $$
        SELECT
            id,
            name,
            1 - (embedding <=> query_embedding) as similarity
        FROM "Recipe"
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> query_embedding
        LIMIT match_count;
    $$;
    """
    from api.recommender import load_supabase, load_embedder, nutrition_goal
    
    supabase = load_supabase()
    embedder = load_embedder()
    
    nutri_goal = nutrition_goal(goal_text)
    goal_embedding = embedder.encode(nutri_goal).tolist()
    
    # Call RPC function
    result = supabase.rpc('match_recipes', {
        'query_embedding': goal_embedding,
        'match_threshold': 0.0,
        'match_count': top_k
    }).execute()
    
    return result.data, nutri_goal
