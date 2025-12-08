"""
Test cases for recommender.py
"""

import pytest
import pandas as pd
from unittest.mock import Mock, patch, MagicMock
from api.recommender import (
    make_recipe_text,
    filter_allergens,
    filter_dietary_preferences,
    calculate_pantry_score,
    score_kitchen_equipment,
    llm_filter_recipes,
    select_diverse_recipes,
)


# Test Fixtures
@pytest.fixture
def sample_recipe_data():
    """Sample recipe dataframe for testing."""
    return pd.DataFrame({
        'id': [1, 2, 3, 4],
        'name': ['Veggie Stir Fry', 'Chicken Curry', 'Vegan Salad', 'Fish Tacos'],
        'ingredients': [
            ['tofu', 'broccoli', 'soy sauce'],
            ['chicken breast', 'curry powder', 'coconut milk'],
            ['lettuce', 'tomato', 'olive oil'],
            ['fish fillet', 'tortilla', 'lime']
        ],
        'tags': [
            ['vegetarian', 'quick'],
            ['protein-rich'],
            ['vegan', 'healthy'],
            ['seafood']
        ],
        'description': ['Quick stir fry', 'Spicy curry', 'Fresh salad', 'Mexican tacos'],
        'similarity': [0.9, 0.85, 0.8, 0.75]
    })


@pytest.fixture
def sample_user_profile():
    """Sample user profile for testing."""
    return {
        'dietary_preferences': ['Vegetarian'],
        'allergies': ['peanuts'],
        'kitchen_equipment': ['oven', 'blender']
    }


# Test make_recipe_text
def test_make_recipe_text():
    """Test recipe text generation."""
    row = {
        'description': 'Delicious pasta',
        'ingredients': ['pasta', 'tomato', 'basil'],
        'tags': ['italian', 'quick']
    }
    result = make_recipe_text(row)
    assert 'Delicious pasta' in result
    assert 'pasta, tomato, basil' in result
    assert 'italian, quick' in result


# Test filter_allergens
def test_filter_allergens_removes_allergen(sample_recipe_data):
    """Test that recipes with allergens are filtered out."""
    # Add peanut ingredient to one recipe
    sample_recipe_data.at[0, 'ingredients'] = ['tofu', 'peanuts', 'soy sauce']
    
    filtered = filter_allergens(sample_recipe_data, ['peanuts'])
    assert len(filtered) == 3
    assert 1 not in filtered['id'].values


def test_filter_allergens_no_allergy(sample_recipe_data):
    """Test that 'No Allergy' returns all recipes."""
    filtered = filter_allergens(sample_recipe_data, ['No Allergy'])
    assert len(filtered) == len(sample_recipe_data)


def test_filter_allergens_empty_list(sample_recipe_data):
    """Test that empty allergen list returns all recipes."""
    filtered = filter_allergens(sample_recipe_data, [])
    assert len(filtered) == len(sample_recipe_data)


# Test filter_dietary_preferences
def test_filter_dietary_vegetarian(sample_recipe_data):
    """Test vegetarian filter removes meat/fish recipes."""
    filtered = filter_dietary_preferences(sample_recipe_data, ['Vegetarian'])
    assert len(filtered) == 2  # Only veggie stir fry and vegan salad
    assert 'Chicken Curry' not in filtered['name'].values
    assert 'Fish Tacos' not in filtered['name'].values


def test_filter_dietary_vegan(sample_recipe_data):
    """Test vegan filter removes all animal products."""
    # Add dairy to one vegetarian recipe
    sample_recipe_data.at[0, 'ingredients'] = ['tofu', 'cheese', 'soy sauce']
    
    filtered = filter_dietary_preferences(sample_recipe_data, ['Vegan'])
    assert len(filtered) == 1  # Only vegan salad
    assert 'Vegan Salad' in filtered['name'].values


def test_filter_dietary_no_preferences(sample_recipe_data):
    """Test that empty preferences returns all recipes."""
    filtered = filter_dietary_preferences(sample_recipe_data, [])
    assert len(filtered) == len(sample_recipe_data)


# Test calculate_pantry_score
def test_calculate_pantry_score_full_match():
    """Test pantry score with all ingredients available."""
    ingredients = ['tomato', 'basil', 'pasta']
    pantry = ['tomato', 'basil', 'pasta', 'olive oil']
    score = calculate_pantry_score(ingredients, pantry)
    assert score == 1.0


def test_calculate_pantry_score_partial_match():
    """Test pantry score with some ingredients available."""
    ingredients = ['tomato', 'basil', 'pasta', 'cheese']
    pantry = ['tomato', 'basil']
    score = calculate_pantry_score(ingredients, pantry)
    assert score == 0.5


