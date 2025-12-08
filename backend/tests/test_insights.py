# backend/tests/test_insights.py
import sys, os, pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, Mock
from datetime import datetime, timedelta
import json

# ensure backend is on the import path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from api.index import app
import api.insights

client = TestClient(app)

# ============================================================================
# UNIT TESTS - Helper Functions
# ============================================================================

def test_get_public_user_id_success():
    """Test successful resolution of auth UUID to public user ID"""
    mock_response = MagicMock()
    mock_response.data = {'id': 123}
    
    with patch('api.insights.supabase.table') as mock_table:
        mock_table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = mock_response
        
        result = api.insights.get_public_user_id("test-uuid")
        assert result == 123


def test_get_public_user_id_not_found():
    """Test when user is not found"""
    mock_response = MagicMock()
    mock_response.data = None
    
    with patch('api.insights.supabase.table') as mock_table:
        mock_table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = mock_response
        
        result = api.insights.get_public_user_id("invalid-uuid")
        assert result is None


def test_get_public_user_id_exception():
    """Test exception handling in get_public_user_id"""
    with patch('api.insights.supabase.table') as mock_table:
        mock_table.return_value.select.return_value.eq.side_effect = Exception("DB Error")
        
        result = api.insights.get_public_user_id("test-uuid")
        assert result is None


# ============================================================================
# API TESTS - POST /metrics
# ============================================================================

def test_log_metrics_success():
    """Test successful metrics logging"""
    with patch('api.insights.get_public_user_id', return_value=123):
        with patch('api.insights.supabase.table') as mock_table:
            # Mock the insert response
            mock_insert_response = MagicMock()
            mock_insert_response.data = [{"id": 1, "weight_kg": 75.5}]
            mock_table.return_value.insert.return_value.execute.return_value = mock_insert_response
            
            # Mock the update response
            mock_table.return_value.from_.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock()
            
            payload = {
                "user_id": "test-uuid",
                "weight_kg": 75.5,
                "height_cm": 175.0
            }
            response = client.post("/insights/metrics", json=payload)
            
            assert response.status_code == 200
            data = response.json()
            assert "message" in data
            assert "Metrics logged successfully" in data["message"]


def test_log_metrics_user_not_found():
    """Test metrics logging when user doesn't exist"""
    with patch('api.insights.get_public_user_id', return_value=None):
        payload = {
            "user_id": "invalid-uuid",
            "weight_kg": 75.5
        }
        response = client.post("/insights/metrics", json=payload)
        
        assert response.status_code == 404
        assert "User profile not found" in response.json()["detail"]


def test_log_metrics_partial_data():
    """Test logging only weight without height"""
    with patch('api.insights.get_public_user_id', return_value=123):
        with patch('api.insights.supabase.table') as mock_table:
            mock_insert_response = MagicMock()
            mock_insert_response.data = [{"id": 1}]
            mock_table.return_value.insert.return_value.execute.return_value = mock_insert_response
            mock_table.return_value.from_.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock()
            
            payload = {
                "user_id": "test-uuid",
                "weight_kg": 75.5
            }
            response = client.post("/insights/metrics", json=payload)
            
            assert response.status_code == 200


# ============================================================================
# API TESTS - GET /stats
# ============================================================================

def test_get_stats_success():
    """Test successful stats retrieval with data"""
    with patch('api.insights.get_public_user_id', return_value=123):
        with patch('api.insights.supabase.table') as mock_table:
            # Mock calendar data
            mock_calendar = MagicMock()
            mock_calendar.data = [
                {
                    "id": 1,
                    "date": "2025-01-01",
                    "status": True,
                    "meal_type": "breakfast",
                    "Recipe": {"green_score": 8, "name": "Oatmeal"}
                },
                {
                    "id": 2,
                    "date": "2025-01-02",
                    "status": True,
                    "meal_type": "lunch",
                    "Recipe": {"green_score": 7, "name": "Salad"}
                }
            ]
            
            # Mock weight data
            mock_weight = MagicMock()
            mock_weight.data = [
                {"weight_kg": 75.0, "recorded_at": "2025-01-01T10:00:00"},
                {"weight_kg": 74.5, "recorded_at": "2025-01-05T10:00:00"}
            ]
            
            def mock_table_side_effect(table_name):
                if table_name == "Calendar":
                    chain = MagicMock()
                    chain.select.return_value.eq.return_value.gte.return_value.order.return_value.execute.return_value = mock_calendar
                    return chain
                elif table_name == "UserMetricsHistory":
                    chain = MagicMock()
                    chain.select.return_value.eq.return_value.gte.return_value.order.return_value.execute.return_value = mock_weight
                    return chain
            
            mock_table.side_effect = mock_table_side_effect
            
            response = client.get("/insights/stats?user_id=test-uuid&period=30d")
            
            assert response.status_code == 200
            data = response.json()
            assert "completion_rate" in data
            assert "total_meals" in data
            assert "avg_green_score" in data
            assert "weight_trend" in data
            assert data["total_meals"] == 2
            assert data["completed_meals"] == 2


def test_get_stats_empty_data():
    """Test stats retrieval when user has no data"""
    with patch('api.insights.get_public_user_id', return_value=123):
        with patch('api.insights.supabase.table') as mock_table:
            mock_empty = MagicMock()
            mock_empty.data = []
            
            chain = MagicMock()
            chain.select.return_value.eq.return_value.gte.return_value.order.return_value.execute.return_value = mock_empty
            mock_table.return_value = chain
            
            response = client.get("/insights/stats?user_id=test-uuid&period=7d")
            
            assert response.status_code == 200
            data = response.json()
            assert data["total_meals"] == 0
            assert data["completion_rate"] == 0
            assert len(data["weight_trend"]) == 0


