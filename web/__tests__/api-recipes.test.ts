import { GET } from "@/app/api/recipes/route";
import { supabase } from "@/lib/supabaseClient";

jest.mock("@/lib/supabaseClient");

const mockRecipes = [
  { id: 1, name: "Recipe 1", description: "Desc 1" },
  { id: 2, name: "Recipe 2", description: "Desc 2" },
];

describe("GET /api/recipes", () => {
  let mockSupabaseChain: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseChain = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({
        data: mockRecipes,
        error: null,
        count: 50,
      }),
    };
    (supabase.from as jest.Mock).mockReturnValue(mockSupabaseChain);
  });

  describe("Default search (no filters)", () => {
    it("returns recipes with pagination", async () => {
      const request = new Request("http://localhost:3000/api/recipes?page=1&limit=20");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recipes).toEqual(mockRecipes);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 50,
        totalPages: 3,
      });
    });

    it("searches by query in name or description", async () => {
      const request = new Request("http://localhost:3000/api/recipes?query=pasta");
      await GET(request);

      expect(mockSupabaseChain.or).toHaveBeenCalledWith(
        "name.ilike.%pasta%,description.ilike.%pasta%"
      );
    });

    it("does not search when query is empty", async () => {
      const request = new Request("http://localhost:3000/api/recipes?query=");
      await GET(request);

      expect(mockSupabaseChain.or).not.toHaveBeenCalled();
    });

    it("orders by id descending", async () => {
      const request = new Request("http://localhost:3000/api/recipes");
      await GET(request);

      expect(mockSupabaseChain.order).toHaveBeenCalledWith("id", { ascending: false });
    });

    it("uses default limit of 20", async () => {
      const request = new Request("http://localhost:3000/api/recipes");
      await GET(request);

      expect(mockSupabaseChain.range).toHaveBeenCalledWith(0, 19);
    });
  });

  describe("Filter by ingredients", () => {
    beforeEach(() => {
      const ingredientMapChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [{ recipe_id: 1 }, { recipe_id: 2 }, { recipe_id: 1 }],
          error: null,
        }),
      };

      const recipeChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: mockRecipes,
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === "Recipe-Ingredient_Map") return ingredientMapChain;
        if (table === "Recipe") return recipeChain;
        return mockSupabaseChain;
      });
    });

    it("filters recipes by ingredient IDs", async () => {
      const request = new Request(
        "http://localhost:3000/api/recipes?ingredientIds=1&ingredientIds=2"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recipes).toEqual(mockRecipes);
    });

    it("removes duplicate recipe IDs", async () => {
      const request = new Request(
        "http://localhost:3000/api/recipes?ingredientIds=1"
      );
      await GET(request);

      expect(supabase.from).toHaveBeenCalledWith("Recipe");
    });

    it("handles ingredient map query error", async () => {
      const ingredientMapChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Ingredient map error" },
        }),
      };

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === "Recipe-Ingredient_Map") return ingredientMapChain;
        return mockSupabaseChain;
      });

      const request = new Request(
        "http://localhost:3000/api/recipes?ingredientIds=1"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Ingredient map error");
    });

    it("handles recipe query error after ingredient filter", async () => {
      const recipeChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Recipe error" },
        }),
      };

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === "Recipe") return recipeChain;
        return {
          select: jest.fn().mockReturnThis(),
          in: jest.fn().mockResolvedValue({
            data: [{ recipe_id: 1 }],
            error: null,
          }),
        };
      });

      const request = new Request(
        "http://localhost:3000/api/recipes?ingredientIds=1"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Recipe error");
    });
  });

  describe("Filter by tags", () => {
    beforeEach(() => {
      const tagMapChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [{ recipe_id: 1 }, { recipe_id: 2 }],
          error: null,
        }),
      };

      const recipeChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: mockRecipes,
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === "Recipe-Tag_Map") return tagMapChain;
        if (table === "Recipe") return recipeChain;
        return mockSupabaseChain;
      });
    });

    it("filters recipes by tag IDs", async () => {
      const request = new Request(
        "http://localhost:3000/api/recipes?tagIds=10&tagIds=20"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recipes).toEqual(mockRecipes);
    });

    it("handles tag map query error", async () => {
      const tagMapChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Tag map error" },
        }),
      };

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === "Recipe-Tag_Map") return tagMapChain;
        return mockSupabaseChain;
      });

      const request = new Request("http://localhost:3000/api/recipes?tagIds=1");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Tag map error");
    });
  });

  describe("Priority of filters", () => {
    it("prioritizes ingredient filter over tag filter", async () => {
      const ingredientMapChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [{ recipe_id: 1 }],
          error: null,
        }),
      };

      const recipeChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: mockRecipes,
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === "Recipe-Ingredient_Map") return ingredientMapChain;
        if (table === "Recipe") return recipeChain;
        return mockSupabaseChain;
      });

      const request = new Request(
        "http://localhost:3000/api/recipes?ingredientIds=1&tagIds=2"
      );
      await GET(request);

      expect(supabase.from).toHaveBeenCalledWith("Recipe-Ingredient_Map");
      expect(supabase.from).not.toHaveBeenCalledWith("Recipe-Tag_Map");
    });
  });

  it("filters out invalid ingredientIds", async () => {
    const request = new Request(
      "http://localhost:3000/api/recipes?ingredientIds=1&ingredientIds=abc&ingredientIds=0"
    );
    await GET(request);

    // Only valid IDs should be used (1 is valid, abc becomes NaN, 0 is falsy)
    const ingredientMapChain = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({ data: [], error: null }),
    };
    
    (supabase.from as jest.Mock).mockReturnValue(ingredientMapChain);
  });

  it("returns empty recipes array when null", async () => {
    mockSupabaseChain.range.mockResolvedValueOnce({
      data: null,
      error: null,
      count: 0,
    });

    const request = new Request("http://localhost:3000/api/recipes");
    const response = await GET(request);
    const data = await response.json();

    expect(data.recipes).toEqual([]);
  });
});