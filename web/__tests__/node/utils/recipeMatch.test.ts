import {
  calculateRecipeMatch,
  calculateRecipeMatchFromDetail,
  getMatchLabel,
  getMatchColor,
  getRecipesByAvailability,
  getFullMatchRecipes,
  calculateCoverageScore,
} from "@/utils/inventory/recipeMatch";
import { RecipeDetail, Ingredient } from "@/types/data";

// Helper to create mock ingredients
const createMockIngredient = (id: number, name: string): Ingredient => ({
  id,
  name,
  unit: "g",
  created_at: "2024-01-01",
  calories_kcal: null,
  protein_g: null,
  carbs_g: null,
  agg_fats_g: null,
  agg_minerals_mg: null,
  agg_vit_b_mg: null,
  cholesterol_mg: null,
  sugars_g: null,
  vit_a_microg: null,
  vit_c_mg: null,
  vit_d_microg: null,
  vit_e_mg: null,
  vit_k_microg: null,
});

// Helper to create mock recipe detail
const createMockRecipeDetail = (
  id: number,
  name: string,
  ingredientIds: number[]
): RecipeDetail => ({
  recipe: {
    id,
    name,
    description: null,
    image_url: null,
    min_prep_time: 30,
    green_score: 80,
    created_at: "2024-01-01",
    updated_at: null,
    owner_id: null,
  },
  ingredients: ingredientIds.map((ingId) => ({
    id: ingId,
    relative_unit_100: 100,
    ingredient: createMockIngredient(ingId, `Ingredient ${ingId}`),
  })),
  tags: [],
  sumNutrients: {
    calories_kcal: null,
    protein_g: null,
    carbs_g: null,
    agg_fats_g: null,
    agg_minerals_mg: null,
    agg_vit_b_mg: null,
    cholesterol_mg: null,
    sugars_g: null,
    vit_a_microg: null,
    vit_c_mg: null,
    vit_d_microg: null,
    vit_e_mg: null,
    vit_k_microg: null,
  },
});

