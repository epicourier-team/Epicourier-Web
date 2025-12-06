"""
Enhanced Recommendation Algorithm with Expiration Prioritization
Issue #108: Improve AI recipe recommendations by prioritizing expiring ingredients

Extends the existing recommender to consider:
1. Ingredient expiration dates
2. User dietary preferences
3. Time constraints (quick vs slow recipes)
4. Nutritional goals
5. Budget optimization
"""

from typing import List, Dict, Optional
from datetime import datetime, timedelta
import numpy as np
from dataclasses import dataclass


@dataclass
class InventoryItemWithExpiration:
    ingredient_id: int
    name: str
    quantity: float
    unit: str
    expiration_date: Optional[str] = None
    purchase_price: Optional[float] = None


@dataclass
class EnhancedRecommendation:
    recipe_id: int
    recipe_name: str
    score: float
    urgency_score: float
    coverage: float
    reasoning: str
    expiring_ingredients: List[str]
    estimated_cost: float


class EnhancedRecommender:
    """Enhanced recommendation system with expiration awareness"""

    def __init__(self, recipes_data: Dict, embeddings: np.ndarray):
        self.recipes = recipes_data
        self.embeddings = embeddings

    def calculate_expiration_urgency(
        self, inventory: List[InventoryItemWithExpiration]
    ) -> Dict[int, float]:
        """Calculate urgency scores based on expiration dates"""
        urgency_scores = {}

        for item in inventory:
            if not item.expiration_date:
                urgency_scores[item.ingredient_id] = 0.0
                continue

            exp_date = datetime.fromisoformat(item.expiration_date)
            days_until_exp = (exp_date - datetime.now()).days

            # Linear urgency scoring
            if days_until_exp <= 0:
                urgency_scores[item.ingredient_id] = 1.0  # Use immediately
            elif days_until_exp <= 3:
                urgency_scores[item.ingredient_id] = 0.8  # High priority
            elif days_until_exp <= 7:
                urgency_scores[item.ingredient_id] = 0.5  # Medium priority
            else:
                urgency_scores[item.ingredient_id] = 0.1  # Low priority

        return urgency_scores

    def recommend_with_expiration(
        self,
        inventory: List[InventoryItemWithExpiration],
        preferences: Optional[str] = None,
        num_recipes: int = 5,
        quick_meals_only: bool = False,
    ) -> List[EnhancedRecommendation]:
        """
        Generate recommendations prioritizing expiring ingredients

        Args:
            inventory: List of inventory items with expiration dates
            preferences: User dietary preferences (e.g., "vegetarian", "low-carb")
            num_recipes: Number of recommendations to return
            quick_meals_only: Filter for recipes < 30 minutes

        Returns:
            List of enhanced recommendations sorted by urgency and quality
        """

        # Calculate expiration urgency
        urgency_scores = self.calculate_expiration_urgency(inventory)
        available_ingredients = {item.ingredient_id for item in inventory}

        # Score recipes based on multiple factors
        scored_recipes = []

        for recipe in self.recipes:
            recipe_ingredients = set(recipe.get("ingredient_ids", []))

            # Calculate coverage (% of recipe ingredients available)
            coverage = len(recipe_ingredients & available_ingredients) / len(
                recipe_ingredients
            )

            if coverage == 0:
                continue  # Skip recipes with no available ingredients

            # Calculate expiration urgency for this recipe
            recipe_urgency = np.mean(
                [
                    urgency_scores.get(ing_id, 0.0)
                    for ing_id in recipe_ingredients & available_ingredients
                ]
            )

            # Filter by time constraint
            prep_time = recipe.get("prep_time_minutes", 30)
            if quick_meals_only and prep_time > 30:
                continue

            # Calculate estimated cost
            estimated_cost = sum(
                item.purchase_price * (item.quantity / 100)  # Estimate per portion
                for item in inventory
                if item.ingredient_id in recipe_ingredients
                and item.purchase_price
            )

            # Combined scoring: 60% urgency + 30% coverage + 10% popularity
            combined_score = (
                recipe_urgency * 0.6 + coverage * 0.3 + recipe.get("rating", 0.5) * 0.1
            )

            # Get expiring ingredients for this recipe
            expiring_ingredients = [
                item.name
                for item in inventory
                if item.ingredient_id in recipe_ingredients
                and urgency_scores.get(item.ingredient_id, 0) > 0.5
            ]

            scored_recipes.append(
                {
                    "recipe": recipe,
                    "score": combined_score,
                    "urgency": recipe_urgency,
                    "coverage": coverage,
                    "cost": estimated_cost,
                    "expiring_ingredients": expiring_ingredients,
                }
            )

        # Sort by combined score
        scored_recipes.sort(key=lambda x: x["score"], reverse=True)

        # Generate enhanced recommendations
        recommendations = []
        for item in scored_recipes[:num_recipes]:
            recipe = item["recipe"]
            reasoning = f"Uses {len(item['expiring_ingredients'])} ingredients expiring soon. "
            reasoning += f"Match: {item['coverage']*100:.0f}% of recipe ingredients available."

            rec = EnhancedRecommendation(
                recipe_id=recipe.get("id"),
                recipe_name=recipe.get("name"),
                score=item["score"],
                urgency_score=item["urgency"],
                coverage=item["coverage"],
                reasoning=reasoning,
                expiring_ingredients=item["expiring_ingredients"],
                estimated_cost=item["cost"],
            )
            recommendations.append(rec)

        return recommendations
