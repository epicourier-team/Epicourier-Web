"""
Test cases for index.py (FastAPI endpoints)
"""

import pytest
from fastapi.testclient import TestClient
from fastapi import HTTPException
from unittest.mock import Mock, patch, MagicMock
from api.index import app


# Test client
client = TestClient(app)


# Test fixtures
@pytest.fixture
def mock_supabase():
    """Mock Supabase client."""
    with patch('api.index.supabase') as mock_sb:
        # Setup default mock behavior
        mock_sb.table.return_value.select.return_value.limit.return_value.execute.return_value.data = []
        yield mock_sb


@pytest.fixture
def mock_create_meal_plan():
    """Mock create_meal_plan function."""
    with patch('api.index.create_meal_plan') as mock_plan:
        yield mock_plan


@pytest.fixture
def sample_meal_plan():
    """Sample meal plan response."""
    return [
        {
            "meal_number": 1,
            "id": 1,
            "name": "Veggie Stir Fry",
            "tags": ["vegetarian"],
            "key_ingredients": ["tofu", "broccoli"],
            "reason": "High match",
            "similarity_score": 0.9,
            "recipe": "Cook tofu with vegetables"
        }
    ]


# Test GET /test endpoint
def test_test_endpoint_success(mock_supabase):
    """Test /test endpoint returns recipe data."""
    mock_supabase.table.return_value.select.return_value.limit.return_value.execute.return_value.data = [
        {"id": 1, "name": "Recipe 1"},
        {"id": 2, "name": "Recipe 2"}
    ]
    
    response = client.get("/test")
    assert response.status_code == 200
    assert "message" in response.json()
    assert len(response.json()["message"]) == 2


# Test POST /recommender - Success cases
def test_recommend_meals_success(mock_create_meal_plan, sample_meal_plan):
    """Test successful meal recommendation."""
    mock_create_meal_plan.return_value = (sample_meal_plan, "Expanded goal")
    
    response = client.post("/recommender", json={
        "goal": "lose weight",
        "numMeals": 3
    })
    
    assert response.status_code == 200
    assert "recipes" in response.json()
    assert "goal_expanded" in response.json()
    assert len(response.json()["recipes"]) == 1


def test_recommend_meals_with_user_profile(mock_create_meal_plan, sample_meal_plan):
    """Test recommendation with user profile."""
    mock_create_meal_plan.return_value = (sample_meal_plan, "Expanded goal")
    
    response = client.post("/recommender", json={
        "goal": "build muscle",
        "numMeals": 5,
        "userProfile": {
            "allergies": ["peanuts"],
            "dietary_preferences": ["Vegetarian"]
        }
    })
    
    assert response.status_code == 200
    assert response.json()["recipes"] == sample_meal_plan


def test_recommend_meals_with_pantry_items(mock_create_meal_plan, sample_meal_plan):
    """Test recommendation with pantry items."""
    mock_create_meal_plan.return_value = (sample_meal_plan, "Expanded goal")
    
    response = client.post("/recommender", json={
        "goal": "quick dinner",
        "numMeals": 3,
        "pantryItems": ["tomato", "pasta", "cheese"]
    })
    
    assert response.status_code == 200
    mock_create_meal_plan.assert_called_once()


# Test POST /recommender - Validation errors (400)
def test_recommend_meals_empty_goal():
    """Test validation fails with empty goal."""
    response = client.post("/recommender", json={
        "goal": "",
        "numMeals": 3
    })
    
    assert response.status_code == 400
    assert "Goal cannot be empty" in response.json()["detail"]


def test_recommend_meals_whitespace_goal():
    """Test validation fails with whitespace-only goal."""
    response = client.post("/recommender", json={
        "goal": "   ",
        "numMeals": 3
    })
    
    assert response.status_code == 400
    assert "Goal cannot be empty" in response.json()["detail"]


