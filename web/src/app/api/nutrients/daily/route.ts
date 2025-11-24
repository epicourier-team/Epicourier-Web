import { createClient } from "@/utils/supabase/server";
import { getPublicUserId } from "@/lib/auth";
import { NextResponse } from "next/server";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type { NutrientData, NutrientSummaryResponse } from "@/types/data";

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
 * Types for Supabase query response
 */
type IngredientRow = {
  agg_fats_g: number | null;
  calories_kcal: number | null;
  carbs_g: number | null;
  protein_g: number | null;
  sugars_g: number | null;
};

type RecipeIngredientMapRow = {
  relative_unit_100: number | null;
  Ingredient: IngredientRow | null;
};

type CalendarMealRow = {
  id: number;
  date: string | null;
  meal_type: string | null;
  recipe_id: number | null;
  Recipe: {
    id: number;
    name: string;
    "Recipe-Ingredient_Map": RecipeIngredientMapRow[];
  } | null;
};

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
              calories_kcal,
              carbs_g,
              protein_g,
              sugars_g
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
      calories_kcal: 0,
      protein_g: 0,
      carbs_g: 0,
      fats_g: 0,
      fiber_g: 0,
      sugar_g: 0,
      sodium_mg: 0,
    };

    let mealCount = 0;

    if (calendarData && calendarData.length > 0) {
      mealCount = calendarData.length;

      for (const meal of calendarData as unknown as CalendarMealRow[]) {
        const recipe = meal.Recipe;
        if (!recipe) continue;

        const ingredientMaps = recipe["Recipe-Ingredient_Map"] || [];

        for (const map of ingredientMaps) {
          const ingredient = map.Ingredient;
          if (!ingredient) continue;

          const ratio = (map.relative_unit_100 || 100) / 100;

          aggregatedNutrients.calories_kcal += Number(ingredient.calories_kcal || 0) * ratio;
          aggregatedNutrients.protein_g += Number(ingredient.protein_g || 0) * ratio;
          aggregatedNutrients.carbs_g += Number(ingredient.carbs_g || 0) * ratio;
          aggregatedNutrients.fats_g += Number(ingredient.agg_fats_g || 0) * ratio;
          aggregatedNutrients.sugar_g += Number(ingredient.sugars_g || 0) * ratio;
        }
      }
    }

    // Round all values to 2 decimal places
    const roundedNutrients: NutrientData = {
      calories_kcal: Math.round(aggregatedNutrients.calories_kcal * 100) / 100,
      protein_g: Math.round(aggregatedNutrients.protein_g * 100) / 100,
      carbs_g: Math.round(aggregatedNutrients.carbs_g * 100) / 100,
      fats_g: Math.round(aggregatedNutrients.fats_g * 100) / 100,
      fiber_g: Math.round(aggregatedNutrients.fiber_g * 100) / 100,
      sugar_g: Math.round(aggregatedNutrients.sugar_g * 100) / 100,
      sodium_mg: Math.round(aggregatedNutrients.sodium_mg * 100) / 100,
    };

    // Build response based on period type
    const response: NutrientSummaryResponse = {
      daily: null,
      weekly: [],
      monthly: [],
    };

    if (period === "day") {
      response.daily = {
        ...roundedNutrients,
        date: targetDate.toISOString().split("T")[0],
        meal_count: mealCount,
        user_id: String(publicUserId),
      };
    } else if (period === "week") {
      response.weekly = [
        {
          ...roundedNutrients,
          week_start: startDate.toISOString().split("T")[0],
          week_end: endDate.toISOString().split("T")[0],
          days_tracked: mealCount > 0 ? 1 : 0,
        },
      ];
    } else {
      response.monthly = [
        {
          ...roundedNutrients,
          month: `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}`,
          days_tracked: mealCount > 0 ? 1 : 0,
        },
      ];
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error calculating nutrients:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
