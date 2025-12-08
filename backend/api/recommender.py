"""
recommender.py - Lazy-load + Render-safe version
"""

import os
import logging
from functools import lru_cache

import pandas as pd
import torch
from dotenv import load_dotenv
from groq import Groq
from sentence_transformers import SentenceTransformer, util
from sklearn.cluster import KMeans
from supabase import create_client

logger = logging.getLogger(__name__)

# --------------------------------------------------
# 1. Global setup
# --------------------------------------------------
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {DEVICE}")

load_dotenv()
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
GEMINI_KEY = os.getenv("GEMINI_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")


# --------------------------------------------------
# 2. Lazy loaders
# --------------------------------------------------
@lru_cache()
def load_supabase():
    print("Connecting to Supabase ...")
    return create_client(SUPABASE_URL, SUPABASE_KEY)


@lru_cache()
def load_recipe_data():
    """Load and merge recipe data only once."""
    print("Loading recipe data from Supabase ...")
    supabase = load_supabase()

    ingredients = pd.DataFrame(supabase.table("Ingredient").select("*").execute().data)
    recipes = pd.DataFrame(supabase.table("Recipe").select("*").execute().data)
    recipe_ing_map = pd.DataFrame(supabase.table("Recipe_Ingredient_Map").select("*").execute().data)
    tags = pd.DataFrame(supabase.table("RecipeTag").select("*").execute().data)
    recipe_tag_map = pd.DataFrame(supabase.table("Recipe_Tag_Map").select("*").execute().data)

    # Merge metadata
    recipe_tags = recipe_tag_map.merge(tags, left_on="tag_id", right_on="id", suffixes=("", "_tag"))
    recipe_tags = recipe_tags.groupby("recipe_id")["name"].apply(list).reset_index(name="tags")

    recipe_ing = recipe_ing_map.merge(ingredients, left_on="ingredient_id", right_on="id", suffixes=("", "_ing"))
    recipe_ing = recipe_ing.groupby("recipe_id")["name"].apply(list).reset_index(name="ingredients")

    recipe_data = recipes.merge(recipe_tags, left_on="id", right_on="recipe_id", how="left")
    recipe_data = recipe_data.merge(recipe_ing, left_on="id", right_on="recipe_id", how="left")

    recipe_data["tags"] = recipe_data["tags"].apply(lambda x: x if isinstance(x, list) else [])
    recipe_data["ingredients"] = recipe_data["ingredients"].apply(lambda x: x if isinstance(x, list) else [])
    return recipe_data


@lru_cache()
def load_embedder():
    print("Loading sentence-transformer model ...")
    return SentenceTransformer("all-MiniLM-L6-v2", device=DEVICE)


@lru_cache()
def load_groq_client():
    print("Initializing Groq client ...")
    return Groq(api_key=GROQ_API_KEY)


# --------------------------------------------------
# 3. Utility functions
# --------------------------------------------------
def make_recipe_text(row):
    return (
        f"{row.get('description', '')}. "
        f"Ingredients: {', '.join(row['ingredients'])}. "
        f"Tags: {', '.join(row['tags'])}."
    )


# get_recipe_embeddings removed - now using pgvector RPC for direct similarity search