def test_calculate_pantry_score_no_match():
    """Test pantry score with no ingredients available."""
    ingredients = ['tomato', 'basil']
    pantry = ['chicken', 'rice']
    score = calculate_pantry_score(ingredients, pantry)
    assert score == 0.0


def test_calculate_pantry_score_empty_pantry():
    """Test pantry score with empty pantry."""
    ingredients = ['tomato', 'basil']
    pantry = []
    score = calculate_pantry_score(ingredients, pantry)
    assert score == 0.0


# Test score_kitchen_equipment
def test_score_kitchen_equipment_match():
    """Test equipment score with matching equipment."""
    recipe = {'tags': ['oven-baked', 'quick']}
    equipment = ['oven', 'blender']
    score = score_kitchen_equipment(recipe, equipment)
    assert score == 1.0


def test_score_kitchen_equipment_no_match():
    """Test equipment score with no matching equipment."""
    recipe = {'tags': ['stovetop', 'quick']}
    equipment = ['oven', 'blender']
    score = score_kitchen_equipment(recipe, equipment)
    assert score == 0.0


def test_score_kitchen_equipment_no_tags():
    """Test equipment score with no tags."""
    recipe = {'tags': []}
    equipment = ['oven']
    score = score_kitchen_equipment(recipe, equipment)
    assert score == 0.0


# Test llm_filter_recipes
@patch('api.recommender.load_groq_client')
def test_llm_filter_recipes_success(mock_groq, sample_recipe_data, sample_user_profile):
    """Test LLM filtering with successful response."""
    # Mock Groq response
    mock_client = Mock()
    mock_response = Mock()
    mock_response.choices = [Mock(message=Mock(content='[1, 3]'))]
    mock_client.chat.completions.create.return_value = mock_response
    mock_groq.return_value = mock_client
    
    filtered = llm_filter_recipes(sample_recipe_data, sample_user_profile)
    assert len(filtered) == 2
    assert set(filtered['id'].values) == {1, 3}


@patch('api.recommender.load_groq_client')
def test_llm_filter_recipes_no_profile(mock_groq, sample_recipe_data):
    """Test LLM filtering with no user profile."""
    filtered = llm_filter_recipes(sample_recipe_data, None)
    assert len(filtered) == len(sample_recipe_data)


@patch('api.recommender.load_groq_client')
def test_llm_filter_recipes_api_failure(mock_groq, sample_recipe_data, sample_user_profile):
    """Test LLM filtering handles API failure gracefully."""
    mock_client = Mock()
    mock_client.chat.completions.create.side_effect = Exception("API Error")
    mock_groq.return_value = mock_client
    
    filtered = llm_filter_recipes(sample_recipe_data, sample_user_profile)
    assert len(filtered) == len(sample_recipe_data)  # Returns unfiltered


# Test select_diverse_recipes
@patch('api.recommender.load_embedder')
def test_select_diverse_recipes(mock_embedder, sample_recipe_data):
    """Test diverse recipe selection."""
    # Mock embedder
    mock_model = Mock()
    mock_model.encode.return_value = [[0.1, 0.2], [0.3, 0.4], [0.5, 0.6], [0.7, 0.8]]
    mock_embedder.return_value = mock_model
    
    # Add recipe_text column
    sample_recipe_data['recipe_text'] = sample_recipe_data.apply(make_recipe_text, axis=1)
    
    diverse = select_diverse_recipes(sample_recipe_data, n_meals=3)
    assert len(diverse) <= 3


def test_select_diverse_recipes_fewer_than_requested(sample_recipe_data):
    """Test diverse selection when fewer recipes than requested."""
    sample_recipe_data['recipe_text'] = sample_recipe_data.apply(make_recipe_text, axis=1)
    
    diverse = select_diverse_recipes(sample_recipe_data.head(2), n_meals=5)
    assert len(diverse) == 2


