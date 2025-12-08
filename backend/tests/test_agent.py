
import pytest
from unittest.mock import MagicMock, patch
import json
from api.agent import (
    search_recipes_tool,
    add_to_calendar_tool,
    log_metrics_tool,
    router
)
from fastapi.testclient import TestClient

# Create a test client specifically for the router if needed, 
# or we can rely on the conftest 'client' if it includes the router.
# Let's assume we can use the app from api.index via conftest, 
# but for unit testing tools we just call them directly with mocks.

# ------------------------------------------------------------------------------
# 1. TOOL UNIT TESTS
# ------------------------------------------------------------------------------

@patch("api.agent.rank_recipes_by_goal")
@patch("api.agent.get_public_user_id")
@patch("api.agent.supabase")
def test_search_recipes_tool(mock_supabase, mock_get_uid, mock_rank):
    # Setup Mocks
    mock_get_uid.return_value = "public_uid_123"
    
    # Mock row object for itertuples
    mock_row = MagicMock()
    mock_row.id = 101
    mock_row.name = "Test Recipe"
    mock_row.description = "Tasty"
    mock_row.green_score = 90
    mock_row.calories_kcal = 500
    
    # Mock rank return (dataframe-like itertuples)
    mock_rank.return_value = (MagicMock(), "explanation")
    mock_rank.return_value[0].itertuples.return_value = [mock_row]
    
    # Execute
    results = search_recipes_tool("pasta", user_id="auth_123")
    
    # Verify
    assert len(results) == 1
    assert results[0]["id"] == 101
    assert results[0]["name"] == "Test Recipe"


@patch("api.agent.supabase")
@patch("api.agent.get_public_user_id")
def test_add_to_calendar_tool_success(mock_get_uid, mock_supabase):
    mock_get_uid.return_value = "public_uid_123"
    
    # Mock Recipe Check: Exists
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [{"id": 1}]
    
    # Mock Insert
    mock_insert = mock_supabase.table.return_value.insert
    
    result = add_to_calendar_tool("auth_123", 1, "2025-01-01", "Dinner")
    
    assert "Successfully added" in result
    mock_insert.assert_called()

@patch("api.agent.supabase")
@patch("api.agent.get_public_user_id")
def test_add_to_calendar_tool_not_found(mock_get_uid, mock_supabase):
    mock_get_uid.return_value = "public_uid_123"
    
    # Mock Recipe Check: Does NOT limit
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
    
    result = add_to_calendar_tool("auth_123", 999, "2025-01-01", "Dinner")
    
    assert "not found" in result.lower()

# ------------------------------------------------------------------------------
# 2. CHAT AGENT INTEGRATION TESTS (MOCKING LLM)
# ------------------------------------------------------------------------------

# Helper to mock Groq response structure
def create_mock_groq_response(content=None, tool_calls=None):
    message = MagicMock()
    message.content = content
    message.tool_calls = tool_calls
    
    choice = MagicMock()
    choice.message = message
    
    response = MagicMock()
    response.choices = [choice]
    return response

def create_mock_tool_call(name, args_dict):
    tc = MagicMock()
    tc.id = "call_123"
    tc.function.name = name
    tc.function.arguments = json.dumps(args_dict)
    return tc

@pytest.fixture
def agent_client():
    """Client specifically for the agent router"""
    # We need to include the router in a minimal app for TestClient if conftest app doesn't have it
    # But api.index DOES include it. So we can use the 'client' from conftest ideally.
    # However, for pure unit test isolation of this file, let's create a fresh app.
    from fastapi import FastAPI
    app = FastAPI()
    app.include_router(router)
    return TestClient(app)

@patch("api.agent.client.chat.completions.create") # Mock Groq
@patch("api.agent.save_chat_message") # Mock DB Persistence
@patch("api.agent.search_recipes_tool") # Mock internal tools to verify routing
def test_chat_standard_json_tool_call(mock_search, mock_save, mock_groq, agent_client):
    # Setup: LLM returns a standard tool call
    mock_search.return_value = [{"id": 1, "name": "Pasta"}]
    
    # First response: Tool Call
    tc = create_mock_tool_call("search_recipes", {"query": "pasta"})
    resp1 = create_mock_groq_response(tool_calls=[tc])
    
    # Second response: Final text
    resp2 = create_mock_groq_response(content="Here is a pasta recipe.")
    
    mock_groq.side_effect = [resp1, resp2]
    
    # Request
    payload = {"user_id": "u1", "message": "Find pasta"}
    response = agent_client.post("/agent/chat", json=payload)
    
    # Verify
    assert response.status_code == 200
    data = response.json()
    assert "pasta" in data["response"].lower()
    mock_search.assert_called_with(query="pasta", user_id="u1")
    assert mock_save.call_count == 2 # User msg + Agent msg

