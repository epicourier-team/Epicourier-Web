from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from recommender import create_meal_plan

app = FastAPI()

# Allow frontend (Next.js) to call API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # you can restrict to your frontend domain later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RecommendRequest(BaseModel):
    goal: str
    numMeals: int

@app.post("/recommend")
def recommend_meals(req: RecommendRequest):
    plan = create_meal_plan(req.goal, n_meals=req.numMeals)
    return {"recipes": plan}