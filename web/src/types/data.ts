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

// Gamification / Achievement System Types (v1.2.0)

/**
 * Badge tier levels for achievement system
 */
export type BadgeTier = "bronze" | "silver" | "gold" | "platinum";

/**
 * Type of criteria used to evaluate achievement progress
 */
export type AchievementCriteriaType = "count" | "streak" | "threshold";

/**
 * Metric tracked for achievement progress
 */
export type AchievementMetric =
  | "meals_logged"
  | "green_recipes"
  | "days_tracked"
  | "streak_days"
  | "dashboard_views"
  | "nutrient_aware_percentage";

/**
 * Achievement criteria structure (stored as JSONB in database)
 */
export interface AchievementCriteria {
  type: AchievementCriteriaType;
  metric: AchievementMetric;
  target: number;
}

/**
 * Achievement definition from achievement_definitions table
 */
export interface Achievement {
  id: number;
  name: string;
  title: string;
  description: string;
  icon: string;
  tier: BadgeTier;
  criteria: AchievementCriteria;
}

/**
 * User's earned achievement with optional joined Achievement data
 */
export interface UserAchievement {
  id: number;
  user_id: string;
  achievement_id: number;
  earned_at: string;
  progress: Record<string, unknown> | null;
  achievement?: Achievement;
}

/**
 * Progress tracking for unearned achievements
 */
export interface AchievementProgress {
  current: number;
  target: number;
  percentage: number;
  last_updated: string;
}

/**
 * API response structure for GET /api/achievements
 */
export interface AchievementsResponse {
  earned: UserAchievement[];
  available: Achievement[];
  progress: Record<string, AchievementProgress>;
}

/**
 * API request structure for POST /api/achievements/check
 */
export interface AchievementCheckRequest {
  trigger: "meal_logged" | "nutrient_viewed" | "manual";
}

/**
 * API response structure for POST /api/achievements/check
 */
export interface AchievementCheckResponse {
  newly_earned: Achievement[];
  message: string;
}

// Challenge System Types (v1.2.0 Extended)

/**
 * Challenge type: weekly, monthly, or special events
 */
export type ChallengeType = "weekly" | "monthly" | "special";

/**
 * Challenge category: content-based grouping
 */
export type ChallengeCategory = "nutrition" | "sustainability" | "habits" | "recipes" | "milestones";

/**
 * Challenge criteria structure (stored as JSONB in database)
 */
export interface ChallengeCriteria {
  metric: AchievementMetric | "nutrient_goal_days";
  target: number;
  period?: "week" | "month";
}

/**
 * Challenge definition from challenges table
 */
export interface Challenge {
  id: number;
  name: string;
  title: string;
  description: string | null;
  type: ChallengeType;
  category: ChallengeCategory;
  criteria: ChallengeCriteria;
  reward_achievement_id: number | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

/**
 * User's challenge participation from user_challenges table
 */
export interface UserChallenge {
  id: number;
  user_id: string;
  challenge_id: number;
  joined_at: string;
  progress: ChallengeProgress | null;
  completed_at: string | null;
  challenge?: Challenge;
}

/**
 * Challenge progress tracking
 */
export interface ChallengeProgress {
  current: number;
  target: number;
}

/**
 * Challenge with user participation status (for API responses)
 */
export interface ChallengeWithStatus extends Challenge {
  is_joined: boolean;
  progress?: ChallengeProgress;
  reward_achievement?: Achievement;
  days_remaining?: number;
}

/**
 * API response structure for GET /api/challenges
 */
export interface ChallengesResponse {
  active: ChallengeWithStatus[];
  joined: ChallengeWithStatus[];
  completed: ChallengeWithStatus[];
}

/**
 * API request structure for POST /api/challenges/join
 */
export interface ChallengeJoinRequest {
  challenge_id: number;
}

/**
 * API response structure for POST /api/challenges/join
 */
export interface ChallengeJoinResponse {
  success: boolean;
  user_challenge: UserChallenge;
  message: string;
}
