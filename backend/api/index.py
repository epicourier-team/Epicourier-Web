import os
import logging
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from api.recommender import create_meal_plan
from supabase import Client, create_client
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
    user_email: str | None = Field(None, alias="userEmail")  # User's email from Supabase Auth
    user_profile: dict | None = Field(None, alias="userProfile")  # Optional: for direct profile passing
    pantry_items: list[str] | None = Field(None, alias="pantryItems")

    model_config = {"populate_by_name": True}



@app.post("/recommender")
def recommend_meals(req: RecommendRequest):
    """Main recommender endpoint with input validation."""
    try:
        # Validate goal
        if not req.goal or not req.goal.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Goal cannot be empty"
            )

        # Validate number of meals
        if req.num_meals not in [3, 5, 7]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="numMeals must be one of 3, 5, or 7"
            )

        # Fetch user profile from database if user_email is provided
        user_profile = req.user_profile
        pantry_items = req.pantry_items
        
        if req.user_email:
            try:
                user_data = supabase.table("User").select("*").eq("email", req.user_email).execute()
                
                if user_data.data and len(user_data.data) > 0:
                    user = user_data.data[0]
                    user_id = user.get("id")
                    
                    allergies = user.get("allergies") or []
                    dietary_prefs = user.get("dietary_preferences") or []
                    equipment = user.get("kitchen_equipment") or []
                    
                    user_profile = {
                        "allergies": allergies if isinstance(allergies, list) else [],
                        "dietary_preferences": dietary_prefs if isinstance(dietary_prefs, list) else [],
                        "kitchen_equipment": equipment if isinstance(equipment, list) else []
                    }
                    
                    if not pantry_items and user_id:
                        pantry_data = supabase.table("PantryItem").select("name").eq("user_id", user_id).execute()
                        pantry_items = [item["name"] for item in pantry_data.data] if pantry_data.data else []
                        
            except Exception as e:
                logger.warning(f"Failed to fetch user profile for {req.user_email}: {e}")
                # Continue with provided profile or None

        # Generate meal plan
        plan, expanded_goal = create_meal_plan(
            req.goal, 
            n_meals=req.num_meals,
            user_profile=user_profile,
            pantry_items=pantry_items
        )
        
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No suitable recipes found matching your criteria"
            )
        
        return {"recipes": plan, "goal_expanded": expanded_goal}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in recommend_meals: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while generating recommendations"
        )