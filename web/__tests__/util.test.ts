import { getRecipeDetail } from "@/lib/utils";
import type { SupabaseClient } from "@supabase/supabase-js";

const mockClient = {
  from: jest.fn((table: string) => {
    switch (table) {
      case "Recipe":
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 1, name: "Mock Recipe" },
              error: null,
            }),
          }),
        };

      case "Recipe-Ingredient_Map":
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({
            data: [
              {
                relative_unit_100: 100,
                ingredient: {
                  id: 10,
                  name: "Mock Ingredient",
                  calories_kcal: 100,
                  protein_g: 5,
                  carbs_g: 10,
                  agg_fats_g: 2,
                },
              },
            ],
          }),
        };

      case "Recipe-Tag_Map":
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({
            data: [
              {
                tag: { id: 20, name: "Mock Tag", description: "Sample" },
              },
            ],
          }),
        };

      default:
        throw new Error(`Unexpected table: ${table}`);
    }
  }),
} as unknown as SupabaseClient;

describe("getRecipeDetail", () => {
  it("returns full recipe detail when all data exist", async () => {
    const result = await getRecipeDetail("1", mockClient);
    expect(result).not.toBeNull();
    expect(result?.recipe.id).toBe(1);
    expect(result?.ingredients[0].ingredient.name).toBe("Mock Ingredient");
    expect(result?.tags[0].tag.name).toBe("Mock Tag");
  });

  it("returns null when recipe not found", async () => {
    (mockClient.from as jest.Mock).mockImplementationOnce(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: null, error: true }),
      }),
    }));
    const result = await getRecipeDetail("999", mockClient);
    expect(result).toBeNull();
  });
});
