# backend/tests/test_recommender.py
import os
import sys

import pytest
from fastapi.testclient import TestClient

# ensure backend is on the import path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from api.index import app


@pytest.fixture
def client():
    """Provides a FastAPI test client for all tests."""
    with TestClient(app) as c:
        yield c