@patch("api.agent.client.chat.completions.create")
@patch("api.agent.search_recipes_tool") 
def test_chat_cli_fallback(mock_search, mock_groq, agent_client):
    # Setup: LLM returns text with CLI command
    text_content = "To find that, run: search_recipes --query pasta"
    resp1 = create_mock_groq_response(content=text_content, tool_calls=None)
    
    # Second response (after tool result injection)
    resp2 = create_mock_groq_response(content="Found it.")
    
    mock_groq.side_effect = [resp1, resp2]
    mock_search.return_value = []
    
    payload = {"user_id": "u1", "message": "Find pasta"}
    response = agent_client.post("/agent/chat", json=payload)
    
    assert response.status_code == 200
    mock_search.assert_called_with(query="pasta", user_id="u1")

@patch("api.agent.client.chat.completions.create")
@patch("api.agent.log_metrics_tool") 
def test_chat_arg_inference_fallback(mock_log, mock_groq, agent_client):
    # Setup: LLM returns "lazy" JSON without function name
    text_content = '{ "weight_kg": 70.5 }'
    resp1 = create_mock_groq_response(content=text_content, tool_calls=None)
    
    resp2 = create_mock_groq_response(content="Logged.")
    
    mock_groq.side_effect = [resp1, resp2]
    mock_log.return_value = "Logged"
    
    payload = {"user_id": "u1", "message": "I weigh 70.5"}
    response = agent_client.post("/agent/chat", json=payload)
    
    assert response.status_code == 200
    mock_log.assert_called()
    call_args = mock_log.call_args[1] # kwargs
    assert call_args["weight_kg"] == 70.5

@patch("api.agent.client.chat.completions.create")
@patch("api.agent.add_to_calendar_tool") 
def test_chat_simplified_json_fallback(mock_add, mock_groq, agent_client):
    # Setup: LLM returns simplified JSON format
    text_content = '{"function": "add_to_calendar", "args": {"recipe_id": "1", "date": "2025-01-01", "meal_type": "Dinner"}}'
    resp1 = create_mock_groq_response(content=text_content, tool_calls=None)
    resp2 = create_mock_groq_response(content="Added.")
    
    mock_groq.side_effect = [resp1, resp2]
    mock_add.return_value = "Added"
    
    payload = {"user_id": "u1", "message": "Add it"}
    response = agent_client.post("/agent/chat", json=payload)
    
    assert response.status_code == 200
    mock_add.assert_called()
    # Note: args are passed as strings in the JSON, but our tool might expect int/str mismatch handled in agent.py logic.
    # The 'simplified' JSON parser passes args to the tool logic inside agent.py which handles normalization.
    # But here we mocked `add_to_calendar_tool` directly.
    # Wait, the fallback code parses args and calls `add_to_calendar_tool`.
    # Let's verify arguments.
    call_args = mock_add.call_args[1]
    assert call_args["date"] == "2025-01-01"


# ------------------------------------------------------------------------------
# 3. ADDITIONAL TOOL UNIT TESTS FOR COVERAGE
# ------------------------------------------------------------------------------

@patch("api.agent.supabase")
@patch("api.agent.get_public_user_id")
def test_log_metrics_tool_weight(mock_get_uid, mock_supabase):
    """Test logging weight only."""
    mock_get_uid.return_value = "public_uid_123"
    
    result = log_metrics_tool("auth_123", weight_kg=75.5)
    
    assert "Successfully" in result
    mock_supabase.table.return_value.insert.assert_called()

@patch("api.agent.supabase")
@patch("api.agent.get_public_user_id")
def test_log_metrics_tool_height(mock_get_uid, mock_supabase):
    """Test logging height only."""
    mock_get_uid.return_value = "public_uid_123"
    
    result = log_metrics_tool("auth_123", height_cm=180.0)
    
    assert "Successfully" in result

