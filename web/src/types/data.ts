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
 * Base nutrient data structure containing all tracked nutrients
 */
export interface NutrientData {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  cholesterol: number;
  sugars: number;
  minerals: number;
  vitaminB: number;
  vitaminA: number;
  vitaminC: number;
  vitaminD: number;
  vitaminE: number;
  vitaminK: number;
}

/**
 * Daily nutrient summary for a specific date
 */
export interface DailyNutrient extends NutrientData {
  date: string; // YYYY-MM-DD format
}

/**
 * Weekly nutrient aggregation with date range
 */
export interface WeeklyNutrient extends NutrientData {
  weekStart: string; // YYYY-MM-DD format
  weekEnd: string; // YYYY-MM-DD format
}

/**
 * Monthly nutrient aggregation
 */
export interface MonthlyNutrient extends NutrientData {
  month: string; // YYYY-MM format (e.g., "2025-11")
}

/**
 * API response structure for nutrient summary endpoint
 */
export interface NutrientSummaryResponse {
  period: "day" | "week" | "month";
  data: DailyNutrient | WeeklyNutrient | MonthlyNutrient;
}
