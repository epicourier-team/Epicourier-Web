# backend/tests/test_inventory_recommender.py
"""
Unit tests for inventory-based recipe recommendations API.

Tests cover:
1. API endpoint validation
2. Inventory item formatting with expiration
3. Response structure validation
"""

import os
import sys
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

# ensure backend is on the import path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from api.index import app
from api.inventory_recommender import (
    InventoryItem,
    format_inventory_with_expiration,
    build_recommendation_prompt,
)

client = TestClient(app)


# --------------------------------------------------
# Unit Tests: Expiration Formatting
# --------------------------------------------------


class TestExpirationFormatting:
    """Tests for format_inventory_with_expiration function."""

    def test_format_no_expiration(self):
        """Items without expiration date should have no indicator."""
        inventory = [
            InventoryItem(
                ingredient_id=1,
                name="Salt",
                quantity=200,
                unit="g",
                expiration_date=None,
            )
        ]
        result = format_inventory_with_expiration(inventory)
        assert "Salt: 200" in result
        assert "g" in result
        assert "EXPIRED" not in result
        assert "EXPIRING" not in result

    def test_format_expired_item(self):
        """Expired items should have EXPIRED indicator."""
        yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        inventory = [
            InventoryItem(
                ingredient_id=1,
                name="Milk",
                quantity=1,
                unit="L",
                expiration_date=yesterday,
            )
        ]
        result = format_inventory_with_expiration(inventory)
        assert "Milk: 1" in result
        assert "EXPIRED" in result
        assert "❌" in result

    def test_format_expiring_soon(self):
        """Items expiring in 1-3 days should have EXPIRING SOON indicator."""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        inventory = [
            InventoryItem(
                ingredient_id=1,
                name="Eggs",
                quantity=6,
                unit="pieces",
                expiration_date=tomorrow,
            )
        ]
        result = format_inventory_with_expiration(inventory)
        assert "Eggs: 6" in result
        assert "EXPIRING" in result or "expires" in result.lower()

    def test_format_use_soon(self):
        """Items expiring in 4-7 days should have USE SOON indicator."""
        in_5_days = (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d")
        inventory = [
            InventoryItem(
                ingredient_id=1,
                name="Cheese",
                quantity=200,
                unit="g",
                expiration_date=in_5_days,
            )
        ]
        result = format_inventory_with_expiration(inventory)
        assert "Cheese: 200" in result
        assert "USE SOON" in result
        assert "⏰" in result

    def test_format_good_shelf_life(self):
        """Items with >7 days should just show date."""
        in_30_days = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        inventory = [
            InventoryItem(
                ingredient_id=1,
                name="Rice",
                quantity=500,
                unit="g",
                expiration_date=in_30_days,
            )
        ]
        result = format_inventory_with_expiration(inventory)
        assert "Rice: 500" in result
        assert in_30_days in result
        assert "EXPIRED" not in result
        assert "EXPIRING" not in result


class TestPromptBuilder:
    """Tests for Gemini prompt builder."""

    def test_prompt_contains_inventory(self):
        """Prompt should include formatted inventory."""
        inventory_text = "- Eggs: 6 pieces (expires in 2 days) ⚠️ EXPIRING SOON"
        recipes_text = "ID:1 | Omelette | Ingredients: eggs, butter"

        prompt = build_recommendation_prompt(
            inventory_text=inventory_text,
            recipes_text=recipes_text,
            preferences=None,
            num_recipes=3,
        )

        assert "Eggs: 6 pieces" in prompt
        assert "EXPIRING SOON" in prompt

    def test_prompt_contains_recipes(self):
        """Prompt should include recipe database."""
        inventory_text = "- Salt: 200 g"
        recipes_text = "ID:1 | Omelette | Ingredients: eggs, butter"

        prompt = build_recommendation_prompt(
            inventory_text=inventory_text,
            recipes_text=recipes_text,
            preferences=None,
            num_recipes=3,
        )

        assert "Omelette" in prompt
        assert "eggs, butter" in prompt

    def test_prompt_with_preferences(self):
        """Prompt should include user preferences if provided."""
        prompt = build_recommendation_prompt(
            inventory_text="- Chicken: 500 g",
            recipes_text="ID:1 | Chicken Curry | Ingredients: chicken",
            preferences="low carb, high protein",
            num_recipes=3,
        )

        assert "low carb, high protein" in prompt

    def test_prompt_without_preferences(self):
        """Prompt should show 'None specified' if no preferences."""
        prompt = build_recommendation_prompt(
            inventory_text="- Chicken: 500 g",
            recipes_text="ID:1 | Chicken Curry | Ingredients: chicken",
            preferences=None,
            num_recipes=3,
        )

        assert "None specified" in prompt

    def test_prompt_specifies_num_recipes(self):
        """Prompt should request exact number of recipes."""
        prompt = build_recommendation_prompt(
            inventory_text="- Chicken: 500 g",
            recipes_text="ID:1 | Recipe | Ingredients: chicken",
            preferences=None,
            num_recipes=7,
        )

        assert "exactly 7 recipes" in prompt


# --------------------------------------------------
# API Endpoint Tests
# --------------------------------------------------


class TestInventoryRecommendEndpoint:
    """Tests for POST /inventory-recommend endpoint."""

    def test_empty_inventory_returns_400(self):
        """Empty inventory should return 400 error."""
        payload = {"inventory": [], "num_recipes": 3}
        response = client.post("/inventory-recommend", json=payload)
        assert response.status_code == 400
        assert "empty" in response.json()["detail"].lower()

    def test_invalid_num_recipes_too_low(self):
        """num_recipes < 1 should return 422 (Pydantic validation) error."""
        payload = {
            "inventory": [
                {"ingredient_id": 1, "name": "Eggs", "quantity": 6, "unit": "pieces"}
            ],
            "num_recipes": 0,
        }
        response = client.post("/inventory-recommend", json=payload)
        # Pydantic Field constraint returns 422
        assert response.status_code == 422

    def test_invalid_num_recipes_too_high(self):
        """num_recipes > 10 should return 422 (Pydantic validation) error."""
        payload = {
            "inventory": [
                {"ingredient_id": 1, "name": "Eggs", "quantity": 6, "unit": "pieces"}
            ],
            "num_recipes": 15,
        }
        response = client.post("/inventory-recommend", json=payload)
        # Pydantic Field constraint returns 422
        assert response.status_code == 422

    def test_missing_required_field(self):
        """Missing required field should return 422 error."""
        # Missing 'name' field
        payload = {
            "inventory": [{"ingredient_id": 1, "quantity": 6, "unit": "pieces"}],
            "num_recipes": 3,
        }
        response = client.post("/inventory-recommend", json=payload)
        assert response.status_code == 422

    @patch("api.index.recommend_from_inventory")
    def test_successful_recommendation(self, mock_recommend):
        """Valid request should return recommendations."""
        from api.inventory_recommender import (
            InventoryRecommendResponse,
            RecommendedRecipe,
        )

        # Mock the Gemini API call to return a proper response object
        mock_recommend.return_value = InventoryRecommendResponse(
            recommendations=[
                RecommendedRecipe(
                    recipe_id=1,
                    recipe_name="Test Recipe",
                    match_score=85,
                    ingredients_available=["Eggs"],
                    ingredients_missing=["Butter"],
                    expiring_ingredients_used=["Eggs"],
                    reason="Uses expiring eggs",
                )
            ],
            shopping_suggestions=["Butter"],
            overall_reasoning="Based on your inventory...",
        )

        payload = {
            "inventory": [
                {
                    "ingredient_id": 1,
                    "name": "Eggs",
                    "quantity": 6,
                    "unit": "pieces",
                    "expiration_date": "2025-12-02",
                }
            ],
            "num_recipes": 3,
        }
        response = client.post("/inventory-recommend", json=payload)

        # Should call the recommend function
        mock_recommend.assert_called_once()
        assert response.status_code == 200

        data = response.json()
        assert "recommendations" in data
        assert "shopping_suggestions" in data
        assert "overall_reasoning" in data


# --------------------------------------------------
# Integration Test (requires GEMINI_API_KEY)
# --------------------------------------------------


@pytest.mark.skipif(not os.getenv("GEMINI_API_KEY"), reason="GEMINI_API_KEY not set")
class TestInventoryRecommendIntegration:
    """Integration tests that call actual Gemini API."""

    def test_real_recommendation(self):
        """Test with real API call (slow, requires API key)."""
        payload = {
            "inventory": [
                {"ingredient_id": 39, "name": "Eggs", "quantity": 6, "unit": "pieces"},
                {"ingredient_id": 24, "name": "Butter", "quantity": 100, "unit": "g"},
                {"ingredient_id": 41, "name": "Flour", "quantity": 500, "unit": "g"},
            ],
            "num_recipes": 3,
        }
        response = client.post("/inventory-recommend", json=payload)

        assert response.status_code == 200
        data = response.json()

        # Validate response structure
        assert "recommendations" in data
        assert len(data["recommendations"]) <= 3

        for rec in data["recommendations"]:
            assert "recipe_id" in rec
            assert "recipe_name" in rec
            assert "match_score" in rec
            assert 0 <= rec["match_score"] <= 100
            assert "ingredients_available" in rec
            assert "ingredients_missing" in rec
            assert "reason" in rec
