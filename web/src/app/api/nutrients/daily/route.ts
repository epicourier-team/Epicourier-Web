import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type { DailyNutrient, WeeklyNutrient, MonthlyNutrient, NutrientSummaryResponse } from "@/types/data";

/**
 * Helper function:
 * Get numeric ID (bigint) from public."User" table.
 */
async function getPublicUserId(supabase: SupabaseClient<Database>): Promise<number> {
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    throw new Error("User not authenticated");
  }

  if (!authUser.email) {
    throw new Error("Authenticated user does not have an email.");
  }

  const { data: publicUsers, error: profileError } = await supabase
    .from("User")
    .select("id")
    .eq("email", authUser.email)
    .limit(1);

  if (profileError) {
    console.error("Error fetching public user profile:", profileError.message);
    throw new Error("Error fetching user profile.");
  }

  if (!publicUsers || publicUsers.length === 0) {
    throw new Error("Public user profile not found.");
  }

  const publicUser = publicUsers[0];
  return publicUser.id;
}

/**
 * GET /api/nutrients/daily?period=day|week|month&date=YYYY-MM-DD
 * 
 * Query parameters:
 * - period: "day" (default), "week", or "month"
 * - date: Target date in YYYY-MM-DD format (defaults to today)
 * 
 * Returns aggregated nutrient data from user's meal logs.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  let publicUserId: number;

  try {
    publicUserId = await getPublicUserId(supabase);
  } catch (err: unknown) {
    let errorMessage = "Unauthorized";
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    console.warn("GET /api/nutrients/daily auth error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 401 });
  }

  // Parse query parameters
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "day";
  const dateParam = searchParams.get("date");
  
  const targetDate = dateParam ? new Date(dateParam) : new Date();
  
  if (isNaN(targetDate.getTime())) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  let startDate: Date;
  let endDate: Date;

  // Calculate date range based on period
  switch (period) {
    case "day":
      startDate = new Date(targetDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(targetDate);
      endDate.setHours(23, 59, 59, 999);
      break;
    
    case "week":
      // Get start of week (Monday)
      startDate = new Date(targetDate);
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);
      
      // End of week (Sunday)
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    
    case "month":
      // Start of month
      startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      // End of month
      endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    
    default:
      return NextResponse.json({ error: "Invalid period parameter" }, { status: 400 });
  }

  try {
    // Query Calendar table to get meal logs within date range
    const { data: calendarData, error: calendarError } = await supabase
      .from("Calendar")
      .select(
        `
        id,
        date,
        meal_type,
        recipe_id,
        Recipe: recipe_id(
          id,
          name,
          Recipe-Ingredient_Map(
            relative_unit_100,
            Ingredient: ingredient_id(
              agg_fats_g,
              agg_minerals_mg,
              agg_vit_b_mg,
              calories_kcal,
              carbs_g,
              cholesterol_mg,
              protein_g,
              sugars_g,
              vit_a_microg,
              vit_c_mg,
              vit_d_microg,
              vit_e_mg,
              vit_k_microg
            )
          )
        )
      `
      )
      .eq("user_id", publicUserId)
      .eq("status", true)
      .gte("date", startDate.toISOString().split("T")[0])
      .lte("date", endDate.toISOString().split("T")[0])
      .order("date", { ascending: true });

    if (calendarError) {
      console.error("Error fetching calendar data:", calendarError.message);
      return NextResponse.json({ error: calendarError.message }, { status: 500 });
    }

    // Aggregate nutrients from all meals
    const aggregatedNutrients = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      cholesterol: 0,
      sugars: 0,
      minerals: 0,
      vitaminB: 0,
      vitaminA: 0,
      vitaminC: 0,
      vitaminD: 0,
      vitaminE: 0,
      vitaminK: 0,
    };

    if (calendarData && calendarData.length > 0) {
      for (const meal of calendarData) {
        const recipe = meal.Recipe as {
          id: number;
          name: string;
          "Recipe-Ingredient_Map": Array<{
            relative_unit_100: number;
            Ingredient: {
              agg_fats_g: number | null;
              agg_minerals_mg: number | null;
              agg_vit_b_mg: number | null;
              calories_kcal: number | null;
              carbs_g: number | null;
              cholesterol_mg: number | null;
              protein_g: number | null;
              sugars_g: number | null;
              vit_a_microg: number | null;
              vit_c_mg: number | null;
              vit_d_microg: number | null;
              vit_e_mg: number | null;
              vit_k_microg: number | null;
            };
          }>;
        } | null;
        if (!recipe) continue;

        const ingredientMaps = recipe["Recipe-Ingredient_Map"] || [];
        
        for (const map of ingredientMaps) {
          const ingredient = map.Ingredient;
          if (!ingredient) continue;

          const ratio = (map.relative_unit_100 || 100) / 100;

          aggregatedNutrients.calories += Number(ingredient.calories_kcal || 0) * ratio;
          aggregatedNutrients.protein += Number(ingredient.protein_g || 0) * ratio;
          aggregatedNutrients.carbs += Number(ingredient.carbs_g || 0) * ratio;
          aggregatedNutrients.fats += Number(ingredient.agg_fats_g || 0) * ratio;
          aggregatedNutrients.cholesterol += Number(ingredient.cholesterol_mg || 0) * ratio;
          aggregatedNutrients.sugars += Number(ingredient.sugars_g || 0) * ratio;
          aggregatedNutrients.minerals += Number(ingredient.agg_minerals_mg || 0) * ratio;
          aggregatedNutrients.vitaminB += Number(ingredient.agg_vit_b_mg || 0) * ratio;
          aggregatedNutrients.vitaminA += Number(ingredient.vit_a_microg || 0) * ratio;
          aggregatedNutrients.vitaminC += Number(ingredient.vit_c_mg || 0) * ratio;
          aggregatedNutrients.vitaminD += Number(ingredient.vit_d_microg || 0) * ratio;
          aggregatedNutrients.vitaminE += Number(ingredient.vit_e_mg || 0) * ratio;
          aggregatedNutrients.vitaminK += Number(ingredient.vit_k_microg || 0) * ratio;
        }
      }
    }

    // Round all values to 2 decimal places
    const roundedNutrients = Object.fromEntries(
      Object.entries(aggregatedNutrients).map(([key, value]) => [
        key,
        Math.round(value * 100) / 100,
      ])
    );

    // Build response based on period type
    let response: NutrientSummaryResponse;

    if (period === "day") {
      const dailyData: DailyNutrient = {
        ...roundedNutrients,
        date: targetDate.toISOString().split("T")[0],
      } as DailyNutrient;
      response = {
        period: "day",
        data: dailyData,
      };
    } else if (period === "week") {
      const weeklyData: WeeklyNutrient = {
        ...roundedNutrients,
        weekStart: startDate.toISOString().split("T")[0],
        weekEnd: endDate.toISOString().split("T")[0],
      } as WeeklyNutrient;
      response = {
        period: "week",
        data: weeklyData,
      };
    } else {
      const monthlyData: MonthlyNutrient = {
        ...roundedNutrients,
        month: `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}`,
      } as MonthlyNutrient;
      response = {
        period: "month",
        data: monthlyData,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error calculating nutrients:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