@patch("api.agent.supabase")
@patch("api.agent.get_public_user_id")
def test_log_metrics_tool_both(mock_get_uid, mock_supabase):
    """Test logging both weight and height."""
    mock_get_uid.return_value = "public_uid_123"
    
    result = log_metrics_tool("auth_123", weight_kg=70.0, height_cm=175.0)
    
    assert "Successfully" in result
    # Verify profile update was called
    mock_supabase.from_.return_value.update.assert_called()

@patch("api.agent.get_public_user_id")
def test_log_metrics_tool_user_not_found(mock_get_uid):
    """Test error when user not found."""
    mock_get_uid.return_value = None
    
    result = log_metrics_tool("invalid_user", weight_kg=70.0)
    
    assert "User not found" in result

@patch("api.agent.get_public_user_id")
def test_add_to_calendar_user_not_found(mock_get_uid):
    """Test error when user not found for calendar."""
    mock_get_uid.return_value = None
    
    result = add_to_calendar_tool("invalid_user", 1, "2025-01-01", "Dinner")
    
    assert "User not found" in result

@patch("api.agent.supabase")
@patch("api.agent.get_public_user_id")
def test_add_to_calendar_tool_exception(mock_get_uid, mock_supabase):
    """Test error handling when DB insert fails."""
    mock_get_uid.return_value = "public_uid_123"
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [{"id": 1}]
    mock_supabase.table.return_value.insert.return_value.execute.side_effect = Exception("DB Error")
    
    result = add_to_calendar_tool("auth_123", 1, "2025-01-01", "Dinner")
    
    assert "Error" in result

@patch("api.agent.rank_recipes_by_goal")
@patch("api.agent.get_public_user_id")
@patch("api.agent.supabase")
def test_search_recipes_tool_exception(mock_supabase, mock_get_uid, mock_rank):
    """Test error handling when search fails."""
    mock_get_uid.return_value = "public_uid_123"
    mock_rank.side_effect = Exception("Search Error")
    
    results = search_recipes_tool("pasta", user_id="auth_123")
    
    assert results == []

@patch("api.agent.rank_recipes_by_goal")
@patch("api.agent.get_public_user_id")
@patch("api.agent.supabase")
def test_search_recipes_tool_with_profile(mock_supabase, mock_get_uid, mock_rank):
    """Test search with user profile loading."""
    mock_get_uid.return_value = "public_uid_123"
    
    # Mock profile fetch
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
        "allergies": ["peanuts"],
        "dietary_preferences": ["vegetarian"]
    }
    
    mock_row = MagicMock()
    mock_row.id = 102
    mock_row.name = "Veggie Pasta"
    mock_row.description = "Delicious"
    mock_row.green_score = 85
    mock_row.calories_kcal = 400
    
    mock_rank.return_value = (MagicMock(), "explanation")
    mock_rank.return_value[0].itertuples.return_value = [mock_row]
    
    results = search_recipes_tool("pasta", user_id="auth_123")
    
    assert len(results) == 1
    # Verify rank was called with user_profile
    call_kwargs = mock_rank.call_args[1]
    assert call_kwargs.get("user_profile") is not None

# ------------------------------------------------------------------------------
# 4. GET HISTORY ENDPOINT TEST
# ------------------------------------------------------------------------------

@patch("api.agent.supabase")
def test_get_chat_history(mock_supabase, agent_client):
    """Test retrieving chat history."""
    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value.data = [
        {"role": "user", "content": "Hello", "tool_calls": None},
        {"role": "agent", "content": "Hi there!", "tool_calls": None}
    ]
    
    response = agent_client.get("/agent/history?user_id=test_user")
    
    assert response.status_code == 200
    data = response.json()
    assert len(data["history"]) == 2
    assert data["history"][0]["role"] == "user"

@patch("api.agent.supabase")
def test_get_chat_history_with_tool_calls(mock_supabase, agent_client):
    """Test history with tool calls JSON."""
    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value.data = [
        {"role": "agent", "content": "Found recipes", "tool_calls": '[{"name": "search_recipes"}]'}
    ]
    
    response = agent_client.get("/agent/history?user_id=test_user")
    
    assert response.status_code == 200
    data = response.json()
    assert data["history"][0]["tool_calls"] == [{"name": "search_recipes"}]

@patch("api.agent.supabase")
def test_get_chat_history_error(mock_supabase, agent_client):
    """Test history endpoint error handling."""
    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.side_effect = Exception("DB Error")
    
    response = agent_client.get("/agent/history?user_id=test_user")
    
    assert response.status_code == 200
    data = response.json()
    assert data["history"] == []

