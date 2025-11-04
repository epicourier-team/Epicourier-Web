import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from recommender import create_meal_plan
# import recommender
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
    allow_origins=["*"],  # you can restrict to your frontend domain later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/test")
def test_endpoint():
    data = supabase.table("Recipe").select("*").limit(5).execute()
    return { "message": data.data }

class RecommendRequest(BaseModel):
    goal: str
    num_meals: int = Field(..., alias="numMeals")  # frontend sends camelCase

    model_config = {
        "populate_by_name": True
    }

@app.post("/recommender")
def recommend_meals(req: RecommendRequest):
    # create_meal_plan already returns a list of dicts
    plan = create_meal_plan(req.goal, n_meals=req.num_meals)
    return {"recipes": plan}