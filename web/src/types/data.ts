import { Database } from "./supabase";

export type Recipe = Database["public"]["Tables"]["Recipe"]["Row"];
export type Ingredient = Database["public"]["Tables"]["Ingredient"]["Row"];
export type RecipeIngredientMap = Database["public"]["Tables"]["Recipe-Ingredient_Map"]["Row"];
export type Tag = Database["public"]["Tables"]["RecipeTag"]["Row"];
export type RecipeTagMap = Database["public"]["Tables"]["Recipe-Tag_Map"]["Row"];

export type RecipeDetail = {
  recipe: Recipe;
  ingredients: (Pick<RecipeIngredientMap, "relative_unit_100"> & { ingredient: Ingredient })[];
  tags: { tag: Tag }[];
  sumNutrients: Pick<
    Ingredient,
    | "agg_fats_g"
    | "agg_minerals_mg"
    | "agg_vit_b_mg"
    | "calories_kcal"
    | "carbs_g"
    | "cholesterol_mg"
    | "protein_g"
    | "sugars_g"
    | "vit_a_microg"
    | "vit_c_mg"
    | "vit_d_microg"
    | "vit_e_mg"
    | "vit_k_microg"
  >;
};

// Nutrient Tracking Types (v1.1.0)

/**
 * Base nutrient data structure containing essential macronutrients and micronutrients
 */
export interface NutrientData {
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
}

/**
 * Daily nutrient summary for a specific date
 */
export interface DailyNutrient extends NutrientData {
  date: string; // YYYY-MM-DD format
  meal_count: number;
  user_id: string;
}

/**
 * Weekly nutrient aggregation with date range
 */
export interface WeeklyNutrient extends NutrientData {
  week_start: string; // YYYY-MM-DD format
  week_end: string; // YYYY-MM-DD format
  days_tracked: number;
}

/**
 * Monthly nutrient aggregation
 */
export interface MonthlyNutrient extends NutrientData {
  month: string; // YYYY-MM format (e.g., "2025-11")
  days_tracked: number;
}

export interface NutrientGoal {
  user_id: string;
  calories_kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fats_g: number | null;
  sodium_mg: number | null;
  fiber_g: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * API response structure for nutrient summary endpoint
 */
export interface NutrientSummaryResponse {
  daily: DailyNutrient | null;
  weekly: WeeklyNutrient[];
  monthly: MonthlyNutrient[];
}