def test_recommend_meals_invalid_num_meals():
    """Test validation fails with invalid number of meals."""
    response = client.post("/recommender", json={
        "goal": "lose weight",
        "numMeals": 4
    })
    
    assert response.status_code == 400
    assert "numMeals must be one of 3, 5, or 7" in response.json()["detail"]


def test_recommend_meals_num_meals_too_low():
    """Test validation fails with too few meals."""
    response = client.post("/recommender", json={
        "goal": "gain muscle",
        "numMeals": 1
    })
    
    assert response.status_code == 400


def test_recommend_meals_num_meals_too_high():
    """Test validation fails with too many meals."""
    response = client.post("/recommender", json={
        "goal": "maintain weight",
        "numMeals": 10
    })
    
    assert response.status_code == 400


# Test POST /recommender - No recipes found (404)
def test_recommend_meals_no_recipes_found(mock_create_meal_plan):
    """Test 404 when no recipes match criteria."""
    mock_create_meal_plan.return_value = ([], "Expanded goal")
    
    response = client.post("/recommender", json={
        "goal": "impossible diet",
        "numMeals": 3
    })
    
    assert response.status_code == 404
    assert "No suitable recipes found" in response.json()["detail"]


# Test POST /recommender - User profile fetch errors
# Test POST /recommender - Server errors (500)
def test_recommend_meals_unexpected_error(mock_create_meal_plan):
    """Test handles unexpected errors."""
    mock_create_meal_plan.side_effect = Exception("Unexpected error")
    
    response = client.post("/recommender", json={
        "goal": "lose weight",
        "numMeals": 3
    })
    
    assert response.status_code == 500
    assert "An error occurred while generating recommendations" in response.json()["detail"]


def test_recommend_meals_runtime_error(mock_create_meal_plan):
    """Test handles runtime errors from LLM."""
    mock_create_meal_plan.side_effect = RuntimeError("LLM services unavailable")
    
    response = client.post("/recommender", json={
        "goal": "build muscle",
        "numMeals": 5
    })
    
    assert response.status_code == 500


# Test request model validation
def test_recommend_meals_missing_goal():
    """Test missing goal field."""
    response = client.post("/recommender", json={
        "numMeals": 3
    })
    
    assert response.status_code == 422  # Validation error


def test_recommend_meals_missing_num_meals():
    """Test missing numMeals field."""
    response = client.post("/recommender", json={
        "goal": "lose weight"
    })
    
    assert response.status_code == 422


def test_recommend_meals_invalid_json():
    """Test invalid JSON payload."""
    response = client.post("/recommender", data="invalid json")
    
    assert response.status_code == 422


# Test with all parameters
# Additional edge case tests
def test_recommend_meals_7_meals(mock_create_meal_plan, sample_meal_plan):
    """Test with 7 meals."""
    mock_create_meal_plan.return_value = (sample_meal_plan * 7, "Expanded goal")
    
    response = client.post("/recommender", json={
        "goal": "weekly meal prep",
        "numMeals": 7
    })
    
    assert response.status_code == 200


def test_recommend_meals_5_meals(mock_create_meal_plan, sample_meal_plan):
    """Test with 5 meals."""
    mock_create_meal_plan.return_value = (sample_meal_plan * 5, "Expanded goal")
    
    response = client.post("/recommender", json={
        "goal": "work week meals",
        "numMeals": 5
    })
    
    assert response.status_code == 200


def test_recommend_meals_long_goal(mock_create_meal_plan, sample_meal_plan):
    """Test with very long goal text."""
    mock_create_meal_plan.return_value = (sample_meal_plan, "Expanded goal")
    
    long_goal = "I want to lose weight while maintaining muscle mass and eating healthy nutritious meals " * 10
    
    response = client.post("/recommender", json={
        "goal": long_goal,
        "numMeals": 3
    })
    
    assert response.status_code == 200


def test_recommend_meals_special_characters_goal(mock_create_meal_plan, sample_meal_plan):
    """Test with special characters in goal."""
    mock_create_meal_plan.return_value = (sample_meal_plan, "Expanded goal")
    
    response = client.post("/recommender", json={
        "goal": "lose 5kg & gain muscle! @2000 cal/day",
        "numMeals": 3
    })
    
    assert response.status_code == 200