# Integration test
@patch('api.recommender.load_groq_client')
@patch('api.recommender.load_embedder')
@patch('api.recommender.load_supabase')
def test_create_meal_plan_integration(mock_supabase, mock_embedder, mock_groq):
    """Test full meal plan creation flow."""
    from api.recommender import create_meal_plan
    
    # Mock Supabase
    mock_sb = Mock()
    mock_sb.rpc.return_value.execute.return_value.data = [
        {'id': 1, 'similarity': 0.9},
        {'id': 3, 'similarity': 0.8}
    ]
    mock_supabase.return_value = mock_sb
    
    # Mock embedder
    mock_model = Mock()
    import numpy as np
    mock_model.encode.return_value = np.array([0.1] * 384)
    mock_embedder.return_value = mock_model
    
    # Mock Groq
    mock_client = Mock()
    mock_response = Mock()
    mock_response.choices = [Mock(message=Mock(content='calories: 2000kcal'))]
    mock_client.chat.completions.create.return_value = mock_response
    mock_groq.return_value = mock_client
    
    # Mock load_recipe_data
    with patch('api.recommender.load_recipe_data') as mock_recipe_data:
        mock_recipe_data.return_value = pd.DataFrame({
            'id': [1, 3],
            'name': ['Recipe 1', 'Recipe 3'],
            'ingredients': [['ing1', 'ing2'], ['ing3', 'ing4']],
            'tags': [['tag1'], ['tag2']],
            'description': ['desc1', 'desc2']
        })
        
        plan, goal = create_meal_plan('lose weight', n_meals=3)
        
        assert isinstance(plan, list)
        assert isinstance(goal, str)


# Test nutrition_goal
@patch('api.recommender.load_groq_client')
def test_nutrition_goal_success(mock_groq):
    """Test nutrition goal generation."""
    mock_client = Mock()
    mock_response = Mock()
    mock_response.choices = [Mock(message=Mock(content='calories: 2000kcal, protein: 150g'))]
    mock_client.chat.completions.create.return_value = mock_response
    mock_groq.return_value = mock_client
    
    from api.recommender import nutrition_goal
    result = nutrition_goal('lose weight')
    assert 'calories' in result.lower()


@patch('api.recommender.load_groq_client')
def test_nutrition_goal_with_profile(mock_groq):
    """Test nutrition goal with user profile."""
    mock_client = Mock()
    mock_response = Mock()
    mock_response.choices = [Mock(message=Mock(content='calories: 1800kcal'))]
    mock_client.chat.completions.create.return_value = mock_response
    mock_groq.return_value = mock_client
    
    from api.recommender import nutrition_goal
    profile = {'dietary_preferences': ['Vegetarian'], 'allergies': ['nuts']}
    result = nutrition_goal('gain muscle', profile)
    assert isinstance(result, str)


@patch('api.recommender.load_groq_client')
def test_nutrition_goal_api_failure(mock_groq):
    """Test nutrition goal handles API failure."""
    mock_client = Mock()
    mock_client.chat.completions.create.side_effect = Exception("API Error")
    mock_groq.return_value = mock_client
    
    from api.recommender import nutrition_goal
    with pytest.raises(RuntimeError, match="LLM services unavailable"):
        nutrition_goal('lose weight')


# Test expand_goal
@patch('api.recommender.load_groq_client')
def test_expand_goal_success(mock_groq):
    """Test goal expansion."""
    mock_client = Mock()
    mock_response = Mock()
    mock_response.choices = [Mock(message=Mock(content='Expanded nutritional plan'))]
    mock_client.chat.completions.create.return_value = mock_response
    mock_groq.return_value = mock_client
    
    from api.recommender import expand_goal
    result = expand_goal('build muscle')
    assert isinstance(result, str)
    assert len(result) > 0


@patch('api.recommender.load_groq_client')
def test_expand_goal_api_failure(mock_groq):
    """Test expand goal handles API failure."""
    mock_client = Mock()
    mock_client.chat.completions.create.side_effect = Exception("API Error")
    mock_groq.return_value = mock_client
    
    from api.recommender import expand_goal
    with pytest.raises(RuntimeError, match="LLM services unavailable"):
        expand_goal('lose weight')


# Test rank_recipes_by_goal
@patch('api.recommender.load_recipe_data')
@patch('api.recommender.load_supabase')
@patch('api.recommender.load_embedder')
@patch('api.recommender.nutrition_goal')
def test_rank_recipes_by_goal(mock_nutrition, mock_embedder, mock_supabase, mock_recipe_data):
    """Test recipe ranking."""
    # Mock nutrition goal
    mock_nutrition.return_value = 'calories: 2000kcal'
    
    # Mock embedder
    mock_model = Mock()
    import numpy as np
    mock_model.encode.return_value = np.array([0.1] * 384)
    mock_embedder.return_value = mock_model
    
    # Mock Supabase
    mock_sb = Mock()
    mock_sb.rpc.return_value.execute.return_value.data = [
        {'id': 1, 'similarity': 0.9},
        {'id': 2, 'similarity': 0.8}
    ]
    mock_supabase.return_value = mock_sb
    
    # Mock recipe data
    mock_recipe_data.return_value = pd.DataFrame({
        'id': [1, 2],
        'name': ['Recipe 1', 'Recipe 2'],
        'ingredients': [['ing1'], ['ing2']],
        'tags': [['tag1'], ['tag2']],
        'description': ['desc1', 'desc2']
    })
    
    from api.recommender import rank_recipes_by_goal
    ranked, nutri_goal = rank_recipes_by_goal('lose weight')
    
    assert len(ranked) > 0
    assert 'recipe_text' in ranked.columns


