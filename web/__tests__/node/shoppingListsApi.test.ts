/**
 * @jest-environment node
 */

import { GET, POST } from "@/app/api/shopping-lists/route";
import { GET as GET_BY_ID, PUT, DELETE } from "@/app/api/shopping-lists/[id]/route";
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

// Chain builder helpers
const mockSelectChain = (data: unknown, error: Error | null = null) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      order: jest.fn().mockResolvedValue({ data, error }),
    }),
  }),
});

const mockSelectSingleChain = (data: unknown, error: Error | null = null) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue({ data, error }),
    }),
  }),
});

const mockInsertChain = (data: unknown, error: Error | null = null) => ({
  insert: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue({ data, error }),
    }),
  }),
});

const mockUpdateChain = (data: unknown, error: Error | null = null) => ({
  update: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data, error }),
      }),
    }),
  }),
});

const mockDeleteChain = (error: Error | null = null) => ({
  delete: jest.fn().mockReturnValue({
    eq: jest.fn().mockResolvedValue({ error }),
  }),
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
});
