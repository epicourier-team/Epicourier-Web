"""
Debug script to check if embeddings are stored in Supabase
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from api.recommender import load_supabase

def check_embeddings():
    supabase = load_supabase()
    
    # Check if embedding column exists and has data
    print("Checking Recipe table for embeddings...\n")
    
    # Get sample recipes with embedding status
    result = supabase.table("Recipe").select("id, name, embedding").limit(10).execute()
    
    if not result.data:
        print("❌ No recipes found in database!")
        return
    
    print(f"Found {len(result.data)} recipes. Checking embeddings:\n")
    
    has_embedding = 0
    no_embedding = 0
    
    for recipe in result.data:
        embedding = recipe.get('embedding')
        status = "✓ HAS" if embedding else "✗ MISSING"
        
        if embedding:
            has_embedding += 1
            print(f"{status} - Recipe {recipe['id']}: {recipe['name'][:40]}")
        else:
            no_embedding += 1
            print(f"{status} - Recipe {recipe['id']}: {recipe['name'][:40]}")
    
    print(f"\n{'='*60}")
    print(f"Summary:")
    print(f"  Recipes with embeddings: {has_embedding}")
    print(f"  Recipes without embeddings: {no_embedding}")
    print(f"{'='*60}")
    
    if has_embedding == 0:
        print("\n⚠️  No embeddings found! Run populate_embeddings.py first:")
        print("   python recommender_modification/populate_embeddings.py")
    
    # Test RPC function with a real embedding
    print("\n\nTesting RPC function...")
    try:
        # Get a real embedding from the database
        sample = supabase.table("Recipe").select("embedding").limit(1).execute()
        
        if not sample.data or not sample.data[0].get('embedding'):
            print("❌ No sample embedding found to test with")
            return
        
        test_embedding = sample.data[0]['embedding']
        
        rpc_result = supabase.rpc('match_recipes', {
            'query_embedding': test_embedding,
            'match_count': 5
        }).execute()
        
        print(f"✓ RPC function works! Returned {len(rpc_result.data)} recipes")
        
        if rpc_result.data:
            print("\nSample results:")
            for r in rpc_result.data[:3]:
                print(f"  - {r.get('name', 'N/A')} (similarity: {r.get('similarity', 'N/A')})")
        else:
            print("⚠️  RPC returned empty results (this shouldn't happen with real embeddings)")
            
    except Exception as e:
        print(f"❌ RPC function error: {e}")
        print("\nMake sure you created the RPC function in Supabase:")
        print("See: recommender_modification/fix_rpc_function.sql")

if __name__ == "__main__":
    check_embeddings()