describe("calculateRecipeMatch", () => {
  it("returns 100% when all ingredients available", () => {
    const recipeIngredients = [
      { ingredient_id: 1, ingredient: createMockIngredient(1, "Salt") },
      { ingredient_id: 2, ingredient: createMockIngredient(2, "Pepper") },
      { ingredient_id: 3, ingredient: createMockIngredient(3, "Oil") },
    ];

    const inventoryItems = [
      { ingredient_id: 1 },
      { ingredient_id: 2 },
      { ingredient_id: 3 },
      { ingredient_id: 4 }, // extra item
    ];

    const result = calculateRecipeMatch(recipeIngredients, inventoryItems);

    expect(result.matchPercentage).toBe(100);
    expect(result.availableCount).toBe(3);
    expect(result.totalCount).toBe(3);
    expect(result.isFullMatch).toBe(true);
    expect(result.isPartialMatch).toBe(true);
    expect(result.missingIngredients).toEqual([]);
  });

  it("returns correct percentage for partial match", () => {
    const recipeIngredients = [
      { ingredient_id: 1, ingredient: createMockIngredient(1, "Salt") },
      { ingredient_id: 2, ingredient: createMockIngredient(2, "Pepper") },
      { ingredient_id: 3, ingredient: createMockIngredient(3, "Oil") },
      { ingredient_id: 4, ingredient: createMockIngredient(4, "Garlic") },
    ];

    const inventoryItems = [{ ingredient_id: 1 }, { ingredient_id: 3 }];

    const result = calculateRecipeMatch(recipeIngredients, inventoryItems);

    expect(result.matchPercentage).toBe(50);
    expect(result.availableCount).toBe(2);
    expect(result.totalCount).toBe(4);
    expect(result.isFullMatch).toBe(false);
    expect(result.isPartialMatch).toBe(true);
  });

  it("identifies missing ingredients correctly", () => {
    const recipeIngredients = [
      { ingredient_id: 1, ingredient: createMockIngredient(1, "Salt") },
      { ingredient_id: 2, ingredient: createMockIngredient(2, "Pepper") },
      { ingredient_id: 3, ingredient: createMockIngredient(3, "Oil") },
    ];

    const inventoryItems = [{ ingredient_id: 1 }];

    const result = calculateRecipeMatch(recipeIngredients, inventoryItems);

    expect(result.missingIngredients).toEqual(["Pepper", "Oil"]);
    expect(result.availableIngredients).toEqual(["Salt"]);
  });

  it("returns 0% when no ingredients available", () => {
    const recipeIngredients = [
      { ingredient_id: 1, ingredient: createMockIngredient(1, "Salt") },
      { ingredient_id: 2, ingredient: createMockIngredient(2, "Pepper") },
    ];

    const inventoryItems = [{ ingredient_id: 10 }, { ingredient_id: 20 }];

    const result = calculateRecipeMatch(recipeIngredients, inventoryItems);

    expect(result.matchPercentage).toBe(0);
    expect(result.isFullMatch).toBe(false);
    expect(result.isPartialMatch).toBe(false);
  });

  it("handles empty recipe ingredients", () => {
    const result = calculateRecipeMatch([], [{ ingredient_id: 1 }]);

    expect(result.matchPercentage).toBe(100);
    expect(result.totalCount).toBe(0);
    expect(result.isFullMatch).toBe(true);
  });

  it("handles empty inventory", () => {
    const recipeIngredients = [
      { ingredient_id: 1, ingredient: createMockIngredient(1, "Salt") },
    ];

    const result = calculateRecipeMatch(recipeIngredients, []);

    expect(result.matchPercentage).toBe(0);
    expect(result.missingIngredients).toEqual(["Salt"]);
  });

  it("uses ingredient ID when name is not available", () => {
    const recipeIngredients = [{ ingredient_id: 42, ingredient: null }];

    const inventoryItems: { ingredient_id: number }[] = [];

    const result = calculateRecipeMatch(recipeIngredients, inventoryItems);

    expect(result.missingIngredients).toEqual(["Ingredient #42"]);
  });

  it("rounds match percentage to nearest integer", () => {
    const recipeIngredients = [
      { ingredient_id: 1, ingredient: createMockIngredient(1, "A") },
      { ingredient_id: 2, ingredient: createMockIngredient(2, "B") },
      { ingredient_id: 3, ingredient: createMockIngredient(3, "C") },
    ];

    const inventoryItems = [{ ingredient_id: 1 }];

    const result = calculateRecipeMatch(recipeIngredients, inventoryItems);

    expect(result.matchPercentage).toBe(33); // 33.33... rounds to 33
  });
});

describe("calculateRecipeMatchFromDetail", () => {
  it("calculates match from RecipeDetail object", () => {
    const recipe = createMockRecipeDetail(1, "Test Recipe", [1, 2, 3]);
    const inventoryItems = [{ ingredient_id: 1 }, { ingredient_id: 2 }];

    const result = calculateRecipeMatchFromDetail(recipe, inventoryItems);

    expect(result.matchPercentage).toBe(67);
    expect(result.availableCount).toBe(2);
    expect(result.totalCount).toBe(3);
  });
});

describe("getMatchLabel", () => {
  it("returns correct label for 100%", () => {
    expect(getMatchLabel(100)).toBe("All ingredients available");
  });

  it("returns correct label for 75-99%", () => {
    expect(getMatchLabel(75)).toBe("Most ingredients available");
    expect(getMatchLabel(90)).toBe("Most ingredients available");
  });

  it("returns correct label for 50-74%", () => {
    expect(getMatchLabel(50)).toBe("Half ingredients available");
    expect(getMatchLabel(60)).toBe("Half ingredients available");
  });

  it("returns correct label for 1-49%", () => {
    expect(getMatchLabel(25)).toBe("Few ingredients available");
    expect(getMatchLabel(1)).toBe("Few ingredients available");
  });

  it("returns correct label for 0%", () => {
    expect(getMatchLabel(0)).toBe("No ingredients available");
  });
});

