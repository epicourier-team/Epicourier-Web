import os

import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer, util
from sklearn.cluster import KMeans
from transformers import pipeline

import torch

# This sets the device variable to 'cuda' if a CUDA-enabled GPU is available, 
# otherwise it defaults to 'cpu'.
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print(f"Using device: {DEVICE}")

from supabase import Client, create_client

url: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)


# LOAD DATA (runs once at startup)
ingredients = supabase.table("Ingredient").select("*").execute()
recipes = supabase.table("Recipe").select("*").execute()
recipe_ingredient_map = supabase.table("Recipe-Ingredient_Map").select("*").execute()
tags = supabase.table("RecipeTags").select("*").execute()
recipe_tag_map = supabase.table("Recipe-Tag_Map").select("*").execute()

# MERGE RECIPE METADATA
recipe_tags = recipe_tag_map.merge(tags, left_on="tag_id", right_on="id", suffixes=("", "_tag"))
recipe_tags = recipe_tags.groupby("recipe_id")["name"].apply(list).reset_index(name="tags")

recipe_ing = recipe_ingredient_map.merge(ingredients, left_on="ingredient_id", right_on="id", suffixes=("", "_ing"))
recipe_ing = recipe_ing.groupby("recipe_id")["name"].apply(list).reset_index(name="ingredients")

recipe_data = recipes.merge(recipe_tags, left_on="id", right_on="recipe_id", how="left")
recipe_data = recipe_data.merge(recipe_ing, left_on="id", right_on="recipe_id", how="left")

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
        f"Recipe: {row['name']}. "
        f"Description: {row['description']}. "
        f"Ingredients: {', '.join(row['ingredients'])}. "
        f"Tags: {', '.join(row['tags'])}."
    )
    return text

print("🔹 Computing recipe embeddings...")
recipe_data["recipe_text"] = recipe_data.apply(make_recipe_text, axis=1)
recipe_embeddings = embedder.encode(recipe_data["recipe_text"].tolist(), convert_to_tensor=True)

# EXPAND GOAL TEXT
def expand_goal(goal_text: str) -> str:
    """Expand short user goal into a detailed nutrition description."""
    prompt = f"Expand this diet goal into a full nutrition profile: '{goal_text}'."
    result = goal_expander(prompt, max_new_tokens=100)[0]["generated_text"]
    return result

# RANK RECIPES BY SIMILARITY TO GOAL
def rank_recipes_by_goal(goal_text: str, top_k: int = 20):
    goal_expanded = expand_goal(goal_text)
    goal_embedding = embedder.encode(goal_expanded, convert_to_tensor=True)
    scores = util.cos_sim(goal_embedding, recipe_embeddings)[0].cpu().numpy()

    recipe_data["similarity"] = scores
    ranked = recipe_data.sort_values(by="similarity", ascending=False).head(top_k)
    return ranked, goal_expanded

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

def create_meal_plan(goal_text, n_meals=3):
    ranked, goal_expanded = rank_recipes_by_goal(goal_text)
    diverse = select_diverse_recipes(ranked, n_meals)

    meal_plan = []
    for i, row in enumerate(diverse.itertuples(), 1):
        meal_plan.append({
            "name": row.name,
            "tags": row.tags,
            "key_ingredients": row.ingredients[:10],  # first 10 ingredients
            "recipe": row.recipe_text,                 # full recipe description
            "reason": f"Selected because it aligns with goal '{goal_text}' and differs from other meals.",
            "similarity_score": round(float(row.similarity), 3)
        })

    return meal_plan