# --------------------------------------------------
# 4. Groq-based goal expansion
# --------------------------------------------------
def nutrition_goal(goal_text, user_profile=None):
    """Translate a user's goal into target nutritional values using Groq."""
    client = load_groq_client()
    
    # Build context from user profile
    profile_context = ""
    if user_profile:
        if user_profile.get('dietary_preferences'):
            prefs = user_profile['dietary_preferences']
            profile_context += f"\n- STRICT Dietary Requirements: {', '.join(prefs)}"
            if any('vegetarian' in p.lower() for p in prefs):
                profile_context += " (NO meat, fish, or poultry allowed)"
            if any('vegan' in p.lower() for p in prefs):
                profile_context += " (NO animal products including dairy, eggs, honey)"
        if user_profile.get('allergies'):
            profile_context += f"\n- Allergies to AVOID: {', '.join(user_profile['allergies'])}"
        if user_profile.get('kitchen_equipment'):
            profile_context += f"\n- Available equipment: {', '.join(user_profile['kitchen_equipment'])}"
    
    prompt = f"""
    Your task is to translate a user's specific diet goal into precise, target nutritional values for a daily meal plan.
    Just provide the nutritional values without any additional explanation or context.

    **GOAL:** {goal_text}
    {profile_context}

    IMPORTANT: The dietary preferences and allergies listed above are STRICT requirements that must be respected.

    You may include: calories_kcal, protein_g, carbs_g, sugars_g, total_fats_g,
    cholesterol_mg, total_minerals_mg, vit_a_microg, total_vit_b_mg,
    vit_c_mg, vit_d_microg, vit_e_mg, vit_k_microg
    """
    
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a specialized nutritionist API. Output only the requested data."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Error in nutrition_goal: {e}")
        raise RuntimeError("LLM services unavailable")

def expand_goal(goal_text):
    """Translate a user's goal into nutrition information using Groq."""
    client = load_groq_client()
    prompt = f"""
    Your task is to translate a user's specific diet goal into precise, target nutritional values for a daily meal plan.

    **GOAL:** {goal_text}

    You may include: calories_kcal, protein_g, carbs_g, sugars_g, total_fats_g, cholesterol_mg, total_minerals_mg, vit_a_microg, total_vit_b_mg, vit_c_mg, vit_d_microg, vit_e_mg, vit_k_microg
    """

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a helpful nutritionist."},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Error in expand_goal: {e}")
        raise RuntimeError("LLM services unavailable")

# --------------------------------------------------
# 5. Recommendation pipeline
# --------------------------------------------------
def llm_filter_recipes(recipes_df, user_profile):
    """Use LLM to filter recipes based on dietary preferences."""
    if not user_profile or (not user_profile.get('dietary_preferences') and not user_profile.get('allergies')):
        return recipes_df
    
    recipe_list = []
    for idx, row in recipes_df.iterrows():
        recipe_list.append({
            "id": int(row['id']),
            "name": row['name'],
            "ingredients": row['ingredients'][:10]
        })
    
    dietary_prefs = user_profile.get('dietary_preferences', [])
    allergies = user_profile.get('allergies', [])
    
    prompt = f"""You are a dietary validator. Return ONLY the IDs of suitable recipes as a JSON array.

    User Requirements:
    - Dietary: {', '.join(dietary_prefs) if dietary_prefs else 'None'}
    - Allergies: {', '.join(allergies) if allergies else 'None'}

    Rules:
    - VEGETARIAN: Exclude meat, fish, poultry, seafood
    - VEGAN: Exclude all animal products
    - Exclude allergens

    Respond ONLY with JSON array of IDs: [1, 5, 12]"""
    
    try:
        groq_client = load_groq_client()
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )
        result_text = response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"LLM filtering failed: {e}")
        return recipes_df  # Return unfiltered on failure
    
    try:
        import json, re
        match = re.search(r'\[([\d,\s]+)\]', result_text)
        if match:
            suitable_ids = json.loads(match.group(0))
            filtered = recipes_df[recipes_df['id'].isin(suitable_ids)]
            return filtered
        else:
            logger.warning(f"Failed to parse LLM response: {result_text}")
            return recipes_df
    except Exception as e:
        logger.error(f"Error parsing LLM filter results: {e}")
        return recipes_df


