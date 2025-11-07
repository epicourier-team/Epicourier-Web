# backend/tests/test_recommender.py
import sys, os, pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from hypothesis import given, strategies as st, settings, example

# ensure backend is on the import path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from api.index import app
from api.recommender import create_meal_plan
import api.recommender 
@pytest.fixture
def client():
    """Provides a FastAPI test client for all tests."""
    with TestClient(app) as c:
        yield c