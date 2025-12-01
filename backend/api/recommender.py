"""
recommender.py - Lazy-load + Render-safe version
"""

import os
from functools import lru_cache


import pandas as pd
import torch
from dotenv import load_dotenv
from google import genai
from sentence_transformers import SentenceTransformer, util
from sklearn.cluster import KMeans
from supabase import create_client

# --------------------------------------------------
# 1. Global setup
# --------------------------------------------------
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {DEVICE}")

load_dotenv()
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
GEMINI_KEY = os.getenv("GEMINI_KEY")


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
def load_gemini_client():
    print("Initializing Gemini client ...")
    return genai.Client(api_key=GEMINI_KEY)


# --------------------------------------------------
# 3. Utility functions
# --------------------------------------------------
def make_recipe_text(row):
    return (
        f"{row.get('description', '')}. "
        f"Ingredients: {', '.join(row['ingredients'])}. "
        f"Tags: {', '.join(row['tags'])}."
    )


def get_recipe_embeddings(recipe_data):
    """Compute embeddings for all recipes (cached)."""
    embedder = load_embedder()
    if "recipe_text" not in recipe_data.columns:
        recipe_data["recipe_text"] = recipe_data.apply(make_recipe_text, axis=1)
    print("Computing recipe embeddings ...")
    embeddings = embedder.encode(recipe_data["recipe_text"].tolist(), convert_to_tensor=True)
    return embeddings

client = load_gemini_client()
# --------------------------------------------------
# 4. Gemini-based goal expansion
# --------------------------------------------------
def nutrition_goal(goal_text):
    """Translate a user's goal into target nutritional values using Gemini."""
    prompt = f"""
    Your task is to translate a user's specific diet goal into precise, target nutritional values for a daily meal plan.
    Just provide the nutritional values without any additional explanation or context.

    **GOAL:** {goal_text}

    You may include: calories_kcal, protein_g, carbs_g, sugars_g, total_fats_g,
    cholesterol_mg, total_minerals_mg, vit_a_microg, total_vit_b_mg,
    vit_c_mg, vit_d_microg, vit_e_mg, vit_k_microg
    """
    response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
    return response.text.strip()

def expand_goal(goal_text):
    """Translate a user's goal into nutrition information using Gemini."""

    prompt = f"""
    Your task is to translate a user's specific diet goal into precise, target nutritional values for a daily meal plan.

    **GOAL:** {goal_text}

    You may include: calories_kcal, protein_g, carbs_g, sugars_g, total_fats_g, cholesterol_mg, total_minerals_mg, vit_a_microg, total_vit_b_mg, vit_c_mg, vit_d_microg, vit_e_mg, vit_k_microg
    """

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    return response.text.strip()

# --------------------------------------------------
# 5. Recommendation pipeline
# --------------------------------------------------
def rank_recipes_by_goal(goal_text, user_profile=None, pantry_items=None, top_k=20):
    """Rank recipes by goal with optional personalization (Step 3: filtering added)."""
    recipe_data = load_recipe_data()
    
    # Step 3: Apply filters if user_profile is provided
    if user_profile:
        # Filter allergens FIRST (critical safety filter)
        if user_profile.get('allergies'):
            recipe_data = filter_allergens(recipe_data, user_profile['allergies'])
            print(f"After allergen filter: {len(recipe_data)} recipes")
        
        # Filter by dietary preferences (optional)
        if user_profile.get('dietary_preferences'):
            recipe_data = filter_dietary_preferences(recipe_data, user_profile['dietary_preferences'])
            print(f"After dietary filter: {len(recipe_data)} recipes")
    
    # Continue with existing logic
    recipe_embeddings = get_recipe_embeddings(recipe_data)
    embedder = load_embedder()

    nutri_goal = nutrition_goal(goal_text)
    goal_embedding = embedder.encode(nutri_goal, convert_to_tensor=True)
    scores = util.cos_sim(goal_embedding, recipe_embeddings)[0].cpu().numpy()

    recipe_data = recipe_data.copy()
    recipe_data["similarity"] = scores
    ranked = recipe_data.sort_values(by="similarity", ascending=False).head(top_k)
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
    for c in range(n_clusters):
        cluster_recipes = ranked_df[cluster_labels == c]
        top_one = cluster_recipes.sort_values("similarity", ascending=False).head(1)
        selected_indices.append(top_one.index[0])
    return ranked_df.loc[selected_indices].sort_values("similarity", ascending=False)


# CREATE MEAL PLAN
def create_meal_plan(goal_text, n_meals=3, user_profile=None, pantry_items=None):
    ranked, nutri_goal = rank_recipes_by_goal(goal_text, user_profile, pantry_items)
    diverse = select_diverse_recipes(ranked, n_meals)
    exp_goal = expand_goal(goal_text)

    meal_plan = []
    for i, row in enumerate(diverse.itertuples(), 1):
        meal_plan.append({
            "meal_number": i,
            "id": int(row.id),
            "name": row.name,
            "tags": row.tags,
            "key_ingredients": row.ingredients[:10],  # limit to first few
            "reason": f"Selected because it aligns with goal '{goal_text}' and differs from other meals.",
            "similarity_score": round(float(row.similarity), 3),
            "recipe": row.recipe_text
        })

    # print(f"Expanded goal: {exp_goal}\n")
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
    """Filter recipes by dietary tags (Vegetarian, Vegan, etc.)."""
    if not preferences or len(preferences) == 0:
        return recipe_data
    
    # Match recipes that have at least one of the preferred tags
    mask = recipe_data['tags'].apply(
        lambda tags: any(pref.lower() in [t.lower() for t in tags] for pref in preferences)
    )
    return recipe_data[mask].reset_index(drop=True)


def calculate_pantry_score(ingredients, pantry_items):
    """Calculate what % of recipe ingredients are in user's pantry."""
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
    """Give bonus if recipe matches available equipment."""
    if not available_equipment or not recipe.get('tags'):
        return 0.0
    
    equipment_lower = [e.lower() for e in available_equipment]
    recipe_tags_lower = [t.lower() for t in recipe['tags']]
    
    # Check if any equipment is mentioned in tags
    for equip in equipment_lower:
        if any(equip in tag for tag in recipe_tags_lower):
            return 1.0  # Full bonus if equipment matches
    
    return 0.0