"""
inventory_recommender.py — Gemini-powered recipe recommendations from inventory

Uses Gemini 2.5 Flash to intelligently recommend recipes based on:
1. Available ingredients in user's inventory
2. Expiration dates (prioritize soon-to-expire items)
3. User preferences (optional)
"""

import json
import os
from datetime import datetime, timedelta
from typing import List, Optional

from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel, Field

from api.recommender import load_gemini_client, load_recipe_data

load_dotenv()


# --------------------------------------------------
# 1. Request/Response Models
# --------------------------------------------------
class InventoryItem(BaseModel):
    """Single inventory item with optional expiration date."""

    ingredient_id: int
    name: str
    quantity: float
    unit: Optional[str] = None  # Can be null from frontend
    expiration_date: Optional[str] = None  # ISO date string (YYYY-MM-DD)


class InventoryRecommendRequest(BaseModel):
    """Request body for inventory-based recommendations."""

    inventory: List[InventoryItem]
    preferences: Optional[str] = None  # e.g., "low carb", "high protein"
    num_recipes: int = Field(default=5, ge=1, le=10)


class RecommendedRecipe(BaseModel):
    """Single recipe recommendation."""

    recipe_id: int
    recipe_name: str
    match_score: int  # 0-100
    ingredients_available: List[str]
    ingredients_missing: List[str]
    expiring_ingredients_used: List[str]
    reason: str


class InventoryRecommendResponse(BaseModel):
    """Response body for inventory recommendations."""

    recommendations: List[RecommendedRecipe]
    shopping_suggestions: List[str]
    overall_reasoning: str


# --------------------------------------------------
# 2. Expiration Formatting
# --------------------------------------------------
def format_inventory_with_expiration(inventory: List[InventoryItem]) -> str:
    """
    Format inventory items with expiration urgency indicators.

    - ❌ EXPIRED: Already expired
    - ⚠️ EXPIRING SOON: Expires within 3 days
    - ⏰ USE SOON: Expires within 7 days
    """
    today = datetime.now().date()
    lines = []

    for item in inventory:
        unit_str = item.unit if item.unit else "units"
        line = f"- {item.name}: {item.quantity} {unit_str}"

        if item.expiration_date:
            try:
                exp_date = datetime.fromisoformat(item.expiration_date).date()
                days_until = (exp_date - today).days

                if days_until < 0:
                    line += f" (EXPIRED {abs(days_until)} days ago) ❌"
                elif days_until == 0:
                    line += f" (expires TODAY) ⚠️ EXPIRING NOW"
                elif days_until <= 3:
                    line += f" (expires in {days_until} days) ⚠️ EXPIRING SOON"
                elif days_until <= 7:
                    line += f" (expires in {days_until} days) ⏰ USE SOON"
                else:
                    line += f" (expires: {item.expiration_date})"
            except ValueError:
                # Invalid date format, skip expiration info
                pass

        lines.append(line)

    return "\n".join(lines)


def format_recipes_for_prompt(recipe_data, limit: int = 80) -> str:
    """
    Format recipes for Gemini prompt, limiting context size.

    Returns format: ID:1 | Recipe Name | Ingredients: ing1, ing2, ing3
    """
    lines = []

    for _, row in recipe_data.head(limit).iterrows():
        recipe_id = row.get("id", 0)
        name = row.get("name", "Unknown")
        ingredients = row.get("ingredients", [])

        # Limit ingredients to first 10 for context size
        ing_str = ", ".join(ingredients[:10])
        if len(ingredients) > 10:
            ing_str += f" (+{len(ingredients) - 10} more)"

        lines.append(f"ID:{recipe_id} | {name} | Ingredients: {ing_str}")

    return "\n".join(lines)


# --------------------------------------------------
# 3. Gemini Prompt Builder
# --------------------------------------------------
def build_recommendation_prompt(
    inventory_text: str, recipes_text: str, preferences: Optional[str], num_recipes: int
) -> str:
    """Build the Gemini prompt for recipe recommendations."""

    pref_section = preferences if preferences else "None specified"

    return f"""You are a smart meal planning assistant for Epicourier.
Based on the user's available ingredients, recommend exactly {num_recipes} recipes.

## User's Inventory:
{inventory_text}

## Available Recipes Database:
{recipes_text}

## User Preferences:
{pref_section}

## Priority Rules:
1. **CRITICAL**: Always prioritize recipes using ⚠️ EXPIRING SOON or ⏰ USE SOON items
2. **HIGH**: Maximize ingredient utilization (use as many available items as possible)
3. **MEDIUM**: Consider nutritional balance across recommendations
4. **LOW**: Ensure meal variety (different cuisines/meal types)
5. **NEVER**: Do not recommend recipes that ONLY use ❌ EXPIRED items

## Scoring Guidelines:
- Recipe using 2+ expiring items: match_score bonus +15
- Recipe using 1 expiring item: match_score bonus +10
- Base score = (available ingredients / total required) * 100

## Output Format (strict JSON):
{{
  "recommendations": [
    {{
      "recipe_id": <integer from database>,
      "recipe_name": "<exact name from database>",
      "match_score": <0-100 integer>,
      "ingredients_available": ["ingredient1", "ingredient2"],
      "ingredients_missing": ["ingredient3"],
      "expiring_ingredients_used": ["expiring_item1"],
      "reason": "<1-2 sentence explanation>"
    }}
  ],
  "shopping_suggestions": ["ingredient that would unlock more recipes"],
  "overall_reasoning": "<2-3 sentence summary of the meal plan>"
}}

Respond ONLY with valid JSON. No markdown, no explanation outside JSON."""


# --------------------------------------------------
# 4. Main Recommendation Function
# --------------------------------------------------
def recommend_from_inventory(
    inventory: List[InventoryItem],
    preferences: Optional[str] = None,
    num_recipes: int = 5,
) -> InventoryRecommendResponse:
    """
    Generate recipe recommendations using Gemini 2.5 Flash.

    Args:
        inventory: List of available inventory items
        preferences: Optional dietary preferences
        num_recipes: Number of recipes to recommend (1-10)

    Returns:
        InventoryRecommendResponse with recommendations
    """
    # Load data
    recipe_data = load_recipe_data()
    client = load_gemini_client()

    # Format inputs
    inventory_text = format_inventory_with_expiration(inventory)
    recipes_text = format_recipes_for_prompt(recipe_data, limit=80)

    # Build prompt
    prompt = build_recommendation_prompt(
        inventory_text, recipes_text, preferences, num_recipes
    )

    # Call Gemini (note: this SDK version doesn't support generation_config)
    response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)

    # Parse response - extract JSON from text
    try:
        response_text = response.text.strip()
        # Remove markdown code blocks if present
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()

        result = json.loads(response_text)
    except json.JSONDecodeError as e:
        # Fallback: try to extract JSON from response
        raise ValueError(
            f"Failed to parse Gemini response as JSON: {e}\nResponse: {response.text[:500]}"
        )

    # Validate and return
    return InventoryRecommendResponse(
        recommendations=[
            RecommendedRecipe(**rec) for rec in result.get("recommendations", [])
        ],
        shopping_suggestions=result.get("shopping_suggestions", []),
        overall_reasoning=result.get("overall_reasoning", ""),
    )
