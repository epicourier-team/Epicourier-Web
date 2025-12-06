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

// Streak System Types (v1.2.0 Extended)

/**
 * Types of streaks that can be tracked
 */
export type StreakType = "daily_log" | "nutrient_goal" | "green_recipe";

/**
 * Streak history record from streak_history table
 */
export interface StreakHistory {
  id: number;
  user_id: string;
  streak_type: StreakType;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Streak data for display in UI
 */
export interface StreakData {
  type: StreakType;
  label: string;
  current: number;
  longest: number;
  lastActivity: string | null;
  isActiveToday: boolean;
}

/**
 * API response structure for GET /api/streaks
 */
export interface StreaksResponse {
  streaks: StreakData[];
  totalCurrentStreak: number;
  message?: string;
}

/**
 * API request structure for POST /api/streaks/update
 */
export interface StreakUpdateRequest {
  streak_type: StreakType;
  activity_date?: string; // YYYY-MM-DD format, defaults to today
}

/**
 * API response structure for POST /api/streaks/update
 */
export interface StreakUpdateResponse {
  success: boolean;
  streak: StreakHistory;
  message: string;
}

// ============================================================================
// Smart Cart Types (v1.3.0)
// ============================================================================

// --- Shopping List Types ---

/**
 * Shopping list metadata
 */
export interface ShoppingList {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Shopping list with computed properties for UI
 */
export interface ShoppingListWithStats extends ShoppingList {
  item_count: number;
  checked_count: number;
  progress_percentage: number;
}

/**
 * Request payload for creating a shopping list
 */
export interface CreateShoppingListRequest {
  name: string;
  description?: string;
}

/**
 * Request payload for updating a shopping list
 */
export interface UpdateShoppingListRequest {
  name?: string;
  description?: string;
  is_archived?: boolean;
}

// --- Shopping List Item Types ---

/**
 * Category options for shopping list items
 */
export type ShoppingItemCategory =
  | "Produce"
  | "Dairy"
  | "Meat"
  | "Seafood"
  | "Bakery"
  | "Frozen"
  | "Pantry"
  | "Beverages"
  | "Snacks"
  | "Condiments"
  | "Other";

/**
 * Individual item in a shopping list
 */
export interface ShoppingListItem {
  id: string;
  shopping_list_id: string;
  ingredient_id: number | null;
  item_name: string;
  quantity: number;
  unit: string | null;
  category: ShoppingItemCategory | string;
  is_checked: boolean;
  position: number;
  notes: string | null;
  created_at: string;
}

/**
 * Shopping list item with ingredient details (for display)
 */
export interface ShoppingListItemWithIngredient extends ShoppingListItem {
  ingredient?: Ingredient | null;
}

/**
 * Request payload for creating a shopping list item
 */
export interface CreateShoppingListItemRequest {
  shopping_list_id: string;
  item_name: string;
  ingredient_id?: number;
  quantity?: number;
  unit?: string;
  category?: ShoppingItemCategory | string;
  notes?: string;
}

/**
 * Request payload for updating a shopping list item
 */
export interface UpdateShoppingListItemRequest {
  item_name?: string;
  quantity?: number;
  unit?: string;
  category?: ShoppingItemCategory | string;
  is_checked?: boolean;
  position?: number;
  notes?: string;
}

/**
 * Request payload for batch updating item positions (drag-and-drop)
 */
export interface UpdateItemPositionsRequest {
  items: { id: string; position: number }[];
}

// --- User Inventory Types ---

/**
 * Storage location options for inventory items
 */
export type InventoryLocation = "pantry" | "fridge" | "freezer" | "other";

/**
 * Expiration status for inventory items
 */
export type ExpirationStatus =
  | "expired"
  | "critical" // 0-2 days
  | "warning" // 3-7 days
  | "good" // > 7 days
  | "unknown"; // no expiration date

/**
 * User inventory item
 */
export interface InventoryItem {
  id: string;
  user_id: string;
  ingredient_id: number;
  quantity: number;
  unit: string | null;
  location: InventoryLocation;
  expiration_date: string | null; // YYYY-MM-DD format
  min_quantity: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Inventory item with ingredient details and computed properties
 */
export interface InventoryItemWithDetails extends InventoryItem {
  ingredient: Ingredient;
  expiration_status: ExpirationStatus;
  days_until_expiration: number | null;
  is_low_stock: boolean;
}

/**
 * Request payload for creating an inventory item
 */
export interface CreateInventoryItemRequest {
  ingredient_id: number;
  quantity: number;
  unit?: string;
  location?: InventoryLocation;
  expiration_date?: string;
  min_quantity?: number;
  notes?: string;
}

/**
 * Request payload for updating an inventory item
 */
export interface UpdateInventoryItemRequest {
  quantity?: number;
  unit?: string;
  location?: InventoryLocation;
  expiration_date?: string | null;
  min_quantity?: number | null;
  notes?: string;
}

/**
 * Request payload for transferring shopping list items to inventory
 */
export interface TransferToInventoryRequest {
  shopping_item_id: string;
  ingredient_id: number;
  quantity: number;
  unit?: string;
  location?: InventoryLocation;
  expiration_date?: string;
}

// --- Inventory API Response Types ---

/**
 * Summary of user's inventory for dashboard widget
 */
export interface InventorySummary {
  total_items: number;
  expiring_soon: number; // items expiring within 7 days
  expired: number;
  low_stock: number;
  by_location: {
    pantry: number;
    fridge: number;
    freezer: number;
    other: number;
  };
}

/**
 * API response for GET /api/inventory
 */
export interface InventoryResponse {
  items: InventoryItemWithDetails[];
  summary: InventorySummary;
}

// --- AI Recipe Recommendation Types (from Inventory) ---

/**
 * Inventory item payload for AI recommendation request
 */
export interface InventoryItemForRecommendation {
  ingredient_id: number;
  quantity?: number;
  expiration_date?: string;
}

/**
 * Request payload for POST /inventory-recommend (Python API)
 */
export interface InventoryRecommendRequest {
  inventory: InventoryItemForRecommendation[];
  preferences?: string;
  num_recipes?: number;
}

/**
 * Expiring ingredient info in recommendation response
 */
export interface ExpiringIngredientInfo {
  name: string;
  expires_in_days: number;
}

/**
 * Individual recipe recommendation from inventory
 */
export interface InventoryRecipeRecommendation {
  recipe_id: number;
  recipe_name: string;
  recipe_image?: string;
  coverage_score: number; // 0-1, percentage of ingredients available
  missing_ingredients: string[];
  uses_expiring: ExpiringIngredientInfo[];
  reasoning: string;
}

/**
 * Response from POST /inventory-recommend (Python API)
 */
export interface InventoryRecommendResponse {
  recipes: InventoryRecipeRecommendation[];
  summary: string;
}

// --- Smart Cart Dashboard Widget Types ---

/**
 * Active shopping list summary for dashboard widget
 */
export interface ActiveListSummary {
  id: string;
  name: string;
  item_count: number;
  checked_count: number;
  next_items: string[]; // top 3 unchecked items
}

/**
 * Inventory alerts for dashboard widget
 */
export interface InventoryAlerts {
  expiring_soon: number;
  expired: number;
  low_stock: number;
}

/**
 * Suggested action for smart cart widget
 */
export interface SuggestedAction {
  type: "use_expiring" | "complete_shopping" | "restock" | "none";
  title: string;
  description: string;
  action_label: string;
  action_href: string;
}

/**
 * Complete smart cart widget data for dashboard
 */
export interface SmartCartWidgetData {
  active_list: ActiveListSummary | null;
  inventory_alerts: InventoryAlerts;
  suggested_action: SuggestedAction | null;
}
