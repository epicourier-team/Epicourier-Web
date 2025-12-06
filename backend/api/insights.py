import os
from datetime import datetime, timedelta
from typing import List, Optional

import pandas as pd
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from supabase import create_client, Client

# Initialize Supabase client
url: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

router = APIRouter(prefix="/insights", tags=["insights"])

# Data Models
class MetricLog(BaseModel):
    user_id: str # Front end sends UUID (auth_id)
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    recorded_at: Optional[datetime] = None

class StatsResponse(BaseModel):
    completion_rate: float
    total_meals: int
    completed_meals: int
    avg_green_score: float
    weight_trend: List[dict]
    meal_type_distribution: List[dict]
    weekly_adherence: List[dict]

def get_public_user_id(auth_id: str):
    """Helper to resolve auth.users.id (UUID) to public.User.id (Int)."""
    try:
        res = supabase.table("User").select("id").eq("auth_id", auth_id).single().execute()
        if res.data:
            return res.data['id']
    except Exception as e:
        print(f"Error resolving public user id: {e}")
        return None
    return None

@router.post("/metrics")
def log_metrics(metric: MetricLog):
    """Log a new weight or height measurement."""
    
    # Resolve UUID to Public Int ID
    public_id = get_public_user_id(metric.user_id)
    if not public_id:
        raise HTTPException(status_code=404, detail="User profile not found")

    data = {
        "user_id": public_id,
        "weight_kg": metric.weight_kg,
        "height_cm": metric.height_cm,
        "recorded_at": metric.recorded_at.isoformat() if metric.recorded_at else datetime.now().isoformat()
    }
    
    # Remove None values
    data = {k: v for k, v in data.items() if v is not None}
    
    try:
        response = supabase.table("UserMetricsHistory").insert(data).execute()
        
        # Also update the main User profile with the latest values
        profile_update = {}
        if metric.weight_kg:
            profile_update["weight_kg"] = metric.weight_kg
        if metric.height_cm:
            profile_update["height_cm"] = metric.height_cm
            
        if profile_update:
            # For the User table, we can update using auth_id directly if unique or id
            # Using auth_id is safer as we have it from input
            supabase.from_("User").update(profile_update).eq("auth_id", metric.user_id).execute()
            
        return {"message": "Metrics logged successfully", "data": response.data}
    except Exception as e:
        print(f"Error logging metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats", response_model=StatsResponse)
def get_user_stats(user_id: str, period: str = "30d"):
    """
    Get aggregated statistics for graphs and insights.
    user_id: Expects the Auth UUID from the frontend.
    period: '7d', '30d', '90d', 'all'
    """
    
    # Resolve UUID to Public Int ID
    public_id = get_public_user_id(user_id)
    if not public_id:
        # If user doesn't exist yet, return empty stats or error. 
        # Returning empty stats is safer for UI.
        return StatsResponse(
            completion_rate=0,
            total_meals=0,
            completed_meals=0,
            avg_green_score=0,
            weight_trend=[],
            meal_type_distribution=[],
            weekly_adherence=[]
        )

    # Calculate date range
    today = datetime.now()
    if period == "7d":
        start_date = today - timedelta(days=7)
    elif period == "30d":
        start_date = today - timedelta(days=30)
    elif period == "90d":
        start_date = today - timedelta(days=90)
    else:
        start_date = today - timedelta(days=365) # Default to 1 year approx for 'all'

    start_date_str = start_date.strftime("%Y-%m-%d")

    try:
        # A. Fetch Calendar Data (Meal Completion)
        calendar_res = supabase.table("Calendar")\
            .select("*, Recipe(green_score, name)")\
            .eq("user_id", public_id)\
            .gte("date", start_date_str)\
            .order("date")\
            .execute()
            
        calendar_data = calendar_res.data
        
        # B. Fetch Weight History
        weight_res = supabase.table("UserMetricsHistory")\
            .select("weight_kg, recorded_at")\
            .eq("user_id", public_id)\
            .gte("recorded_at", start_date.isoformat())\
            .order("recorded_at")\
            .execute()
            
        weight_data = weight_res.data

        # --- Data Processing with Pandas ---
        
        # 1. Calendar / Meal Stats
        if not calendar_data:
             # Return empty stats if no data
             # Still process weight data if available? 
             # For now, let's keep it simple, but we should process weight even if no meals.
             pass

        completion_rate = 0
        total_meals = 0
        completed_meals = 0
        avg_green_score = 0
        meal_type_dist = []
        weekly_adherence = []

        if calendar_data:
            df_cal = pd.DataFrame(calendar_data)
            df_cal['status'] = df_cal['status'].fillna(False).astype(bool)
            
            def extract_green_score(row):
                if pd.isna(row['Recipe']) or not row['Recipe']: 
                    return None
                return float(row['Recipe'].get('green_score', 0) or 0)

            df_cal['green_score'] = df_cal.apply(extract_green_score, axis=1)

            total_meals = len(df_cal)
            completed_meals = df_cal['status'].sum()
            completion_rate = (completed_meals / total_meals * 100) if total_meals > 0 else 0
            avg_green_score = df_cal[df_cal['status']]['green_score'].mean()
            if pd.isna(avg_green_score): avg_green_score = 0

            # Meal Type Distribution
            meal_type_counts = df_cal[df_cal['status']]['meal_type'].value_counts().reset_index()
            meal_type_counts.columns = ['name', 'value']
            meal_type_dist = meal_type_counts.to_dict('records')

            # Weekly Adherence
            df_cal['date'] = pd.to_datetime(df_cal['date'])
            df_cal['week'] = df_cal['date'].dt.to_period('W').apply(lambda r: r.start_time.strftime('%Y-%m-%d'))
            
            weekly_stats = df_cal.groupby('week').agg(
                total=('id', 'count'),
                completed=('status', 'sum')
            ).reset_index()
            weekly_stats['rate'] = (weekly_stats['completed'] / weekly_stats['total'] * 100).round(1)
            weekly_adherence = weekly_stats[['week', 'rate', 'completed']].to_dict('records')

        # 2. Weight Trend
        weight_trend = []
        if weight_data:
            df_weight = pd.DataFrame(weight_data)
            df_weight['recorded_at'] = pd.to_datetime(df_weight['recorded_at']).dt.strftime('%Y-%m-%d')
            weight_trend = df_weight[['recorded_at', 'weight_kg']].rename(columns={'recorded_at': 'date', 'weight_kg': 'weight'}).to_dict('records')

        return StatsResponse(
            completion_rate=round(completion_rate, 1),
            total_meals=total_meals,
            completed_meals=int(completed_meals),
            avg_green_score=round(avg_green_score, 1),
            weight_trend=weight_trend,
            meal_type_distribution=meal_type_dist,
            weekly_adherence=weekly_adherence
        )

    except Exception as e:
        print(f"Error calculating stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