def rank_recipes_by_goal(goal_text, user_profile=None, pantry_items=None, top_k=20):
    """Rank recipes using pgvector similarity search in database."""
    supabase = load_supabase()
    embedder = load_embedder()
    
    # Get goal embedding with user profile context
    nutri_goal = nutrition_goal(goal_text, user_profile)
    goal_embedding = embedder.encode(nutri_goal).tolist()
    
    # Use pgvector RPC function to get top similar recipes directly from DB
    result = supabase.rpc('match_recipes', {
        'query_embedding': goal_embedding,
        'match_count': top_k * 3  # Fetch more for filtering
    }).execute()
    
    # Convert to DataFrame
    ranked = pd.DataFrame(result.data)
    
    if len(ranked) == 0:
        return pd.DataFrame(), nutri_goal
    
    # Load full recipe data for the matched recipes
    recipe_ids = ranked['id'].tolist()
    full_recipe_data = load_recipe_data()
    ranked = full_recipe_data[full_recipe_data['id'].isin(recipe_ids)].copy()
    
    # Merge similarity scores
    similarity_map = {r['id']: r['similarity'] for r in result.data}
    ranked['similarity'] = ranked['id'].map(lambda x: similarity_map.get(x, 0))
    
    # LLM-based filtering
    ranked = ranked.sort_values(by="similarity", ascending=False)
    if user_profile and (user_profile.get('dietary_preferences') or user_profile.get('allergies')):
        ranked = llm_filter_recipes(ranked, user_profile)
    
    ranked = ranked.head(top_k)
    
    # Add recipe_text for diversity selection
    ranked["recipe_text"] = ranked.apply(make_recipe_text, axis=1)
    
    return ranked, nutri_goal


def select_diverse_recipes(ranked_df, n_meals=3):
    """Cluster embeddings to ensure diversity among top recipes."""
    embedder = load_embedder()
    n_clusters = min(n_meals, len(ranked_df))
    if len(ranked_df) <= n_meals:
        return ranked_df

    sub_embeds = embedder.encode(ranked_df["recipe_text"].tolist())
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init="auto")
    cluster_labels = kmeans.fit_predict(sub_embeds)

    selected_indices = []
    # If len(ranked_df) < n_clusters, loop range might fail if logic isn't careful.
    # But n_clusters is min(n_meals, len), so safe.
    
    for c in range(n_clusters):
        cluster_recipes = ranked_df[cluster_labels == c]
        if not cluster_recipes.empty:
            top_one = cluster_recipes.sort_values("similarity", ascending=False).head(1)
            selected_indices.append(top_one.index[0])
    
    return ranked_df.loc[selected_indices].sort_values("similarity", ascending=False)


# CREATE MEAL PLAN
def create_meal_plan(goal_text, n_meals=3, user_profile=None, pantry_items=None):
    ranked, nutri_goal = rank_recipes_by_goal(goal_text, user_profile, pantry_items)
    
    if len(ranked) == 0:
        return [], nutri_goal
    
    diverse = select_diverse_recipes(ranked, n_meals)
    exp_goal = expand_goal(goal_text)

    meal_plan = []
    for i, row in enumerate(diverse.itertuples(), 1):
        # Generate specific reason based on recipe attributes
        tags_text = ', '.join(row.tags[:3]) if row.tags else 'balanced nutrition'
        key_ings = ', '.join(row.ingredients[:3]) if len(row.ingredients) >= 3 else ', '.join(row.ingredients)
        
        reason = f"High match ({round(float(row.similarity), 2)}) for '{goal_text}'. Features {tags_text} with key ingredients: {key_ings}."
        
        meal_plan.append({
            "meal_number": i,
            "id": int(row.id),
            "name": row.name,
            "tags": row.tags,
            "key_ingredients": row.ingredients[:10],
            "reason": reason,
            "similarity_score": round(float(row.similarity), 3),
            "recipe": row.recipe_text
        })

    return meal_plan, exp_goal
# --------------------------------------------------
# 6. Personalization helpers (Step 1)
# --------------------------------------------------
def filter_allergens(recipe_data, allergies):
    """Remove recipes containing allergens."""
    if not allergies or len(allergies) == 0:
        return recipe_data
    
    # Handle "No Allergy" option
    if "No Allergy" in allergies or "no allergy" in [a.lower() for a in allergies]:
        return recipe_data
    
    filtered = recipe_data.copy()
    for allergen in allergies:
        allergen_lower = allergen.lower()
        mask = filtered['ingredients'].apply(
            lambda ing_list: not any(allergen_lower in str(ing).lower() for ing in ing_list)
        )
        filtered = filtered[mask]
    
    return filtered.reset_index(drop=True)