def test_recommend_meals_unicode_goal(mock_create_meal_plan, sample_meal_plan):
    """Test with unicode characters in goal."""
    mock_create_meal_plan.return_value = (sample_meal_plan, "Expanded goal")
    
    response = client.post("/recommender", json={
        "goal": "健康的饮食 healthy diet 🥗",
        "numMeals": 3
    })
    
    assert response.status_code == 200


def test_recommend_meals_empty_user_profile(mock_create_meal_plan, sample_meal_plan):
    """Test with empty user profile."""
    mock_create_meal_plan.return_value = (sample_meal_plan, "Expanded goal")
    
    response = client.post("/recommender", json={
        "goal": "healthy meals",
        "numMeals": 3,
        "userProfile": {}
    })
    
    assert response.status_code == 200


def test_recommend_meals_empty_pantry(mock_create_meal_plan, sample_meal_plan):
    """Test with empty pantry items."""
    mock_create_meal_plan.return_value = (sample_meal_plan, "Expanded goal")
    
    response = client.post("/recommender", json={
        "goal": "quick meals",
        "numMeals": 3,
        "pantryItems": []
    })
    
    assert response.status_code == 200


def test_recommend_meals_many_pantry_items(mock_create_meal_plan, sample_meal_plan):
    """Test with many pantry items."""
    mock_create_meal_plan.return_value = (sample_meal_plan, "Expanded goal")
    
    pantry = [f"ingredient_{i}" for i in range(50)]
    
    response = client.post("/recommender", json={
        "goal": "use pantry items",
        "numMeals": 3,
        "pantryItems": pantry
    })
    
    assert response.status_code == 200


def test_recommend_meals_complex_user_profile(mock_create_meal_plan, sample_meal_plan):
    """Test with complex user profile."""
    mock_create_meal_plan.return_value = (sample_meal_plan, "Expanded goal")
    
    response = client.post("/recommender", json={
        "goal": "balanced diet",
        "numMeals": 5,
        "userProfile": {
            "allergies": ["peanuts", "shellfish", "dairy"],
            "dietary_preferences": ["Vegetarian", "Gluten-free"],
            "kitchen_equipment": ["oven", "blender", "air fryer"]
        }
    })
    
    assert response.status_code == 200


def test_recommend_meals_http_exception_propagation(mock_create_meal_plan):
    """Test that HTTPException is properly propagated."""
    mock_create_meal_plan.side_effect = HTTPException(status_code=404, detail="Test error")
    
    response = client.post("/recommender", json={
        "goal": "test",
        "numMeals": 3
    })
    
    assert response.status_code == 404


def test_recommend_meals_value_error(mock_create_meal_plan):
    """Test handling of ValueError."""
    mock_create_meal_plan.side_effect = ValueError("Invalid value")
    
    response = client.post("/recommender", json={
        "goal": "test",
        "numMeals": 3
    })
    
    assert response.status_code == 500


def test_recommend_meals_type_error(mock_create_meal_plan):
    """Test handling of TypeError."""
    mock_create_meal_plan.side_effect = TypeError("Type error")
    
    response = client.post("/recommender", json={
        "goal": "test",
        "numMeals": 3
    })
    
    assert response.status_code == 500


def test_recommend_meals_none_goal():
    """Test with None as goal."""
    response = client.post("/recommender", json={
        "goal": None,
        "numMeals": 3
    })
    
    assert response.status_code == 422  # Validation error


def test_recommend_meals_num_meals_string():
    """Test with string instead of int for numMeals."""
    response = client.post("/recommender", json={
        "goal": "lose weight",
        "numMeals": "three"
    })
    
    assert response.status_code == 422


def test_recommend_meals_num_meals_float():
    """Test with float for numMeals."""
    response = client.post("/recommender", json={
        "goal": "gain muscle",
        "numMeals": 3.5
    })
    
    assert response.status_code == 422


