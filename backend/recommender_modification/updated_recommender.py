"""
Updated get_recipe_embeddings function with Supabase pgvector caching
Replace the existing function in api/recommender.py with this version
"""

import torch

def get_recipe_embeddings(recipe_data):
    """Load embeddings from Supabase or compute if missing."""
    from api.recommender import load_supabase, load_embedder, make_recipe_text
    
    supabase = load_supabase()
    embedder = load_embedder()
    
    # Get recipe IDs
    recipe_ids = recipe_data['id'].tolist()
    
    # Fetch stored embeddings from Supabase
    print("Fetching embeddings from Supabase...")
    stored = supabase.table("Recipe").select("id, embedding").in_("id", recipe_ids).execute()
    
    # Create dictionary of stored embeddings
    stored_dict = {}
    for r in stored.data:
        if r.get('embedding'):
            stored_dict[r['id']] = r['embedding']
    
    # Find recipes without embeddings
    missing_ids = [rid for rid in recipe_ids if rid not in stored_dict]
    
    if missing_ids:
        print(f"Computing embeddings for {len(missing_ids)} missing recipes...")
        missing_data = recipe_data[recipe_data['id'].isin(missing_ids)].copy()
        missing_data["recipe_text"] = missing_data.apply(make_recipe_text, axis=1)
        
        # Compute embeddings for missing recipes
        new_embeddings = embedder.encode(missing_data["recipe_text"].tolist())
        
        # Store new embeddings in Supabase
        for i, (idx, row) in enumerate(missing_data.iterrows()):
            embedding_list = new_embeddings[i].tolist()
            supabase.table("Recipe").update({"embedding": embedding_list}).eq("id", row['id']).execute()
            stored_dict[row['id']] = embedding_list
            print(f"  Stored embedding for recipe {row['id']}")
    else:
        print(f"All {len(recipe_ids)} embeddings loaded from cache ✓")
    
    # Return embeddings in correct order matching recipe_data
    embeddings = [stored_dict[rid] for rid in recipe_ids]
    
    # Convert to tensor
    DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    return torch.tensor(embeddings, device=DEVICE)