def filter_dietary_preferences(recipe_data, preferences):
    """Filter recipes by dietary preferences (Vegetarian, Vegan, etc.)."""
    if not preferences or len(preferences) == 0:
        print("No dietary preferences to filter")
        return recipe_data
    
    print(f"\n=== Applying Dietary Filters ===")
    print(f"Preferences: {preferences}")
    print(f"Starting recipes: {len(recipe_data)}")
    
    filtered = recipe_data.copy()
    
    for pref in preferences:
        pref_lower = pref.lower()
        
        if 'vegetarian' in pref_lower:
            print(f"\nApplying VEGETARIAN filter...")
            # Exclude ALL meat, fish, and poultry
            non_veg_keywords = [
                'chicken', 'beef', 'pork', 'lamb', 'mutton', 'goat',
                'fish', 'salmon', 'tuna', 'cod', 'tilapia', 'trout',
                'shrimp', 'prawn', 'crab', 'lobster', 'shellfish', 'seafood',
                'meat', 'bacon', 'ham', 'sausage', 'pepperoni', 'salami',
                'turkey', 'duck', 'goose', 'venison', 'rabbit',
                'anchovy', 'sardine', 'mackerel', 'herring'
            ]
            
            before_count = len(filtered)
            
            def is_vegetarian(ing_list):
                if not ing_list:
                    return True
                for ing in ing_list:
                    ing_lower = str(ing).lower()
                    for keyword in non_veg_keywords:
                        if keyword in ing_lower:
                            print(f"  REJECTED: Found '{keyword}' in '{ing}'")
                            return False
                return True
            
            mask = filtered['ingredients'].apply(is_vegetarian)
            filtered = filtered[mask]
            print(f"Vegetarian filter: {before_count} -> {len(filtered)} recipes")
        
        if 'vegan' in pref_lower:
            print(f"\nApplying VEGAN filter...")
            # Exclude meat AND all animal products
            animal_keywords = [
                'chicken', 'beef', 'pork', 'lamb', 'fish', 'salmon', 'tuna',
                'shrimp', 'prawn', 'meat', 'bacon', 'ham', 'turkey', 'duck',
                'milk', 'cream', 'butter', 'cheese', 'yogurt', 'ghee',
                'egg', 'honey', 'gelatin', 'whey', 'casein'
            ]
            
            before_count = len(filtered)
            
            def is_vegan(ing_list):
                if not ing_list:
                    return True
                for ing in ing_list:
                    ing_lower = str(ing).lower()
                    for keyword in animal_keywords:
                        if keyword in ing_lower:
                            print(f"  REJECTED: Found '{keyword}' in '{ing}'")
                            return False
                return True
            
            mask = filtered['ingredients'].apply(is_vegan)
            filtered = filtered[mask]
            print(f"Vegan filter: {before_count} -> {len(filtered)} recipes")
    
    print(f"Final filtered recipes: {len(filtered)}")
    print(f"================================\n")
    return filtered.reset_index(drop=True)


def calculate_pantry_score(ingredients, pantry_items):
    """Calculate percentage of recipe ingredients in user pantry."""
    if not pantry_items or not ingredients:
        return 0.0
    
    ingredients_lower = [str(ing).lower() for ing in ingredients]
    pantry_lower = [str(item).lower() for item in pantry_items]
    
    matches = 0
    for ing in ingredients_lower:
        for pantry_item in pantry_lower:
            if pantry_item in ing or ing in pantry_item:
                matches += 1
                break
    
    return matches / len(ingredients) if ingredients else 0.0



def score_kitchen_equipment(recipe, available_equipment):
    """Bonus score for matching equipment."""
    if not available_equipment or not recipe.get('tags'):
        return 0.0
    
    equipment_lower = [e.lower() for e in available_equipment]
    recipe_tags_lower = [t.lower() for t in recipe['tags']]
    
    # Check if any equipment is mentioned in tags
    for equip in equipment_lower:
        if any(equip in tag for tag in recipe_tags_lower):
            return 1.0
    
    return 0.0