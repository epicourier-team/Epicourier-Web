import os
import json
from datetime import datetime
from typing import List, Optional, Dict, Any

from dotenv import load_dotenv
load_dotenv()

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client
from groq import Groq

# Reuse existing logic
from api.recommender import rank_recipes_by_goal
from api.insights import get_public_user_id

# Initialize Supabase client
url: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

# Initialize Groq client
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

router = APIRouter(prefix="/agent", tags=["agent"])

# ------------------------------------------------------------------------------
# 1. Tool Definitions (Logic)
# ------------------------------------------------------------------------------

def search_recipes_tool(query: str, user_id: str = None, n_results: int = 5) -> List[Dict[str, Any]]:
    """Searches for recipes based on a natural language query/goal."""
    print(f"[Agent] Searching recipes for: {query} (User: {user_id})")
    
    user_profile = None
    if user_id:
        public_id = get_public_user_id(user_id)
        if public_id:
            try:
                # Fetch full profile for filtering
                res = supabase.table("User").select("allergies, dietary_preferences").eq("id", public_id).single().execute()
                if res.data:
                    user_profile = res.data
                    print(f"[Agent] Loaded profile: {user_profile}")
            except Exception as e:
                print(f"[Agent] Error fetching profile: {e}")

    try:
        ranked, _ = rank_recipes_by_goal(query, user_profile=user_profile, top_k=n_results)
        
        results = []
        for i, row in enumerate(ranked.itertuples(), 1):
            results.append({
                "id": int(row.id),
                "name": row.name,
                "description": row.description,
                "green_score": row.green_score,
                "calories": row.calories_kcal if hasattr(row, 'calories_kcal') else "N/A"
            })
        return results
    except Exception as e:
        print(f"Error searching recipes: {e}")
        return []

def add_to_calendar_tool(user_id: str, recipe_id: int, date: str, meal_type: str) -> str:
    """Adds a recipe to the user's calendar."""
    print(f"[Agent] Adding recipe {recipe_id} to calendar for {user_id} on {date} ({meal_type})")
    
    public_id = get_public_user_id(user_id)
    if not public_id:
        return "Error: User not found."

    try:
        # Check if recipe exists
        recipe_check = supabase.table("Recipe").select("id").eq("id", recipe_id).execute()
        if not recipe_check.data:
            return f"Error: Recipe with ID {recipe_id} not found."

        data = {
            "user_id": public_id,
            "recipe_id": recipe_id,
            "date": date,
            "meal_type": meal_type.lower(),
            "status": False # Not completed yet
        }
        supabase.table("Calendar").insert(data).execute()
        return f"Successfully added recipe {recipe_id} to {date} for {meal_type}."
    except Exception as e:
        print(f"Error adding to calendar: {e}")
        return f"Error adding to calendar: {str(e)}"

def log_metrics_tool(user_id: str, weight_kg: Optional[float] = None, height_cm: Optional[float] = None) -> str:
    """Logs user weight or height."""
    print(f"[Agent] Logging metrics for {user_id}: W={weight_kg}, H={height_cm}")
    
    public_id = get_public_user_id(user_id)
    if not public_id:
        return "Error: User not found."

    try:
        data = {
            "user_id": public_id,
            "recorded_at": datetime.now().isoformat()
        }
        if weight_kg is not None:
            data["weight_kg"] = weight_kg
        if height_cm is not None:
            data["height_cm"] = height_cm
            
        supabase.table("UserMetricsHistory").insert(data).execute()
        
        # Update profile
        profile_update = {}
        if weight_kg: profile_update["weight_kg"] = weight_kg
        if height_cm: profile_update["height_cm"] = height_cm
        
        if profile_update:
            supabase.from_("User").update(profile_update).eq("id", public_id).execute()
            
        return "Successfully logged metrics."
    except Exception as e:
        return f"Error logging metrics: {str(e)}"

# ------------------------------------------------------------------------------
# 2. Tool Configuration for Groq / OpenAI
# ------------------------------------------------------------------------------