# ------------------------------------------------------------------------------
# 5. SAVE CHAT MESSAGE TEST
# ------------------------------------------------------------------------------

@patch("api.agent.supabase")
def test_save_chat_message(mock_supabase):
    """Test saving chat message."""
    from api.agent import save_chat_message
    
    # Should not raise
    save_chat_message("user_123", "user", "Hello")

@patch("api.agent.supabase")
def test_save_chat_message_with_tools(mock_supabase):
    """Test saving chat message with tool calls."""
    from api.agent import save_chat_message
    
    tool_calls = [{"name": "search_recipes", "result": "Found 5"}]
    save_chat_message("user_123", "agent", "Here are recipes", tool_calls=tool_calls)

@patch("api.agent.supabase")
def test_save_chat_message_error(mock_supabase, capsys):
    """Test save message error handling."""
    from api.agent import save_chat_message
    
    mock_supabase.table.return_value.insert.return_value.execute.side_effect = Exception("Insert failed")
    
    # Should not raise, just print error
    save_chat_message("user_123", "user", "Hello")
    
    captured = capsys.readouterr()
    assert "Error saving history" in captured.out

# ------------------------------------------------------------------------------
# 6. TEXT-BASED TOOL CALL FALLBACK TEST
# ------------------------------------------------------------------------------

@patch("api.agent.client.chat.completions.create")
@patch("api.agent.search_recipes_tool")
def test_chat_text_based_tool_call(mock_search, mock_groq, agent_client):
    """Test text-based function call like search_recipes({...})."""
    text_content = 'search_recipes({"query": "chicken"})'
    resp1 = create_mock_groq_response(content=text_content, tool_calls=None)
    resp2 = create_mock_groq_response(content="Found chicken recipes.")
    
    mock_groq.side_effect = [resp1, resp2]
    mock_search.return_value = [{"id": 1, "name": "Chicken Curry"}]
    
    payload = {"user_id": "u1", "message": "Find chicken"}
    response = agent_client.post("/agent/chat", json=payload)
    
    assert response.status_code == 200
    mock_search.assert_called()

