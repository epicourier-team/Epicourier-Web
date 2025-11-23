# backend/tests/test_recommender.py
import os
import sys

import pytest
from fastapi.testclient import TestClient
from hypothesis import example, given, settings
from hypothesis import strategies as st

# ensure backend is on the import path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from api.index import app
from api.recommender import create_meal_plan

client = TestClient(app)


# Unit-level tests


def test_create_meal_plan_basic():
    goal = "lose 5 kg"
    n_meals = 3
    meal_plan, expanded_goal = create_meal_plan(goal, n_meals)
    assert isinstance(meal_plan, list)
    assert len(meal_plan) == n_meals
    for meal in meal_plan:
        assert "name" in meal
        assert "tags" in meal
        assert "key_ingredients" in meal
        assert "reason" in meal
        assert "similarity_score" in meal
    assert isinstance(expanded_goal, str)
    assert len(expanded_goal) > 0


# API validation tests (FastAPI layer)


def test_recommender_empty_goal():
    payload = {"goal": "", "numMeals": 3}
    response = client.post("/recommender", json=payload)
    assert response.status_code in [400, 422]

    assert response.status_code in [400, 422]


# Parametrized varied tests


@pytest.mark.parametrize(
    "goal,numMeals",
    [
        ("Lose 5kg", 3),
        ("Gain muscle", 5),
        ("High protein vegan diet", 7),
        ("Low carb plan", 3),
        ("Improve endurance", 5),
        ("Boost energy", 7),
        ("Heart healthy diet", 3),
        ("Balanced macros", 5),
        ("Cut sugar intake", 7),
        ("Increase fiber", 3),
        ("Weight maintenance", 5),
        ("Quick recovery", 7),
        ("Low sodium meals", 3),
        ("Improve focus", 5),
        ("Boost immunity", 7),
    ],
)
def test_recommender_varied(goal, numMeals):
    response = client.post("/recommender", json={"goal": goal, "numMeals": numMeals})
    assert response.status_code == 200
    data = response.json()
    assert "recipes" in data
    assert "goal_expanded" in data
    assert isinstance(data["recipes"], list)
    assert len(data["recipes"]) == numMeals


# Edge and robustness tests


@pytest.mark.parametrize(
    "goal",
    [
        "🔥💪🧘‍♀️",  # emojis
        "12345",  # numeric
        "cut weight safely" * 20,  # very long
    ],
)
def test_recommender_edge_goals(client, goal):
    """Should handle weird or malformed goals gracefully."""
    response = client.post("/recommender", json={"goal": goal, "numMeals": 3})
    # Should either succeed (200) or validate error (422)
    assert response.status_code in [200, 422]


@pytest.mark.parametrize("numMeals", [0, -1, 100])
def test_recommender_invalid_num_meals(client, numMeals):
    """Invalid numMeals should return 422 or safe failure."""
    response = client.post(
        "/recommender", json={"goal": "gain strength", "numMeals": numMeals}
    )
    assert response.status_code in [400, 422]


# Semantic difference tests


def test_recommender_distinct_goals(client):
    """Different goals should lead to different recipe sets."""
    res1 = client.post(
        "/recommender", json={"goal": "gain muscle", "numMeals": 3}
    ).json()
    res2 = client.post("/recommender", json={"goal": "lose fat", "numMeals": 3}).json()

    # Should produce distinct expansions or recipes
    assert (
        res1["goal_expanded"] != res2["goal_expanded"]
        or res1["recipes"] != res2["recipes"]
    )


def test_recommender_goal_expansion_differs(client):
    """Expanded goal text should meaningfully change with input."""
    g1 = "low carb high protein"
    g2 = "high carb endurance training"
    r1 = client.post("/recommender", json={"goal": g1, "numMeals": 3}).json()
    r2 = client.post("/recommender", json={"goal": g2, "numMeals": 3}).json()
    assert r1["goal_expanded"] != r2["goal_expanded"]


# Extra integration-level checks


def test_recommender_structure_of_recipes(client):
    """Each recipe entry should contain expected fields."""
    response = client.post("/recommender", json={"goal": "gain muscle", "numMeals": 3})
    data = response.json()
    for r in data["recipes"]:
        assert isinstance(r, dict)
        assert {
            "meal_number",
            "name",
            "tags",
            "key_ingredients",
            "reason",
            "similarity_score",
            "recipe",
        }.issubset(r.keys())


def test_recommender_similarity_scores_sorted(client):
    """Check if recipes are ranked by descending similarity."""
    response = client.post("/recommender", json={"goal": "high protein", "numMeals": 5})
    data = response.json()
    sims = [r["similarity_score"] for r in data["recipes"]]
    assert sims == sorted(sims, reverse=True)


# Hypothesis property-based tests
goal_strategies = st.one_of(
    st.just("high protein"),
    st.just("low carb"),
    st.just("balanced vegetarian"),
    st.just("gluten free meals"),
    st.just("high fiber"),
    st.text(min_size=5, max_size=60),
)


@settings(max_examples=10, deadline=None)
@given(goal=goal_strategies, numMeals=st.sampled_from([3, 5, 7]))
@example(goal="Lose weight fast", numMeals=3)
@example(goal="Build muscle", numMeals=5)
@example(goal="Vegan high protein", numMeals=7)
@example(goal="Keto diet plan", numMeals=3)
@example(goal="Heart healthy meals", numMeals=5)
@example(goal="Low sugar snacks", numMeals=7)
@example(goal="Mediterranean diet", numMeals=3)
@example(goal="Boost immunity", numMeals=5)
@example(goal="Balanced macro meals", numMeals=7)
@example(goal="Energy for athletes", numMeals=5)
def test_recommender_randomized(goal, numMeals):
    """Property-based randomized test of recommender robustness."""
    with TestClient(app) as client:
        response = client.post(
            "/recommender", json={"goal": goal, "numMeals": numMeals}
        )
        assert response.status_code == 200
        data = response.json()
        assert "recipes" in data
        assert "goal_expanded" in data
        assert isinstance(data["recipes"], list)
        assert len(data["recipes"]) == numMeals

        # Optional semantic sanity check
        expected_terms = ["protein", "carb", "calorie", "fat", "vit"]
        if any(t in goal.lower() for t in expected_terms):
            assert any(t in data["goal_expanded"].lower() for t in expected_terms)
