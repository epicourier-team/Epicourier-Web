import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from api.recommender import create_meal_plan
from supabase import Client, create_client
from dotenv import load_dotenv

load_dotenv()

url: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

supabase: Client = create_client(url, key)

app = FastAPI()

# Allow frontend (Next.js) to call API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/test")
def test_endpoint():
    data = supabase.table("Recipe").select("*").limit(5).execute()
    return {"message": data.data}


class RecommendRequest(BaseModel):
    goal: str
    num_meals: int = Field(..., alias="numMeals")

    model_config = {"populate_by_name": True}


@app.post("/recommender")
def recommend_meals(req: RecommendRequest):
    """Main recommender endpoint with input validation."""
    # Validate goal
    if not req.goal or not req.goal.strip():
        raise HTTPException(status_code=400, detail="Goal cannot be empty")

    # Validate number of meals
    if req.num_meals not in [3, 5, 7]:
        raise HTTPException(status_code=400, detail="numMeals must be one of 3, 5, or 7")

    plan, expanded_goal = create_meal_plan(req.goal, n_meals=req.num_meals)
    return {"recipes": plan, "goal_expanded": expanded_goal}