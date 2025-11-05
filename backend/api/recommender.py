import os

import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer, util
from sklearn.cluster import KMeans
from transformers import pipeline
import pandas as pd
from google import genai
import torch
from dotenv import load_dotenv

# This sets the device variable to 'cuda' if a CUDA-enabled GPU is available, 
# otherwise it defaults to 'cpu'.
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print(f"Using device: {DEVICE}")

from supabase import Client, create_client

load_dotenv()
url: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)


# LOAD DATA (runs once at startup)
ingredients = pd.DataFrame(supabase.table("Ingredient").select("*").execute().data)
recipes = pd.DataFrame(supabase.table("Recipe").select("*").execute().data)
recipe_ingredient_map = pd.DataFrame(supabase.table("Recipe-Ingredient_Map").select("*").execute().data)
tags = pd.DataFrame(supabase.table("RecipeTag").select("*").execute().data)
recipe_tag_map = pd.DataFrame(supabase.table("Recipe-Tag_Map").select("*").execute().data)

# MERGE RECIPE METADATA
recipe_tags = recipe_tag_map.merge(tags, left_on="tag_id", right_on="id", suffixes=("", "_tag"))
recipe_tags = recipe_tags.groupby("recipe_id")["name"].apply(list).reset_index(name="tags")

recipe_ing = recipe_ingredient_map.merge(ingredients, left_on="ingredient_id", right_on="id", suffixes=("", "_ing"))
recipe_ing = recipe_ing.groupby("recipe_id")["name"].apply(list).reset_index(name="ingredients")

recipe_data = recipes.merge(recipe_tags, left_on="id", right_on="recipe_id", how="left")
recipe_data = recipe_data.merge(recipe_ing, left_on="id", right_on="recipe_id", how="left")

print("recipe_tag_map columns:", recipe_tag_map.columns)
print("tags columns:", tags.columns)

# Fill empty lists for missing entries
recipe_data["tags"] = recipe_data["tags"].apply(lambda x: x if isinstance(x, list) else [])
recipe_data["ingredients"] = recipe_data["ingredients"].apply(lambda x: x if isinstance(x, list) else [])

# LOAD MODELS (once only)
print("🔹 Loading models... this happens once.")
goal_expander = pipeline("text2text-generation", model="google/flan-t5-large", device = DEVICE)
embedder = SentenceTransformer("all-MiniLM-L6-v2", device=DEVICE)

# PRECOMPUTE RECIPE EMBEDDINGS
def make_recipe_text(row):
    """Combine recipe info into a textual description for embeddings."""
    text = (
        f" {row['name']}. "
        f"Description: {row['description']}. "
        f"Ingredients: {', '.join(row['ingredients'])}. "
        f"Tags: {', '.join(row['tags'])}."
    )
    return text

print("🔹 Computing recipe embeddings...")
recipe_data["recipe_text"] = recipe_data.apply(make_recipe_text, axis=1)
recipe_embeddings = embedder.encode(recipe_data["recipe_text"].tolist(), convert_to_tensor=True)

# Load your key securely (example only — use env vars or secrets manager in production)
my_api_key = "AIzaSyBdrHNdz11u3leriHYsdz2CjwBpGNpcusk"  # ⚠️ Replace with secure loading

# Initialize Gemini client
client = genai.Client(api_key=my_api_key)

# Just provide the nutritional values without any additional explanation or context.
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

def nutrition_goal(goal_text):
    """Translate a user's goal into nutrition information using Gemini."""

    prompt = f"""
    Your task is to translate a user's specific diet goal into precise, target nutritional values for a daily meal plan.
    Just provide the nutritional values without any additional explanation or context.

    **GOAL:** {goal_text}

    You may include: calories_kcal, protein_g, carbs_g, sugars_g, total_fats_g, cholesterol_mg, total_minerals_mg, vit_a_microg, total_vit_b_mg, vit_c_mg, vit_d_microg, vit_e_mg, vit_k_microg
    """

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    return response.text.strip()

# Example
goal_expanded = expand_goal("lose 5 kg")
goal_expanded

# RANK RECIPES BY SIMILARITY TO GOAL
def rank_recipes_by_goal(goal_text, top_k=20):
    nutri_goal = nutrition_goal(goal_text)
    goal_embedding = embedder.encode(nutri_goal, convert_to_tensor=True)
    scores = util.cos_sim(goal_embedding, recipe_embeddings)[0].cpu().numpy()
    recipe_data["similarity"] = scores
    ranked = recipe_data.sort_values(by="similarity", ascending=False).head(top_k)
    return ranked, nutri_goal

# SELECT DIVERSE RECIPES
def select_diverse_recipes(ranked_df, n_meals: int = 3):
    """Cluster embeddings to ensure diversity among top recipes."""
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

    selected = ranked_df.loc[selected_indices]
    return selected.sort_values("similarity", ascending=False)

# CREATE MEAL PLAN
def create_meal_plan(goal_text, n_meals=3):
    ranked, nutri_goal = rank_recipes_by_goal(goal_text)
    diverse = select_diverse_recipes(ranked, n_meals)
    exp_goal = expand_goal(goal_text)

    meal_plan = []
    for i, row in enumerate(diverse.itertuples(), 1):
        meal_plan.append({
            "meal_number": i,
            "name": row.name,
            "tags": row.tags,
            "key_ingredients": row.ingredients[:10],  # limit to first few
            "reason": f"Selected because it aligns with goal '{goal_text}' and differs from other meals.",
            "similarity_score": round(float(row.similarity), 3),
            "recipe": row.recipe_text
        })

    # print(f"Expanded goal: {exp_goal}\n")
    return meal_plan, exp_goal