tools = [
    {
        "type": "function",
        "function": {
            "name": "search_recipes",
            "description": "Search for recipes based on dietary goals or cravings.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The user's food goal or craving (e.g., 'high protein pasta')"
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "add_to_calendar",
            "description": "Add a specific recipe to the user's meal calendar.",
            "parameters": {
                "type": "object",
                "properties": {
                    "recipe_id": {
                        "type": "string",
                        "description": "The ID of the recipe to add"
                    },
                    "date": {
                        "type": "string",
                        "description": "Date in YYYY-MM-DD format"
                    },
                    "meal_type": {
                        "type": "string",
                        "description": "Meal type: 'Breakfast', 'Lunch', 'Dinner', or 'Snack'"
                    }
                },
                "required": ["recipe_id", "date", "meal_type"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "log_metrics",
            "description": "Log the user's current weight or height.",
            "parameters": {
                "type": "object",
                "properties": {
                    "weight_kg": {
                        "type": "number",
                        "description": "Weight in kg (optional)"
                    },
                    "height_cm": {
                        "type": "number",
                        "description": "Height in cm (optional)"
                    }
                }
            }
        }
    }
]

# ------------------------------------------------------------------------------
# 3. Chat Endpoint
# ------------------------------------------------------------------------------

class ChatRequest(BaseModel):
    user_id: str
    message: str
    history: List[Dict[str, Any]] = [] # Optional previous context

class ChatResponse(BaseModel):
    response: str
    tool_calls: List[Dict[str, Any]] = []


# ------------------------------------------------------------------------------
# 4. Chat History Persistence
# ------------------------------------------------------------------------------
def save_chat_message(user_id: str, role: str, content: str, tool_calls: Optional[List] = None):
    """Saves a chat message to Supabase."""
    print(f"[Agent] Saving message for {user_id} ({role})")
    try:
        # We need the AUTH ID (UUID) for the foreign key, not just the string passed from frontend (which might be the auth id)
        # But `req.user_id` from frontend IS the auth.uid().
        
        data = {
            "user_id": user_id,
            "role": role,
            "content": content,
            "tool_calls": json.dumps(tool_calls) if tool_calls else None
        }
        supabase.table("ChatHistory").insert(data).execute()
    except Exception as e:
        print(f"[Agent] Error saving history: {e}")

@router.get("/history")
async def get_chat_history(user_id: str):
    """Retrieves chat history for a user."""
    try:
        res = supabase.table("ChatHistory").select("*").eq("user_id", user_id).order("created_at", desc=False).execute()
        
        # Transform for frontend
        messages = []
        for row in res.data:
            msg = {
                "role": row["role"],
                "content": row["content"] or "",
                "tool_calls": json.loads(row["tool_calls"]) if row["tool_calls"] else None
            }
            messages.append(msg)
            
        return {"history": messages}
    except Exception as e:
        print(f"[Agent] Error fetching history: {e}")
        return {"history": []}

@router.post("/chat", response_model=ChatResponse)
async def chat_agent(req: ChatRequest):
    """
    Agent chat endpoint using Groq (Llama 3).
    """
    
    system_instruction = """
    You are an intelligent culinary assistant for the Epicourier app.
    You can help users find recipes, plan their meals (add to calendar), and track their health.
    
    - Users may view recipes, add them to a calendar, or log health metrics.
    - If a user wants to add a meal to their plan, ensure you have the date and meal type.
    - When adding a recipe, use the ID found in the search results context.
    - **IMPORTANT**: Do NOT use XML tags like <function>. Just call the tool directly using the provided tool definitions.
    - **CRITICAL**: Do NOT narrate your actions (e.g., "I will search for that", "Let me check"). call the tool IMMEDIATELY and SILENTLY. Only speak to the user using the information returned by the tool.
    - Be concise, friendly, and helpful.
    """

    try:
        # Build messages list for Groq
        messages = [
            {"role": "system", "content": system_instruction}
        ]
        
        # Add history
        for msg in req.history:
            # Map roles: frontend "agent" -> "assistant"
            # Note: simplified mapping. 'parts' handling from frontend.
            
            role = "assistant" if msg.get("role") in ["agent", "model"] else "user"
            
            # Extract content from 'parts' list or 'content' string
            # Frontend sends: parts: [text + tool_context]
            text_content = ""
            if "parts" in msg and isinstance(msg["parts"], list) and len(msg["parts"]) > 0:
                text_content = msg["parts"][0]
            elif "content" in msg:
                 text_content = msg["content"]
            
            messages.append({"role": role, "content": text_content})
            
        # Add current user message
        messages.append({"role": "user", "content": req.message})

        # SAVE USER MESSAGE
        save_chat_message(req.user_id, "user", req.message)

        print(f"DEBUG: Sending messages to Groq: {json.dumps(messages, default=str)}")
        
        # 1. First Call: Get intent / tool calls
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            tools=tools,
            tool_choice="auto",
            max_tokens=1024
        )
        
        response_message = response.choices[0].message
        tool_calls = response_message.tool_calls
        
        final_text = ""
        tool_results_list = [] # For return to frontend

        if tool_calls:
            # Append the assistant's message with tool calls to conversation
            messages.append(response_message)
            
            for tool_call in tool_calls:
                func_name = tool_call.function.name
                # Parse args robustly (some models output weird JSON)
                try:
                    args = json.loads(tool_call.function.arguments)
                except:
                    print(f"Error parsing tool args: {tool_call.function.arguments}")
                    args = {}

                # Execute Tool
                result = None
                if func_name == "search_recipes":
                    result = search_recipes_tool(query=args.get("query"), user_id=req.user_id)
                
                elif func_name == "add_to_calendar":
                        # Handle case where model passes name instead of ID
                        r_id_val = args.get("recipe_id")
                        final_recipe_id = None
                        
                        # Try interpreting as int
                        try:
                            final_recipe_id = int(r_id_val)
                        except (ValueError, TypeError):
                            # It's likely a name string
                            print(f"[Agent] Model provided name '{r_id_val}' instead of ID. Looking up...")
                            try:
                                # Try exact match first
                                res = supabase.table("Recipe").select("id").eq("name", r_id_val).limit(1).execute()
                                if res.data:
                                    final_recipe_id = res.data[0]['id']
                                else:
                                    # Try case-insensitive partial match
                                    res = supabase.table("Recipe").select("id").ilike("name", f"%{r_id_val}%").limit(1).execute()
                                    if res.data:
                                        final_recipe_id = res.data[0]['id']
                            except Exception as lookup_err:
                                print(f"[Agent] Name lookup failed: {lookup_err}")

                        if final_recipe_id is not None:
                            result = add_to_calendar_tool(
                                user_id=req.user_id,
                                recipe_id=final_recipe_id,
                                date=args.get("date"),
                                meal_type=args.get("meal_type")
                            )
                        else:
                            result = f"Error: Could not resolve recipe '{r_id_val}' to an ID. Please ask for the recipe again so I can find it."

                elif func_name == "log_metrics":
                    result = log_metrics_tool(
                        user_id=req.user_id,
                        weight_kg=args.get("weight_kg"),
                        height_cm=args.get("height_cm")
                    )
                
                tool_results_list.append({
                    "tool": func_name,
                    "args": args,
                    "result": result
                })
                
                # Append tool result to messages
                messages.append({
                    "tool_call_id": tool_call.id,
                    "role": "tool",
                    "name": func_name,
                    "content": str(result) # Or json.dumps(result)
                })

            # 2. Second Call: Get final natural language response
            final_response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages
            )
            final_text = final_response.choices[0].message.content
            
        else:
            # Fallback A: Check if model outputted text that looks like a tool call
            # Pattern: function_name{"key": "value"} or function_name({"key": "value"})
            import re
            content = response_message.content
            
            # Match word chars followed by {
            match = re.search(r'(\w+)\s*\(?({.+})\)?', content)
            
            # Fallback B: Check for JSON object directly
            json_tool_call = None
            try:
                # 1. Attempt to find the FIRST valid JSON object within braces
                possible_json = re.search(r'(\{.*\})', content, re.DOTALL)
                if possible_json:
                    json_str = possible_json.group(1)
                    parsed = json.loads(json_str)
                    
                    if isinstance(parsed, dict):
                        if parsed.get("type") == "function" and "name" in parsed:
                            json_tool_call = parsed
                        elif "function" in parsed and isinstance(parsed["function"], str):
                            json_tool_call = {
                                "name": parsed["function"],
                                "parameters": parsed.get("args", parsed.get("parameters", {}))
                            }
                        elif "name" in parsed and "parameters" in parsed:
                             json_tool_call = parsed
                
                # 2. Fallback C: CLI-style arguments (e.g. add_to_calendar --recipe_id 141 --date ...)
                if not json_tool_call and not match:
                     # Relaxed regex: allow command to appear anywhere in the line/text
                     cli_match = re.search(r'(\w+)\s+((?:--\w+\s+(?:\S+|"[^"]+")\s*)+)', content.strip())
                     if cli_match:
                         func_name_cli = cli_match.group(1)
                         args_str_cli = cli_match.group(2)
                         # Parse args: --key value
                         args_dict = {}
                         parts = re.split(r'\s+--', args_str_cli)
                         for part in parts:
                             part = part.strip().lstrip('-')
                             if ' ' in part:
                                 k, v = part.split(' ', 1)
                                 args_dict[k.strip()] = v.strip().strip('"')
                         
                         json_tool_call = {
                             "name": func_name_cli,
                             "parameters": args_dict
                         }
                
                # 3. Fallback D: Argument-based Inference (Lazy model output)
                # If we have a JSON object that is NOT a defined tool structure, check if its keys match a tool's params
                if not json_tool_call and parsed and isinstance(parsed, dict) and "weight_kg" in parsed:
                     json_tool_call = { "name": "log_metrics", "parameters": parsed }
                elif not json_tool_call and parsed and isinstance(parsed, dict) and "query" in parsed and len(parsed) == 1:
                     json_tool_call = { "name": "search_recipes", "parameters": parsed }

            except Exception as e:
                print(f"[Agent] Parsing check failed: {e}")
                pass

            # Execution Block
            if match or json_tool_call:
                if json_tool_call:
                     func_name = json_tool_call["name"]
                     args = json_tool_call.get("parameters", {})
                else: 
                     func_name = match.group(1)
                     args_str = match.group(2)
                     try:
                        args = json.loads(args_str)
                     except:
                        args = {}

                # Verify it's a known tool
                known_tools = [t["function"]["name"] for t in tools]
                if func_name in known_tools:
                    print(f"[Agent] Detected text-based tool call: {func_name}")
                    try:
                        # Execute Tool
                        result = None
                        if func_name == "search_recipes":
                            result = search_recipes_tool(query=args.get("query"), user_id=req.user_id)
                        elif func_name == "add_to_calendar":
                            # Same ID resolution logic as above...
                            r_id_val = args.get("recipe_id")
                            final_recipe_id = None
                            try:
                                final_recipe_id = int(r_id_val)
                            except (ValueError, TypeError):
                                print(f"[Agent] Text-based fallback: Name '{r_id_val}' looking up...")
                                try:
                                    res = supabase.table("Recipe").select("id").eq("name", r_id_val).limit(1).execute()
                                    if res.data:
                                        final_recipe_id = res.data[0]['id']
                                    else:
                                        res = supabase.table("Recipe").select("id").ilike("name", f"%{r_id_val}%").limit(1).execute()
                                        if res.data:
                                            final_recipe_id = res.data[0]['id']
                                except Exception:
                                    pass

                            if final_recipe_id is not None:
                                result = add_to_calendar_tool(
                                    user_id=req.user_id,
                                    recipe_id=final_recipe_id,
                                    date=args.get("date"),
                                    meal_type=args.get("meal_type")
                                )
                            else:
                                result = f"Error: Could not resolve recipe '{r_id_val}'."

                        elif func_name == "log_metrics":
                            result = log_metrics_tool(
                                user_id=req.user_id,
                                weight_kg=args.get("weight_kg"),
                                height_cm=args.get("height_cm")
                            )
                            
                        # Add the result to history so the model can summarize it
                        messages.append({
                            "role": "system", 
                            "content": f"Tool '{func_name}' output: {json.dumps(result, default=str)}"
                        })
                        
                        # 2. Second Call: Get final natural language response
                        print("[Agent] Text-based fallback: Requesting removal/summary from LLM...")
                        final_response = client.chat.completions.create(
                            model="llama-3.3-70b-versatile",
                            messages=messages
                        )
                        final_text = final_response.choices[0].message.content
                        
                        # Add to tool_calls list for frontend to see
                        tool_results_list.append({
                            "tool": func_name,
                            "args": args,
                            "result": result
                        })
                        
                    except json.JSONDecodeError:
                        final_text = content
                else:
                    final_text = content
            else:
                final_text = content
        
        # SAVE AGENT RESPONSE
        save_chat_message(req.user_id, "agent", final_text, tool_calls=tool_results_list)

        return ChatResponse(
            response=final_text,
            tool_calls=tool_results_list
        )

    except Exception as e:
        print(f"Agent Error: {e}")
        # Improve error for rate limits/auth
        raise HTTPException(status_code=500, detail=str(e))
