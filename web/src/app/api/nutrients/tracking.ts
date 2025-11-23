import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

type NutrientTrackingUpsert = {
  user_id: string;
  date: string;
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  sugar_g: number;
  fiber_g: number;
  sodium_mg: number;
  meal_count: number;
  updated_at?: string;
};

type ExtendedDatabase = Database & {
  public: Database["public"] & {
    Tables: Database["public"]["Tables"] & {
      nutrient_tracking: {
        Row: NutrientTrackingUpsert;
        Insert: NutrientTrackingUpsert;
        Update: Partial<NutrientTrackingUpsert>;
        Relationships: [];
      };
    };
  };
};

type SupabaseServerClient = SupabaseClient<Database>;

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

type CompletedMealRow = {
  date: string | null;
  Recipe: {
    "Recipe-Ingredient_Map": RecipeIngredientMapRow[];
  } | null;
};

type NutrientTotals = {
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  sugar_g: number;
  fiber_g: number;
  sodium_mg: number;
  meal_count: number;
};

const EMPTY_TOTALS: NutrientTotals = {
  calories_kcal: 0,
  protein_g: 0,
  carbs_g: 0,
  fats_g: 0,
  sugar_g: 0,
  fiber_g: 0,
  sodium_mg: 0,
  meal_count: 0,
};

const roundTo2 = (value: number) => Math.round(value * 100) / 100;

function aggregateMeals(meals: CompletedMealRow[]): NutrientTotals {
  if (!meals.length) return { ...EMPTY_TOTALS };

  const totals: NutrientTotals = { ...EMPTY_TOTALS, meal_count: meals.length };

  for (const meal of meals) {
    const recipe = meal.Recipe;
    if (!recipe) continue;

    for (const map of recipe["Recipe-Ingredient_Map"] || []) {
      const ingredient = map.Ingredient;
      if (!ingredient) continue;

      const ratio = (map.relative_unit_100 ?? 100) / 100 || 0;

      totals.calories_kcal += Number(ingredient.calories_kcal || 0) * ratio;
      totals.protein_g += Number(ingredient.protein_g || 0) * ratio;
      totals.carbs_g += Number(ingredient.carbs_g || 0) * ratio;
      totals.fats_g += Number(ingredient.agg_fats_g || 0) * ratio;
      totals.sugar_g += Number(ingredient.sugars_g || 0) * ratio;
    }
  }

  return {
    ...totals,
    calories_kcal: roundTo2(totals.calories_kcal),
    protein_g: roundTo2(totals.protein_g),
    carbs_g: roundTo2(totals.carbs_g),
    fats_g: roundTo2(totals.fats_g),
    sugar_g: roundTo2(totals.sugar_g),
  };
}

export async function syncDailyNutrientTracking({
  supabase,
  publicUserId,
  authUserId,
  date,
}: {
  supabase: SupabaseServerClient;
  publicUserId: number;
  authUserId: string;
  date: string;
}) {
  const { data: meals, error: mealError } = await supabase
    .from("Calendar")
    .select(
      `
        date,
        Recipe: recipe_id(
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
    .eq("date", date)
    .order("date", { ascending: true });

  if (mealError) {
    throw new Error(mealError.message);
  }

  const totals = aggregateMeals((meals as unknown as CompletedMealRow[]) || []);

  const nutrientSupabase = supabase as SupabaseClient<ExtendedDatabase>;

  const { error: upsertError } = await nutrientSupabase.from("nutrient_tracking").upsert(
    [
      {
        user_id: authUserId,
        date,
        ...totals,
        updated_at: new Date().toISOString(),
      },
    ],
    { onConflict: "user_id,date" }
  );

  if (upsertError) {
    throw new Error(upsertError.message);
  }
}