def test_recommend_meals_num_meals_negative():
    """Test with negative numMeals."""
    response = client.post("/recommender", json={
        "goal": "healthy diet",
        "numMeals": -3
    })
    
    assert response.status_code == 400


def test_recommend_meals_num_meals_zero():
    """Test with zero numMeals."""
    response = client.post("/recommender", json={
        "goal": "meal plan",
        "numMeals": 0
    })
    
    assert response.status_code == 400


def test_test_endpoint_empty_recipes(mock_supabase):
    """Test /test endpoint with no recipes."""
    mock_supabase.table.return_value.select.return_value.limit.return_value.execute.return_value.data = []
    
    response = client.get("/test")
    assert response.status_code == 200
    assert response.json()["message"] == []


# Test user profile fetching (lines 77-99)
@patch('api.index.supabase')
@patch('api.index.create_meal_plan')
def test_recommend_with_user_id_success(mock_meal_plan, mock_sb, sample_meal_plan):
    """Test user profile fetching with valid user_id."""
    # Mock user table response
    mock_user_table = Mock()
    mock_user_select = Mock()
    mock_user_eq = Mock()
    mock_user_exec = Mock()
    mock_user_exec.data = [{
        "id": 123,
        "allergies": ["nuts"],
        "dietary_preferences": ["Vegetarian"],
        "kitchen_equipment": ["oven"]
    }]
    mock_user_eq.execute.return_value = mock_user_exec
    mock_user_select.eq.return_value = mock_user_eq
    mock_user_table.select.return_value = mock_user_select
    
    # Mock pantry table response
    mock_pantry_table = Mock()
    mock_pantry_select = Mock()
    mock_pantry_eq = Mock()
    mock_pantry_exec = Mock()
    mock_pantry_exec.data = [{"name": "rice"}, {"name": "beans"}]
    mock_pantry_eq.execute.return_value = mock_pantry_exec
    mock_pantry_select.eq.return_value = mock_pantry_eq
    mock_pantry_table.select.return_value = mock_pantry_select
    
    # Setup table mock to return different mocks for User and PantryItem
    def table_side_effect(name):
        if name == "User":
            return mock_user_table
        elif name == "PantryItem":
            return mock_pantry_table
        return Mock()
    
    mock_sb.table.side_effect = table_side_effect
    mock_meal_plan.return_value = (sample_meal_plan, "Expanded goal")
    
    response = client.post("/recommender", json={
        "goal": "healthy meals",
        "numMeals": 3,
        "userId": 123
    })
    
    assert response.status_code == 200
    # Verify create_meal_plan was called with user profile
    call_args = mock_meal_plan.call_args
    assert call_args[1]['user_profile'] is not None
    assert call_args[1]['user_profile']['allergies'] == ["nuts"]
    assert call_args[1]['pantry_items'] == ["rice", "beans"]


@patch('api.index.supabase')
@patch('api.index.create_meal_plan')
def test_recommend_with_user_id_no_data(mock_meal_plan, mock_sb, sample_meal_plan):
    """Test user profile fetching when user not found."""
    mock_table = Mock()
    mock_select = Mock()
    mock_eq = Mock()
    mock_exec = Mock()
    mock_exec.data = []  # No user found
    mock_eq.execute.return_value = mock_exec
    mock_select.eq.return_value = mock_eq
    mock_table.select.return_value = mock_select
    mock_sb.table.return_value = mock_table
    
    mock_meal_plan.return_value = (sample_meal_plan, "Expanded goal")
    
    response = client.post("/recommender", json={
        "goal": "healthy meals",
        "numMeals": 3,
        "userId": 999
    })
    
    assert response.status_code == 200


