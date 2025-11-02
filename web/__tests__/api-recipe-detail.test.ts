import { GET } from "@/app/api/recipes/[id]/route";
import { supabase } from "@/lib/supabaseClient";

jest.mock("@/lib/supabaseClient");

describe("GET /api/recipes/[id]", () => {
  const mockRecipe = {
    id: 1,
    name: "Spaghetti Carbonara",
    description: "Classic Italian pasta",
    image_url: "https://example.com/carbonara.jpg",
    min_prep_time: 30,
    green_score: 85,
    created_at: "2024-01-01",
    updated_at: null,
  };

  const mockIngredients = [
    {
      relative_unit_100: 100,
      ingredient: {
        id: 1,
        name: "Spaghetti",
        unit: "100g",
        agg_fats_g: 1.5,
        agg_minerals_mg: 50,
        agg_vit_b_mg: 2,
        calories_kcal: 150,
        carbs_g: 30,
        cholesterol_mg: 0,
        protein_g: 5,
        sugars_g: 2,
        vit_a_microg: 0,
        vit_c_mg: 0,
        vit_d_microg: 0,
        vit_e_mg: 0,
        vit_k_microg: 0,
      },
    },
    {
      relative_unit_100: 50,
      ingredient: {
        id: 2,
        name: "Egg",
        unit: "1 large",
        agg_fats_g: 5,
        agg_minerals_mg: 30,
        agg_vit_b_mg: 1,
        calories_kcal: 70,
        carbs_g: 0.5,
        cholesterol_mg: 186,
        protein_g: 6,
        sugars_g: 0.5,
        vit_a_microg: 80,
        vit_c_mg: 0,
        vit_d_microg: 2,
        vit_e_mg: 1,
        vit_k_microg: 0,
      },
    },
  ];

  const mockTags = [
    { tag: { id: 1, name: "Italian", description: "Italian cuisine" } },
    { tag: { id: 2, name: "Pasta", description: "Pasta dishes" } },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns recipe detail with ingredients, tags, and nutrients", async () => {
    const recipeChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockRecipe,
        error: null,
      }),
    };

    const ingredientChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: mockIngredients,
        error: null,
      }),
    };

    const tagChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: mockTags,
        error: null,
      }),
    };

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "Recipe") return recipeChain;
      if (table === "Recipe-Ingredient_Map") return ingredientChain;
      if (table === "Recipe-Tag_Map") return tagChain;
    });

    const request = new Request("http://localhost:3000/api/recipes/1");
    const context = { params: Promise.resolve({ id: "1" }) };
    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.recipe).toEqual(mockRecipe);
    expect(data.ingredients).toHaveLength(2);
    expect(data.tags).toEqual(mockTags);
    expect(data.sumNutrients).toBeDefined();
  });

  it("calculates sum nutrients correctly", async () => {
    const recipeChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockRecipe,
        error: null,
      }),
    };

    const ingredientChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: mockIngredients,
        error: null,
      }),
    };

    const tagChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: mockTags,
        error: null,
      }),
    };

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "Recipe") return recipeChain;
      if (table === "Recipe-Ingredient_Map") return ingredientChain;
      if (table === "Recipe-Tag_Map") return tagChain;
    });

    const request = new Request("http://localhost:3000/api/recipes/1");
    const context = { params: Promise.resolve({ id: "1" }) };
    const response = await GET(request, context);
    const data = await response.json();

    // Ingredient 1: 100% * values = values
    // Ingredient 2: 50% * values = half values
    expect(data.sumNutrients.calories_kcal).toBe(185); // 150 + (70 * 0.5)
    expect(data.sumNutrients.protein_g).toBe(8); // 5 + (6 * 0.5)
    expect(data.sumNutrients.cholesterol_mg).toBe(93); // 0 + (186 * 0.5)
  });

  it("returns 404 when recipe not found", async () => {
    const recipeChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      }),
    };

    (supabase.from as jest.Mock).mockReturnValue(recipeChain);

    const request = new Request("http://localhost:3000/api/recipes/999");
    const context = { params: Promise.resolve({ id: "999" }) };
    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Recipe not found");
    expect(data.id).toBe(999);
  });

  it("handles recipe error", async () => {
    const recipeChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      }),
    };

    (supabase.from as jest.Mock).mockReturnValue(recipeChain);

    const request = new Request("http://localhost:3000/api/recipes/1");
    const context = { params: Promise.resolve({ id: "1" }) };
    const response = await GET(request, context);

    expect(response.status).toBe(404);
  });

  it("handles array ingredient data correctly", async () => {
    const ingredientsWithArray = [
      {
        relative_unit_100: 100,
        ingredient: [mockIngredients[0].ingredient], // Wrapped in array
      },
    ];

    const recipeChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockRecipe,
        error: null,
      }),
    };

    const ingredientChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: ingredientsWithArray,
        error: null,
      }),
    };

    const tagChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "Recipe") return recipeChain;
      if (table === "Recipe-Ingredient_Map") return ingredientChain;
      if (table === "Recipe-Tag_Map") return tagChain;
    });

    const request = new Request("http://localhost:3000/api/recipes/1");
    const context = { params: Promise.resolve({ id: "1" }) };
    const response = await GET(request, context);
    const data = await response.json();

    expect(data.ingredients[0].ingredient).toEqual(mockIngredients[0].ingredient);
  });

  it("handles null nutrients gracefully", async () => {
    const ingredientsWithNulls = [
      {
        relative_unit_100: null,
        ingredient: {
          ...mockIngredients[0].ingredient,
          calories_kcal: null,
          protein_g: null,
        },
      },
    ];

    const recipeChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockRecipe,
        error: null,
      }),
    };

    const ingredientChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: ingredientsWithNulls,
        error: null,
      }),
    };

    const tagChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "Recipe") return recipeChain;
      if (table === "Recipe-Ingredient_Map") return ingredientChain;
      if (table === "Recipe-Tag_Map") return tagChain;
    });

    const request = new Request("http://localhost:3000/api/recipes/1");
    const context = { params: Promise.resolve({ id: "1" }) };
    const response = await GET(request, context);
    const data = await response.json();

    expect(data.sumNutrients.calories_kcal).toBe(0);
    expect(data.sumNutrients.protein_g).toBe(0);
  });

  it("converts string id to number", async () => {
    const recipeChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockRecipe,
        error: null,
      }),
    };

    const ingredientChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    const tagChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "Recipe") return recipeChain;
      if (table === "Recipe-Ingredient_Map") return ingredientChain;
      if (table === "Recipe-Tag_Map") return tagChain;
    });

    const request = new Request("http://localhost:3000/api/recipes/42");
    const context = { params: Promise.resolve({ id: "42" }) };
    await GET(request, context);

    expect(recipeChain.eq).toHaveBeenCalledWith("id", 42);
  });

  it("initializes all nutrient fields in sumNutrients", async () => {
    const recipeChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockRecipe,
        error: null,
      }),
    };

    const ingredientChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    const tagChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "Recipe") return recipeChain;
      if (table === "Recipe-Ingredient_Map") return ingredientChain;
      if (table === "Recipe-Tag_Map") return tagChain;
    });

    const request = new Request("http://localhost:3000/api/recipes/1");
    const context = { params: Promise.resolve({ id: "1" }) };
    const response = await GET(request, context);
    const data = await response.json();

    expect(data.sumNutrients).toHaveProperty("agg_fats_g", 0);
    expect(data.sumNutrients).toHaveProperty("agg_minerals_mg", 0);
    expect(data.sumNutrients).toHaveProperty("agg_vit_b_mg", 0);
    expect(data.sumNutrients).toHaveProperty("calories_kcal", 0);
    expect(data.sumNutrients).toHaveProperty("carbs_g", 0);
    expect(data.sumNutrients).toHaveProperty("cholesterol_mg", 0);
    expect(data.sumNutrients).toHaveProperty("protein_g", 0);
    expect(data.sumNutrients).toHaveProperty("sugars_g", 0);
    expect(data.sumNutrients).toHaveProperty("vit_a_microg", 0);
    expect(data.sumNutrients).toHaveProperty("vit_c_mg", 0);
    expect(data.sumNutrients).toHaveProperty("vit_d_microg", 0);
  });
});