def test_get_stats_user_not_found():
    """Test stats when user doesn't exist - should return empty stats"""
    with patch('api.insights.get_public_user_id', return_value=None):
        response = client.get("/insights/stats?user_id=invalid-uuid&period=30d")
        
        assert response.status_code == 200
        data = response.json()
        assert data["total_meals"] == 0
        assert data["completion_rate"] == 0


@pytest.mark.parametrize("period", ["7d", "30d", "90d"])
def test_get_stats_different_periods(period):
    """Test stats retrieval with different time periods"""
    with patch('api.insights.get_public_user_id', return_value=123):
        with patch('api.insights.supabase.table') as mock_table:
            mock_empty = MagicMock()
            mock_empty.data = []
            chain = MagicMock()
            chain.select.return_value.eq.return_value.gte.return_value.order.return_value.execute.return_value = mock_empty
            mock_table.return_value = chain
            
            response = client.get(f"/insights/stats?user_id=test-uuid&period={period}")
            assert response.status_code == 200


# ============================================================================
# API TESTS - GET /ai-analysis
# ============================================================================

def test_ai_analysis_success():
    """Test successful AI analysis generation"""
    with patch('api.insights.get_public_user_id', return_value=123):
        with patch('api.insights.supabase.table') as mock_table:
            # Mock profile data
            mock_profile = MagicMock()
            mock_profile.data = {
                "goals": "Lose 5kg",
                "age": 30,
                "weight_kg": 75.0,
                "height_cm": 175.0,
                "dietary_preferences": ["vegetarian"],
                "allergies": []
            }
            
            # Mock stats
            mock_calendar = MagicMock()
            mock_calendar.data = []
            mock_weight = MagicMock()
            mock_weight.data = []
            
            def table_side_effect(table_name):
                if table_name == "User":
                    chain = MagicMock()
                    chain.select.return_value.eq.return_value.single.return_value.execute.return_value = mock_profile
                    return chain
                else:
                    chain = MagicMock()
                    chain.select.return_value.eq.return_value.gte.return_value.order.return_value.execute.return_value = mock_calendar
                    return chain
            
            mock_table.side_effect = table_side_effect
            
            # Mock Gemini response
            mock_gemini_response = MagicMock()
            mock_gemini_response.text = json.dumps({
                "summary": "Great progress!",
                "recommendations": ["Eat more protein", "Exercise daily", "Sleep 8 hours"],
                "achievements": ["Lost 1kg", "Completed 90% meals"],
                "areas_for_improvement": ["Increase water intake"]
            })
            
            with patch('api.insights.gemini_client.models.generate_content', return_value=mock_gemini_response):
                response = client.get("/insights/ai-analysis?user_id=test-uuid&period=30d")
                
                assert response.status_code == 200
                data = response.json()
                assert "summary" in data
                assert "recommendations" in data
                assert "achievements" in data
                assert "areas_for_improvement" in data
                assert len(data["recommendations"]) == 3


def test_ai_analysis_fallback_on_error():
    """Test AI analysis returns fallback when Gemini fails"""
    with patch('api.insights.get_public_user_id', return_value=123):
        with patch('api.insights.supabase.table') as mock_table:
            mock_profile = MagicMock()
            mock_profile.data = {"goals": "Test"}
            
            chain = MagicMock()
            chain.select.return_value.eq.return_value.single.return_value.execute.return_value = mock_profile
            mock_table.return_value = chain
            
            with patch('api.insights.gemini_client.models.generate_content', side_effect=Exception("API Error")):
                response = client.get("/insights/ai-analysis?user_id=test-uuid&period=30d")
                
                assert response.status_code == 200
                data = response.json()
                assert "Keep making progress" in data["summary"]
                assert len(data["recommendations"]) > 0


def test_ai_analysis_user_not_found():
    """Test AI analysis when user doesn't exist"""
    with patch('api.insights.get_public_user_id', return_value=None):
        response = client.get("/insights/ai-analysis?user_id=invalid-uuid&period=30d")
        
        assert response.status_code == 404
        assert "User profile not found" in response.json()["detail"]


# ============================================================================
# INTEGRATION TESTS
# ============================================================================

def test_full_metrics_flow():
    """Test the complete flow: log metrics -> retrieve stats"""
    with patch('api.insights.get_public_user_id', return_value=123):
        with patch('api.insights.supabase.table') as mock_table:
            # Mock insert
            mock_insert_response = MagicMock()
            mock_insert_response.data = [{"id": 1}]
            mock_table.return_value.insert.return_value.execute.return_value = mock_insert_response
            mock_table.return_value.from_.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock()
            
            # Log metrics
            payload = {"user_id": "test-uuid", "weight_kg": 75.5}
            response = client.post("/insights/metrics", json=payload)
            assert response.status_code == 200
            
            # Then retrieve stats
            mock_weight = MagicMock()
            mock_weight.data = [{"weight_kg": 75.5, "recorded_at": "2025-01-01T10:00:00"}]
            chain = MagicMock()
            chain.select.return_value.eq.return_value.gte.return_value.order.return_value.execute.return_value = mock_weight
            mock_table.return_value = chain
            
            response = client.get("/insights/stats?user_id=test-uuid&period=7d")
            assert response.status_code == 200