@patch("api.agent.client.chat.completions.create")
def test_chat_plain_text_response(mock_groq, agent_client):
    """Test when LLM returns plain text without any tool call."""
    resp1 = create_mock_groq_response(content="I can help you find recipes!", tool_calls=None)
    
    mock_groq.return_value = resp1
    
    payload = {"user_id": "u1", "message": "Hello"}
    response = agent_client.post("/agent/chat", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert "help" in data["response"].lower()

# ------------------------------------------------------------------------------
# 7. EDGE CASES
# ------------------------------------------------------------------------------

@patch("api.agent.client.chat.completions.create")
@patch("api.agent.add_to_calendar_tool")
def test_chat_direct_json_name_parameters(mock_add, mock_groq, agent_client):
    """Test direct JSON with name/parameters format."""
    text_content = '{"name": "add_to_calendar", "parameters": {"recipe_id": 5, "date": "2025-02-01", "meal_type": "Lunch"}}'
    resp1 = create_mock_groq_response(content=text_content, tool_calls=None)
    resp2 = create_mock_groq_response(content="Added to calendar.")
    
    mock_groq.side_effect = [resp1, resp2]
    mock_add.return_value = "Added"
    
    payload = {"user_id": "u1", "message": "Add to lunch"}
    response = agent_client.post("/agent/chat", json=payload)
    
    assert response.status_code == 200
    mock_add.assert_called()

# ------------------------------------------------------------------------------
# 8. HISTORY PROCESSING TESTS (Lines 279-289)
# ------------------------------------------------------------------------------

@patch("api.agent.client.chat.completions.create")
def test_chat_with_history_parts(mock_groq, agent_client):
    """Test history processing with 'parts' format from frontend."""
    resp1 = create_mock_groq_response(content="I remember you asked about pasta!", tool_calls=None)
    mock_groq.return_value = resp1
    
    payload = {
        "user_id": "u1",
        "message": "What did I ask earlier?",
        "history": [
            {"role": "user", "parts": ["Find me pasta recipes"]},
            {"role": "model", "parts": ["Here are some pasta recipes..."]}
        ]
    }
    response = agent_client.post("/agent/chat", json=payload)
    
    assert response.status_code == 200

@patch("api.agent.client.chat.completions.create")
def test_chat_with_history_content(mock_groq, agent_client):
    """Test history processing with 'content' format."""
    resp1 = create_mock_groq_response(content="Got it!", tool_calls=None)
    mock_groq.return_value = resp1
    
    payload = {
        "user_id": "u1",
        "message": "Thanks!",
        "history": [
            {"role": "user", "content": "Hello"},
            {"role": "agent", "content": "Hi there!"}
        ]
    }
    response = agent_client.post("/agent/chat", json=payload)
    
    assert response.status_code == 200

# ------------------------------------------------------------------------------
# 9. RECIPE NAME-TO-ID RESOLUTION (Lines 332-367)
# ------------------------------------------------------------------------------

@patch("api.agent.client.chat.completions.create")
@patch("api.agent.supabase")
def test_chat_add_to_calendar_name_resolution(mock_supabase, mock_groq, agent_client):
    """Test recipe name-to-ID resolution in add_to_calendar."""
    # LLM returns tool call with recipe name instead of ID
    tc = create_mock_tool_call("add_to_calendar", {
        "recipe_id": "Chicken Curry",  # Name instead of ID
        "date": "2025-01-15",
        "meal_type": "Dinner"
    })
    resp1 = create_mock_groq_response(tool_calls=[tc])
    resp2 = create_mock_groq_response(content="Added Chicken Curry to your calendar.")
    
    mock_groq.side_effect = [resp1, resp2]
    
    # Mock recipe lookup
    mock_supabase.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value.data = [{"id": 42}]
    # Mock calendar insert
    mock_supabase.table.return_value.insert.return_value.execute.return_value = MagicMock()
    
    payload = {"user_id": "u1", "message": "Add Chicken Curry to dinner"}
    response = agent_client.post("/agent/chat", json=payload)
    
    assert response.status_code == 200

@patch("api.agent.client.chat.completions.create")
@patch("api.agent.supabase")
def test_chat_add_to_calendar_name_not_found(mock_supabase, mock_groq, agent_client):
    """Test when recipe name cannot be resolved."""
    tc = create_mock_tool_call("add_to_calendar", {
        "recipe_id": "NonexistentRecipe",
        "date": "2025-01-15",
        "meal_type": "Dinner"
    })
    resp1 = create_mock_groq_response(tool_calls=[tc])
    resp2 = create_mock_groq_response(content="Sorry, I couldn't find that recipe.")
    
    mock_groq.side_effect = [resp1, resp2]
    
    # Mock recipe lookup - not found
    mock_supabase.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value.data = []
    mock_supabase.table.return_value.select.return_value.ilike.return_value.limit.return_value.execute.return_value.data = []
    
    payload = {"user_id": "u1", "message": "Add NonexistentRecipe"}
    response = agent_client.post("/agent/chat", json=payload)
    
    assert response.status_code == 200

@patch("api.agent.client.chat.completions.create")
@patch("api.agent.supabase")
def test_chat_add_to_calendar_partial_match(mock_supabase, mock_groq, agent_client):
    """Test partial name match using ilike."""
    tc = create_mock_tool_call("add_to_calendar", {
        "recipe_id": "Chicken",  # Partial name
        "date": "2025-01-15",
        "meal_type": "Lunch"
    })
    resp1 = create_mock_groq_response(tool_calls=[tc])
    resp2 = create_mock_groq_response(content="Added to calendar.")
    
    mock_groq.side_effect = [resp1, resp2]
    
    # Mock exact match fails, partial match succeeds
    mock_supabase.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value.data = []
    mock_supabase.table.return_value.select.return_value.ilike.return_value.limit.return_value.execute.return_value.data = [{"id": 55}]
    mock_supabase.table.return_value.insert.return_value.execute.return_value = MagicMock()
    
    payload = {"user_id": "u1", "message": "Add Chicken to lunch"}
    response = agent_client.post("/agent/chat", json=payload)
    
    assert response.status_code == 200

# ------------------------------------------------------------------------------
# 10. TOOL ARGS PARSING ERROR (Lines 323-325)
# ------------------------------------------------------------------------------

@patch("api.agent.client.chat.completions.create")
@patch("api.agent.search_recipes_tool")
def test_chat_malformed_tool_args(mock_search, mock_groq, agent_client):
    """Test handling of malformed JSON in tool arguments."""
    # Create tool call with invalid JSON
    tc = MagicMock()
    tc.id = "call_bad"
    tc.function.name = "search_recipes"
    tc.function.arguments = "{invalid json}"  # Bad JSON
    
    resp1 = create_mock_groq_response(tool_calls=[tc])
    resp2 = create_mock_groq_response(content="Found some recipes.")
    
    mock_groq.side_effect = [resp1, resp2]
    mock_search.return_value = []
    
    payload = {"user_id": "u1", "message": "Find food"}
    response = agent_client.post("/agent/chat", json=payload)
    
    assert response.status_code == 200

# ------------------------------------------------------------------------------
# 11. LOG METRICS VIA TOOL CALL PATH (Lines 366-371)
# ------------------------------------------------------------------------------

@patch("api.agent.client.chat.completions.create")
@patch("api.agent.log_metrics_tool")
def test_chat_log_metrics_tool_call(mock_log, mock_groq, agent_client):
    """Test log_metrics via standard tool call path."""
    tc = create_mock_tool_call("log_metrics", {"weight_kg": 68.5, "height_cm": 175})
    resp1 = create_mock_groq_response(tool_calls=[tc])
    resp2 = create_mock_groq_response(content="Logged your metrics.")
    
    mock_groq.side_effect = [resp1, resp2]
    mock_log.return_value = "Successfully logged metrics."
    
    payload = {"user_id": "u1", "message": "Log my weight 68.5kg and height 175cm"}
    response = agent_client.post("/agent/chat", json=payload)
    
    assert response.status_code == 200
    mock_log.assert_called_with(user_id="u1", weight_kg=68.5, height_cm=175)

# ------------------------------------------------------------------------------
# 12. PROFILE FETCH ERROR (Lines 47-48)
# ------------------------------------------------------------------------------

@patch("api.agent.rank_recipes_by_goal")
@patch("api.agent.get_public_user_id")
@patch("api.agent.supabase")
def test_search_recipes_profile_fetch_error(mock_supabase, mock_get_uid, mock_rank, capsys):
    """Test handling when profile fetch throws exception."""
    mock_get_uid.return_value = "public_uid_123"
    
    # Profile fetch throws exception
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.side_effect = Exception("Profile error")
    
    mock_row = MagicMock()
    mock_row.id = 103
    mock_row.name = "Test"
    mock_row.description = "Desc"
    mock_row.green_score = 80
    mock_row.calories_kcal = 300
    
    mock_rank.return_value = (MagicMock(), "explanation")
    mock_rank.return_value[0].itertuples.return_value = [mock_row]
    
    results = search_recipes_tool("pasta", user_id="auth_123")
    
    assert len(results) == 1
    captured = capsys.readouterr()
    assert "Error fetching profile" in captured.out

# ------------------------------------------------------------------------------
# 13. LOG METRICS DB ERROR (Lines 123-124)
# ------------------------------------------------------------------------------

@patch("api.agent.supabase")
@patch("api.agent.get_public_user_id")
def test_log_metrics_tool_db_error(mock_get_uid, mock_supabase):
    """Test log_metrics when DB insert fails."""
    mock_get_uid.return_value = "public_uid_123"
    mock_supabase.table.return_value.insert.return_value.execute.side_effect = Exception("DB insert failed")
    
    result = log_metrics_tool("auth_123", weight_kg=70.0)
    
    assert "Error" in result

# ------------------------------------------------------------------------------
# 14. CHAT ENDPOINT EXCEPTION (Lines 549-552)
# ------------------------------------------------------------------------------

@patch("api.agent.client.chat.completions.create")
def test_chat_groq_exception(mock_groq, agent_client):
    """Test handling when Groq API throws exception."""
    mock_groq.side_effect = Exception("API rate limit exceeded")
    
    payload = {"user_id": "u1", "message": "Hello"}
    response = agent_client.post("/agent/chat", json=payload)
    
    assert response.status_code == 500

# ------------------------------------------------------------------------------
# 15. TEXT FALLBACK UNKNOWN TOOL (Lines 536-537)
# ------------------------------------------------------------------------------

@patch("api.agent.client.chat.completions.create")
def test_chat_text_fallback_unknown_tool(mock_groq, agent_client):
    """Test text fallback with unknown tool name."""
    text_content = 'unknown_tool({"param": "value"})'
    resp1 = create_mock_groq_response(content=text_content, tool_calls=None)
    
    mock_groq.return_value = resp1
    
    payload = {"user_id": "u1", "message": "Do something"}
    response = agent_client.post("/agent/chat", json=payload)
    
    assert response.status_code == 200
    # Should return the raw text since tool is unknown
    data = response.json()
    assert "unknown_tool" in data["response"]