@patch('api.index.supabase')
@patch('api.index.create_meal_plan')
def test_recommend_with_user_id_exception(mock_meal_plan, mock_sb, sample_meal_plan):
    """Test user profile fetching handles exceptions."""
    mock_table = Mock()
    mock_table.select.side_effect = Exception("Database error")
    mock_sb.table.return_value = mock_table
    mock_meal_plan.return_value = (sample_meal_plan, "Expanded goal")
    
    response = client.post("/recommender", json={
        "goal": "healthy meals",
        "numMeals": 3,
        "userId": 123
    })
    
    assert response.status_code == 200  # Should continue without profile


@patch('api.index.supabase')
@patch('api.index.create_meal_plan')
def test_recommend_with_user_id_null_fields(mock_meal_plan, mock_sb, sample_meal_plan):
    """Test user profile with null fields."""
    # Mock user table
    mock_user_table = Mock()
    mock_user_select = Mock()
    mock_user_eq = Mock()
    mock_user_exec = Mock()
    mock_user_exec.data = [{
        "id": 123,
        "allergies": None,
        "dietary_preferences": None,
        "kitchen_equipment": None
    }]
    mock_user_eq.execute.return_value = mock_user_exec
    mock_user_select.eq.return_value = mock_user_eq
    mock_user_table.select.return_value = mock_user_select
    
    # Mock pantry table (empty)
    mock_pantry_table = Mock()
    mock_pantry_select = Mock()
    mock_pantry_eq = Mock()
    mock_pantry_exec = Mock()
    mock_pantry_exec.data = []
    mock_pantry_eq.execute.return_value = mock_pantry_exec
    mock_pantry_select.eq.return_value = mock_pantry_eq
    mock_pantry_table.select.return_value = mock_pantry_select
    
    def table_side_effect(name):
        if name == "User":
            return mock_user_table
        elif name == "PantryItem":
            return mock_pantry_table
        return Mock()
    
    mock_sb.table.side_effect = table_side_effect
    mock_meal_plan.return_value = (sample_meal_plan, "Expanded goal")
    
    response = client.post("/recommender", json={
        "goal": "healthy meals",
        "numMeals": 3,
        "userId": 123
    })
    
    assert response.status_code == 200
    # Verify empty lists were passed
    call_args = mock_meal_plan.call_args
    assert call_args[1]['user_profile']['allergies'] == []


@patch('api.index.supabase')
@patch('api.index.create_meal_plan')
def test_recommend_with_user_id_non_list_fields(mock_meal_plan, mock_sb, sample_meal_plan):
    """Test user profile with non-list fields."""
    # Mock user table
    mock_user_table = Mock()
    mock_user_select = Mock()
    mock_user_eq = Mock()
    mock_user_exec = Mock()
    mock_user_exec.data = [{
        "id": 123,
        "allergies": "peanuts",  # String instead of list
        "dietary_preferences": "Vegan",
        "kitchen_equipment": "oven"
    }]
    mock_user_eq.execute.return_value = mock_user_exec
    mock_user_select.eq.return_value = mock_user_eq
    mock_user_table.select.return_value = mock_user_select
    
    # Mock pantry table (empty)
    mock_pantry_table = Mock()
    mock_pantry_select = Mock()
    mock_pantry_eq = Mock()
    mock_pantry_exec = Mock()
    mock_pantry_exec.data = []
    mock_pantry_eq.execute.return_value = mock_pantry_exec
    mock_pantry_select.eq.return_value = mock_pantry_eq
    mock_pantry_table.select.return_value = mock_pantry_select
    
    def table_side_effect(name):
        if name == "User":
            return mock_user_table
        elif name == "PantryItem":
            return mock_pantry_table
        return Mock()
    
    mock_sb.table.side_effect = table_side_effect
    mock_meal_plan.return_value = (sample_meal_plan, "Expanded goal")
    
    response = client.post("/recommender", json={
        "goal": "healthy meals",
        "numMeals": 3,
        "userId": 123
    })
    
    assert response.status_code == 200
    # Verify empty lists were passed (non-list values converted)
    call_args = mock_meal_plan.call_args
    assert call_args[1]['user_profile']['allergies'] == []


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
