/**
 * @jest-environment node
 */

import { GET, POST } from "@/app/api/shopping-lists/route";
import { GET as GET_BY_ID, PUT, DELETE } from "@/app/api/shopping-lists/[id]/route";
import { POST as GENERATE } from "@/app/api/shopping-lists/generate/route";
import { createClient } from "@/utils/supabase/server";
import { NextRequest } from "next/server";

jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

// Types
type ShoppingList = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

type ShoppingListItem = {
  id: string;
  shopping_list_id: string;
  ingredient_id: number | null;
  item_name: string;
  quantity: number;
  unit: string | null;
  category: string;
  is_checked: boolean;
  position: number;
  notes: string | null;
  created_at: string;
};

// Mock data factory
const mockUser = { id: "user-123", email: "test@example.com" };

const createMockShoppingList = (overrides: Partial<ShoppingList> = {}): ShoppingList => ({
  id: "list-1",
  user_id: mockUser.id,
  name: "Weekly Groceries",
  description: "Shopping for the week",
  is_archived: false,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

const createMockItem = (overrides: Partial<ShoppingListItem> = {}): ShoppingListItem => ({
  id: "item-1",
  shopping_list_id: "list-1",
  ingredient_id: 101,
  item_name: "Tomatoes",
  quantity: 2,
  unit: "kg",
  category: "Produce",
  is_checked: false,
  position: 0,
  notes: null,
  created_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

describe("Shopping Lists API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/shopping-lists", () => {
    it("should return 401 if user is not authenticated", async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error("Not authenticated"),
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe("Unauthorized");
    });

    it("should return shopping lists with stats for authenticated user", async () => {
      // Mock data with nested shopping_list_items (as Supabase returns with JOIN)
      const mockListsWithItems = [
        {
          ...createMockShoppingList({ id: "list-1", name: "Weekly" }),
          shopping_list_items: [
            { id: "item-1", is_checked: false },
            { id: "item-2", is_checked: true },
          ],
        },
        {
          ...createMockShoppingList({ id: "list-2", name: "Party", is_archived: true }),
          shopping_list_items: [{ id: "item-3", is_checked: false }],
        },
      ];

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({ data: mockListsWithItems, error: null }),
              }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toHaveLength(2);
      expect(json[0].name).toBe("Weekly");
      expect(json[0].item_count).toBe(2);
      expect(json[0].checked_count).toBe(1);
      expect(json[0].progress_percentage).toBe(50);
    });

    it("should return empty array if no shopping lists exist", async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual([]);
    });
  });

  describe("POST /api/shopping-lists", () => {
    it("should return 401 if user is not authenticated", async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error("Not authenticated"),
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = new NextRequest("http://localhost/api/shopping-lists", {
        method: "POST",
        body: JSON.stringify({ name: "Test List" }),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it("should return 400 if name is missing", async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = new NextRequest("http://localhost/api/shopping-lists", {
        method: "POST",
        body: JSON.stringify({ description: "No name provided" }),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe("Name is required");
    });

    it("should create a new shopping list", async () => {
      const newList = createMockShoppingList({ name: "New List" });

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: newList, error: null }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = new NextRequest("http://localhost/api/shopping-lists", {
        method: "POST",
        body: JSON.stringify({ name: "New List", description: "Test description" }),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.name).toBe("New List");
    });
  });

  describe("GET /api/shopping-lists/[id]", () => {
    it("should return 401 if user is not authenticated", async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error("Not authenticated"),
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const response = await GET_BY_ID(
        new NextRequest("http://localhost/api/shopping-lists/list-1"),
        { params: Promise.resolve({ id: "list-1" }) }
      );
      expect(response.status).toBe(401);
    });

    it("should return 404 if shopping list not found", async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: "PGRST116", message: "not found" },
                }),
              }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const response = await GET_BY_ID(
        new NextRequest("http://localhost/api/shopping-lists/nonexistent"),
        { params: Promise.resolve({ id: "nonexistent" }) }
      );
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error).toBe("Shopping list not found");
    });

    it("should return shopping list with items", async () => {
      const mockItems = [
        createMockItem({ item_name: "Tomatoes", category: "Produce", position: 0 }),
        createMockItem({ id: "item-2", item_name: "Milk", category: "Dairy", position: 1 }),
      ];
      // Mock returns list with nested shopping_list_items (JOIN result)
      const mockListWithItems = {
        ...createMockShoppingList(),
        shopping_list_items: mockItems,
      };

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockListWithItems, error: null }),
              }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const response = await GET_BY_ID(
        new NextRequest("http://localhost/api/shopping-lists/list-1"),
        { params: Promise.resolve({ id: "list-1" }) }
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.name).toBe("Weekly Groceries");
      expect(json.shopping_list_items).toHaveLength(2);
    });
  });

  describe("PUT /api/shopping-lists/[id]", () => {
    it("should update shopping list name", async () => {
      const updatedList = createMockShoppingList({ name: "Updated Name" });

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: updatedList, error: null }),
                }),
              }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = new NextRequest("http://localhost/api/shopping-lists/list-1", {
        method: "PUT",
        body: JSON.stringify({ name: "Updated Name" }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: "list-1" }) });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.name).toBe("Updated Name");
    });

    it("should archive a shopping list", async () => {
      const archivedList = createMockShoppingList({ is_archived: true });

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: archivedList, error: null }),
                }),
              }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = new NextRequest("http://localhost/api/shopping-lists/list-1", {
        method: "PUT",
        body: JSON.stringify({ is_archived: true }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: "list-1" }) });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.is_archived).toBe(true);
    });
  });

  describe("DELETE /api/shopping-lists/[id]", () => {
    it("should delete a shopping list", async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const response = await DELETE(
        new NextRequest("http://localhost/api/shopping-lists/list-1", { method: "DELETE" }),
        { params: Promise.resolve({ id: "list-1" }) }
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
    });
  });

  describe("POST /api/shopping-lists/generate", () => {
    it("should return 401 if user is not authenticated", async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error("Not authenticated"),
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = new NextRequest("http://localhost/api/shopping-lists/generate", {
        method: "POST",
        body: JSON.stringify({
          startDate: "2024-01-01",
          endDate: "2024-01-07",
        }),
      });

      const response = await GENERATE(request);
      expect(response.status).toBe(401);
    });

    it("should return 400 if startDate or endDate is missing", async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = new NextRequest("http://localhost/api/shopping-lists/generate", {
        method: "POST",
        body: JSON.stringify({ name: "Test List" }),
      });

      const response = await GENERATE(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe("startDate and endDate are required");
    });

    it("should return 404 if user profile not found", async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: "PGRST116", message: "not found" },
              }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = new NextRequest("http://localhost/api/shopping-lists/generate", {
        method: "POST",
        body: JSON.stringify({
          startDate: "2024-01-01",
          endDate: "2024-01-07",
        }),
      });

      const response = await GENERATE(request);
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error).toBe("User profile not found");
    });

    it("should return 404 if no meals found in date range", async () => {
      const fromMock = jest.fn();
      // First call for User table
      fromMock.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
          }),
        }),
      });
      // Second call for Calendar table
      fromMock.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockReturnValue({
                not: jest.fn().mockReturnValue({
                  in: jest.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          }),
        }),
      });

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: fromMock,
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = new NextRequest("http://localhost/api/shopping-lists/generate", {
        method: "POST",
        body: JSON.stringify({
          startDate: "2024-01-01",
          endDate: "2024-01-07",
          mealTypes: ["breakfast", "dinner"],
        }),
      });

      const response = await GENERATE(request);
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error).toBe("No meals found in the specified date range");
    });

    it("should successfully generate shopping list from calendar meals", async () => {
      const mockCalendarEntries = [
        {
          id: 1,
          date: "2024-01-01",
          meal_type: "dinner",
          Recipe: { id: 101, name: "Pasta Primavera" },
        },
        {
          id: 2,
          date: "2024-01-02",
          meal_type: "dinner",
          Recipe: { id: 102, name: "Grilled Chicken" },
        },
      ];

      const mockRecipeIngredients = [
        {
          recipe_id: 101,
          relative_unit_100: 200,
          Ingredient: { id: 1, name: "Tomatoes", unit: "kg" },
        },
        {
          recipe_id: 101,
          relative_unit_100: 100,
          Ingredient: { id: 2, name: "Pasta", unit: "g" },
        },
        {
          recipe_id: 102,
          relative_unit_100: 150,
          Ingredient: { id: 3, name: "Chicken Breast", unit: "g" },
        },
      ];

      const mockNewList = {
        id: "new-list-id",
        name: "Shopping List (2024-01-01 to 2024-01-07)",
        description: "Generated from 2 meals: Pasta Primavera, Grilled Chicken",
      };

      const fromMock = jest.fn();
      // 1. User table query
      fromMock.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
          }),
        }),
      });
      // 2. Calendar table query
      fromMock.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockReturnValue({
                not: jest.fn().mockResolvedValue({ data: mockCalendarEntries, error: null }),
              }),
            }),
          }),
        }),
      });
      // 3. Recipe-Ingredient_Map query
      fromMock.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({ data: mockRecipeIngredients, error: null }),
        }),
      });
      // 4. shopping_lists insert
      fromMock.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockNewList, error: null }),
          }),
        }),
      });
      // 5. shopping_list_items insert
      fromMock.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: fromMock,
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = new NextRequest("http://localhost/api/shopping-lists/generate", {
        method: "POST",
        body: JSON.stringify({
          startDate: "2024-01-01",
          endDate: "2024-01-07",
        }),
      });

      const response = await GENERATE(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.id).toBe("new-list-id");
      expect(json.item_count).toBe(3);
      expect(json.meals_count).toBe(2);
      expect(json.recipes_count).toBe(2);
    });
  });
});