describe("getMatchColor", () => {
  it("returns green for 100%", () => {
    expect(getMatchColor(100)).toBe("green");
  });

  it("returns yellow for 75-99%", () => {
    expect(getMatchColor(75)).toBe("yellow");
    expect(getMatchColor(99)).toBe("yellow");
  });

  it("returns orange for 50-74%", () => {
    expect(getMatchColor(50)).toBe("orange");
    expect(getMatchColor(74)).toBe("orange");
  });

  it("returns red for 0-49%", () => {
    expect(getMatchColor(0)).toBe("red");
    expect(getMatchColor(49)).toBe("red");
  });
});

describe("getRecipesByAvailability", () => {
  it("sorts recipes by match percentage (highest first)", () => {
    const recipes = [
      createMockRecipeDetail(1, "Recipe A", [1, 2, 3]), // 33% match
      createMockRecipeDetail(2, "Recipe B", [1]), // 100% match
      createMockRecipeDetail(3, "Recipe C", [1, 2]), // 50% match
    ];

    const inventoryItems = [{ ingredient_id: 1 }];

    const result = getRecipesByAvailability(recipes, inventoryItems);

    expect(result[0].recipe.recipe.id).toBe(2); // 100%
    expect(result[1].recipe.recipe.id).toBe(3); // 50%
    expect(result[2].recipe.recipe.id).toBe(1); // 33%
  });

  it("filters by minimum match percentage", () => {
    const recipes = [
      createMockRecipeDetail(1, "Recipe A", [1, 2, 3, 4]), // 25% match
      createMockRecipeDetail(2, "Recipe B", [1]), // 100% match
      createMockRecipeDetail(3, "Recipe C", [1, 2]), // 50% match
    ];

    const inventoryItems = [{ ingredient_id: 1 }];

    const result = getRecipesByAvailability(recipes, inventoryItems, 50);

    expect(result.length).toBe(2);
    expect(result[0].recipe.recipe.id).toBe(2);
    expect(result[1].recipe.recipe.id).toBe(3);
  });

  it("returns empty array when no recipes meet minimum", () => {
    const recipes = [createMockRecipeDetail(1, "Recipe A", [1, 2, 3, 4])];

    const inventoryItems = [{ ingredient_id: 1 }];

    const result = getRecipesByAvailability(recipes, inventoryItems, 50);

    expect(result).toEqual([]);
  });
});

describe("getFullMatchRecipes", () => {
  it("returns only recipes with 100% match", () => {
    const recipes = [
      createMockRecipeDetail(1, "Recipe A", [1, 2]), // partial match
      createMockRecipeDetail(2, "Recipe B", [1]), // full match
      createMockRecipeDetail(3, "Recipe C", [1, 3]), // full match
    ];

    const inventoryItems = [{ ingredient_id: 1 }, { ingredient_id: 3 }];

    const result = getFullMatchRecipes(recipes, inventoryItems);

    expect(result.length).toBe(2);
    expect(result.map((r) => r.recipe.recipe.id).sort()).toEqual([2, 3]);
  });
});

describe("calculateCoverageScore", () => {
  it("returns 1 for 100% coverage", () => {
    const recipeIngredients = [{ ingredient_id: 1 }, { ingredient_id: 2 }];
    const inventoryItems = [{ ingredient_id: 1 }, { ingredient_id: 2 }];

    expect(calculateCoverageScore(recipeIngredients, inventoryItems)).toBe(1);
  });

  it("returns 0.5 for 50% coverage", () => {
    const recipeIngredients = [{ ingredient_id: 1 }, { ingredient_id: 2 }];
    const inventoryItems = [{ ingredient_id: 1 }];

    expect(calculateCoverageScore(recipeIngredients, inventoryItems)).toBe(0.5);
  });

  it("returns 0 for no coverage", () => {
    const recipeIngredients = [{ ingredient_id: 1 }, { ingredient_id: 2 }];
    const inventoryItems = [{ ingredient_id: 3 }];

    expect(calculateCoverageScore(recipeIngredients, inventoryItems)).toBe(0);
  });

  it("returns 1 for empty recipe ingredients", () => {
    expect(calculateCoverageScore([], [{ ingredient_id: 1 }])).toBe(1);
  });
});
