import { RecipeDetail, Ingredient } from "@/types/data";

/**
 * Result of recipe matching calculation
 */
export interface RecipeMatchResult {
  /** Percentage of recipe ingredients available (0-100) */
  matchPercentage: number;
  /** List of available ingredient names */
  availableIngredients: string[];
  /** List of missing ingredient names */
  missingIngredients: string[];
  /** Number of available ingredients */
  availableCount: number;
  /** Total number of ingredients needed */
  totalCount: number;
  /** Whether all ingredients are available */
  isFullMatch: boolean;
  /** Whether at least half the ingredients are available */
  isPartialMatch: boolean;
}

/**
 * Calculate how many recipe ingredients are available in the inventory
 * @param recipeIngredients - Array of ingredients needed for the recipe
 * @param inventoryItems - Array of inventory items the user has
 * @returns RecipeMatchResult with match details
 */
export function calculateRecipeMatch(
  recipeIngredients: { ingredient_id: number; ingredient: Ingredient | null }[],
  inventoryItems: { ingredient_id: number; ingredient?: Ingredient | null }[]
): RecipeMatchResult {
  if (!recipeIngredients || recipeIngredients.length === 0) {
    return {
      matchPercentage: 100,
      availableIngredients: [],
      missingIngredients: [],
      availableCount: 0,
      totalCount: 0,
      isFullMatch: true,
      isPartialMatch: true,
    };
  }

  const inventoryIngredientIds = new Set(inventoryItems.map((item) => item.ingredient_id));

  const availableIngredients: string[] = [];
  const missingIngredients: string[] = [];

  for (const recipeIngredient of recipeIngredients) {
    const ingredientName = recipeIngredient.ingredient?.name || `Ingredient #${recipeIngredient.ingredient_id}`;

    if (inventoryIngredientIds.has(recipeIngredient.ingredient_id)) {
      availableIngredients.push(ingredientName);
    } else {
      missingIngredients.push(ingredientName);
    }
  }

  const totalCount = recipeIngredients.length;
  const availableCount = availableIngredients.length;
  const matchPercentage = Math.round((availableCount / totalCount) * 100);

  return {
    matchPercentage,
    availableIngredients,
    missingIngredients,
    availableCount,
    totalCount,
    isFullMatch: availableCount === totalCount,
    isPartialMatch: matchPercentage >= 50,
  };
}

/**
 * Calculate recipe match from a RecipeDetail object
 * @param recipe - The recipe detail object
 * @param inventoryItems - Array of inventory items
 * @returns RecipeMatchResult
 */
export function calculateRecipeMatchFromDetail(
  recipe: RecipeDetail,
  inventoryItems: { ingredient_id: number; ingredient?: Ingredient | null }[]
): RecipeMatchResult {
  const recipeIngredients = recipe.ingredients.map((ing) => ({
    ingredient_id: ing.ingredient.id,
    ingredient: ing.ingredient,
  }));

  return calculateRecipeMatch(recipeIngredients, inventoryItems);
}

/**
 * Get a label describing the match quality
 * @param matchPercentage - The match percentage (0-100)
 * @returns Human-readable label
 */
export function getMatchLabel(matchPercentage: number): string {
  if (matchPercentage === 100) {
    return "All ingredients available";
  }
  if (matchPercentage >= 75) {
    return "Most ingredients available";
  }
  if (matchPercentage >= 50) {
    return "Half ingredients available";
  }
  if (matchPercentage > 0) {
    return "Few ingredients available";
  }
  return "No ingredients available";
}

/**
 * Get color indicator for match percentage
 * @param matchPercentage - The match percentage (0-100)
 * @returns Color key for styling
 */
export function getMatchColor(matchPercentage: number): "green" | "yellow" | "orange" | "red" {
  if (matchPercentage >= 100) {
    return "green";
  }
  if (matchPercentage >= 75) {
    return "yellow";
  }
  if (matchPercentage >= 50) {
    return "orange";
  }
  return "red";
}

/**
 * Filter and sort recipes by ingredient availability
 * @param recipes - Array of recipe details
 * @param inventoryItems - Array of inventory items
 * @param minMatch - Minimum match percentage to include (default: 0)
 * @returns Sorted array of recipes with match results
 */
export function getRecipesByAvailability(
  recipes: RecipeDetail[],
  inventoryItems: { ingredient_id: number; ingredient?: Ingredient | null }[],
  minMatch: number = 0
): { recipe: RecipeDetail; match: RecipeMatchResult }[] {
  const recipesWithMatch = recipes.map((recipe) => ({
    recipe,
    match: calculateRecipeMatchFromDetail(recipe, inventoryItems),
  }));

  // Filter by minimum match
  const filtered = recipesWithMatch.filter((item) => item.match.matchPercentage >= minMatch);

  // Sort by match percentage (highest first)
  return filtered.sort((a, b) => b.match.matchPercentage - a.match.matchPercentage);
}

/**
 * Find recipes that can be made with only available ingredients
 * @param recipes - Array of recipe details
 * @param inventoryItems - Array of inventory items
 * @returns Array of recipes with 100% match
 */
export function getFullMatchRecipes(
  recipes: RecipeDetail[],
  inventoryItems: { ingredient_id: number; ingredient?: Ingredient | null }[]
): { recipe: RecipeDetail; match: RecipeMatchResult }[] {
  return getRecipesByAvailability(recipes, inventoryItems, 100);
}

/**
 * Calculate coverage score (0-1) for AI recommendation API
 * @param recipeIngredients - Recipe ingredients
 * @param inventoryItems - Inventory items
 * @returns Coverage score between 0 and 1
 */
export function calculateCoverageScore(
  recipeIngredients: { ingredient_id: number }[],
  inventoryItems: { ingredient_id: number }[]
): number {
  if (!recipeIngredients || recipeIngredients.length === 0) {
    return 1;
  }

  const inventoryIds = new Set(inventoryItems.map((i) => i.ingredient_id));
  const matchCount = recipeIngredients.filter((ri) => inventoryIds.has(ri.ingredient_id)).length;

  return matchCount / recipeIngredients.length;
}