@patch('api.recommender.load_supabase')
@patch('api.recommender.load_embedder')
@patch('api.recommender.nutrition_goal')
def test_rank_recipes_empty_result(mock_nutrition, mock_embedder, mock_supabase):
    """Test ranking with no recipes found."""
    mock_nutrition.return_value = 'calories: 2000kcal'
    
    mock_model = Mock()
    import numpy as np
    mock_model.encode.return_value = np.array([0.1] * 384)
    mock_embedder.return_value = mock_model
    
    mock_sb = Mock()
    mock_sb.rpc.return_value.execute.return_value.data = []
    mock_supabase.return_value = mock_sb
    
    from api.recommender import rank_recipes_by_goal
    ranked, nutri_goal = rank_recipes_by_goal('lose weight')
    
    assert len(ranked) == 0


# Test create_meal_plan edge cases
@patch('api.recommender.rank_recipes_by_goal')
def test_create_meal_plan_empty_recipes(mock_rank):
    """Test meal plan with no recipes."""
    mock_rank.return_value = (pd.DataFrame(), 'nutri goal')
    
    from api.recommender import create_meal_plan
    plan, goal = create_meal_plan('lose weight')
    
    assert plan == []
    assert goal == 'nutri goal'


# Test llm_filter_recipes edge cases
@patch('api.recommender.load_groq_client')
def test_llm_filter_recipes_parse_error(mock_groq, sample_recipe_data, sample_user_profile):
    """Test LLM filtering with unparseable response."""
    mock_client = Mock()
    mock_response = Mock()
    mock_response.choices = [Mock(message=Mock(content='Invalid response'))]
    mock_client.chat.completions.create.return_value = mock_response
    mock_groq.return_value = mock_client
    
    filtered = llm_filter_recipes(sample_recipe_data, sample_user_profile)
    assert len(filtered) == len(sample_recipe_data)  # Returns unfiltered


@patch('api.recommender.load_groq_client')
def test_llm_filter_recipes_empty_preferences(mock_groq, sample_recipe_data):
    """Test LLM filtering with empty dietary preferences."""
    profile = {'dietary_preferences': [], 'allergies': []}
    filtered = llm_filter_recipes(sample_recipe_data, profile)
    assert len(filtered) == len(sample_recipe_data)


# Test filter_allergens edge cases
def test_filter_allergens_multiple_allergens(sample_recipe_data):
    """Test filtering with multiple allergens."""
    sample_recipe_data.at[0, 'ingredients'] = ['tofu', 'peanuts', 'soy sauce']
    sample_recipe_data.at[1, 'ingredients'] = ['chicken', 'shellfish', 'curry']
    
    filtered = filter_allergens(sample_recipe_data, ['peanuts', 'shellfish'])
    assert len(filtered) == 2


def test_filter_allergens_case_insensitive(sample_recipe_data):
    """Test allergen filtering is case insensitive."""
    sample_recipe_data.at[0, 'ingredients'] = ['Tofu', 'PEANUTS', 'Soy Sauce']
    
    filtered = filter_allergens(sample_recipe_data, ['peanuts'])
    assert len(filtered) == 3


# Test calculate_pantry_score edge cases
def test_calculate_pantry_score_substring_match():
    """Test pantry score with substring matching."""
    ingredients = ['cherry tomatoes', 'fresh basil']
    pantry = ['tomato', 'basil']
    score = calculate_pantry_score(ingredients, pantry)
    assert score == 1.0


def test_calculate_pantry_score_empty_ingredients():
    """Test pantry score with empty ingredients."""
    ingredients = []
    pantry = ['tomato', 'basil']
    score = calculate_pantry_score(ingredients, pantry)
    assert score == 0.0


# Test score_kitchen_equipment edge cases
def test_score_kitchen_equipment_empty_equipment():
    """Test equipment score with empty equipment list."""
    recipe = {'tags': ['oven-baked']}
    equipment = []
    score = score_kitchen_equipment(recipe, equipment)
    assert score == 0.0


def test_score_kitchen_equipment_no_recipe_tags():
    """Test equipment score when recipe has no tags key."""
    recipe = {}
    equipment = ['oven']
    score = score_kitchen_equipment(recipe, equipment)
    assert score == 0.0


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
