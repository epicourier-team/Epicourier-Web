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

// Gamification / Achievement Types (v1.2.0)

/**
 * Achievement tier levels for badge rarity
 */
export type BadgeTier = "bronze" | "silver" | "gold" | "platinum";

/**
 * Achievement criteria type
 */
export type AchievementCriteriaType = "count" | "streak" | "threshold";

/**
 * Achievement metrics that can be tracked
 */
export type AchievementMetric = 
  | "meals_logged"
  | "green_recipes"
  | "days_tracked"
  | "dashboard_views"
  | "calories_tracked"
  | "nutrient_goals_met";

/**
 * Flexible achievement criteria structure
 */
export interface AchievementCriteria {
  type: AchievementCriteriaType;
  metric: AchievementMetric;
  target: number;
}

/**
 * Achievement definition from database
 */
export interface Achievement {
  id: number;
  name: string; // Unique identifier (e.g., 'first_meal')
  title: string; // Display name (e.g., 'First Meal Logged')
  description: string | null;
  icon: string | null; // Icon identifier (e.g., 'utensils', 'leaf')
  tier: BadgeTier;
  criteria: AchievementCriteria;
  created_at: string;
}

/**
 * Progress toward an incomplete achievement
 */
export interface AchievementProgress {
  current: number;
  target: number;
  percentage: number;
  last_updated: string;
}

/**
 * User's earned achievement record
 */
export interface UserAchievement {
  id: number;
  user_id: string;
  achievement_id: number;
  earned_at: string;
  progress: AchievementProgress | null;
  Achievement?: Achievement; // Optional joined data
}

/**
 * API response for achievements endpoint
 */
export interface AchievementsResponse {
  earned: UserAchievement[];
  available: Achievement[];
  progress: Record<string, AchievementProgress>;
}

/**
 * Request body for achievement check endpoint
 */
export interface AchievementCheckRequest {
  trigger: "meal_logged" | "nutrient_viewed" | "manual";
}

/**
 * Response from achievement check endpoint
 */
export interface AchievementCheckResponse {
  newly_earned: UserAchievement[];
  updated_progress: Record<string, AchievementProgress>;
}
