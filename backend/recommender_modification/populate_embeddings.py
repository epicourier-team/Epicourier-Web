"""
Script to populate recipe embeddings in Supabase using pgvector
Run this once after setting up the embedding column
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from api.recommender import load_recipe_data, load_embedder, load_supabase, make_recipe_text

def populate_all_embeddings():
    """Compute and store embeddings for all recipes in Supabase."""
    print("Loading recipe data...")
    recipe_data = load_recipe_data()
    
    print("Loading embedding model...")
    embedder = load_embedder()
    
    print("Connecting to Supabase...")
    supabase = load_supabase()
    
    print(f"\nProcessing {len(recipe_data)} recipes...")
    
    # Create recipe text for all recipes
    recipe_data["recipe_text"] = recipe_data.apply(make_recipe_text, axis=1)
    
    # Compute embeddings for all recipes
    print("Computing embeddings (this may take a few minutes)...")
    embeddings = embedder.encode(recipe_data["recipe_text"].tolist())
    
    # Store embeddings in Supabase
    success_count = 0
    error_count = 0
    
    for idx, row in recipe_data.iterrows():
        try:
            embedding_list = embeddings[idx].tolist()
            
            # Update recipe with embedding
            supabase.table("Recipe").update({
                "embedding": embedding_list
            }).eq("id", row['id']).execute()
            
            success_count += 1
            print(f"✓ [{success_count}/{len(recipe_data)}] Updated recipe {row['id']}: {row['name']}")
            
        except Exception as e:
            error_count += 1
            print(f"✗ Error updating recipe {row['id']}: {e}")
    
    print(f"\n{'='*60}")
    print(f"Embedding population complete!")
    print(f"Success: {success_count} recipes")
    print(f"Errors: {error_count} recipes")
    print(f"{'='*60}")

if __name__ == "__main__":
    populate_all_embeddings()
