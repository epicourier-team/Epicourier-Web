/**
 * @jest-environment node
 */

import { GET } from "@/app/api/smart-cart-widget/route";
import { createClient } from "@/utils/supabase/server";

jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

// Types
type ShoppingList = {
  id: string;
  user_id: string;
  name: string;
  shopping_list_items: ShoppingListItem[];
};

type ShoppingListItem = {
  id: string;
  item_name: string;
  is_checked: boolean;
  position: number;
};

type InventoryItem = {
  id: string;
  quantity: number;
  expiration_date: string | null;
  min_quantity: number | null;
  Ingredient: { name: string } | { name: string }[] | null;
};

// Mock data factory
const mockUser = { id: "user-123", email: "test@example.com" };

const createMockShoppingList = (overrides: Partial<ShoppingList> = {}): ShoppingList => ({
  id: "list-1",
  user_id: mockUser.id,
  name: "Weekly Groceries",
  shopping_list_items: [
    { id: "item-1", item_name: "Milk", is_checked: false, position: 0 },
    { id: "item-2", item_name: "Eggs", is_checked: true, position: 1 },
    { id: "item-3", item_name: "Bread", is_checked: false, position: 2 },
  ],
  ...overrides,
});

const createMockInventoryItem = (overrides: Partial<InventoryItem> = {}): InventoryItem => ({
  id: "inv-1",
  quantity: 1,
  expiration_date: null,
  min_quantity: null,
  Ingredient: { name: "Chicken" },
  ...overrides,
});

// Helper to get a date string N days from today
const getDaysFromNow = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
};

describe("Smart Cart Widget API", () => {
  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
  let mockSupabase: {
    auth: { getUser: jest.Mock };
    from: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock Supabase client
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as ReturnType<typeof createClient>);
  });

  describe("GET /api/smart-cart-widget", () => {
    it("should return 401 for unauthenticated users", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "No user found" },
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return empty data when user has no lists or inventory", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock empty shopping lists
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "shopping_lists") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "user_inventory") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        return {};
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.active_list).toBeNull();
      expect(data.inventory_alerts).toEqual({
        expiring_soon: 0,
        expired: 0,
        low_stock: 0,
      });
      expect(data.suggested_action).toBeNull();
    });

    it("should return active list summary", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockList = createMockShoppingList();

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "shopping_lists") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue({ data: [mockList], error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "user_inventory") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        return {};
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.active_list).toEqual({
        id: "list-1",
        name: "Weekly Groceries",
        item_count: 3,
        checked_count: 1,
        next_items: ["Milk", "Bread"], // unchecked items sorted by position
      });
    });

    it("should calculate inventory alerts for expiring items", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const inventoryItems = [
        createMockInventoryItem({
          id: "inv-1",
          expiration_date: getDaysFromNow(2), // expiring in 2 days
          Ingredient: { name: "Chicken" },
        }),
        createMockInventoryItem({
          id: "inv-2",
          expiration_date: getDaysFromNow(5), // expiring in 5 days
          Ingredient: { name: "Milk" },
        }),
        createMockInventoryItem({
          id: "inv-3",
          expiration_date: getDaysFromNow(-1), // expired yesterday
          Ingredient: { name: "Yogurt" },
        }),
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "shopping_lists") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "user_inventory") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: inventoryItems, error: null }),
            }),
          };
        }
        return {};
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.inventory_alerts).toEqual({
        expiring_soon: 2, // items expiring within 7 days
        expired: 1, // items already expired
        low_stock: 0,
      });
    });

    it("should calculate low stock alerts", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const inventoryItems = [
        createMockInventoryItem({
          id: "inv-1",
          quantity: 1,
          min_quantity: 5, // below minimum
          Ingredient: { name: "Rice" },
        }),
        createMockInventoryItem({
          id: "inv-2",
          quantity: 10,
          min_quantity: 5, // above minimum
          Ingredient: { name: "Pasta" },
        }),
        createMockInventoryItem({
          id: "inv-3",
          quantity: 2,
          min_quantity: 3, // below minimum
          Ingredient: { name: "Salt" },
        }),
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "shopping_lists") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "user_inventory") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: inventoryItems, error: null }),
            }),
          };
        }
        return {};
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.inventory_alerts.low_stock).toBe(2);
    });

    it("should generate use_expiring suggested action for items expiring within 3 days", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const inventoryItems = [
        createMockInventoryItem({
          id: "inv-1",
          expiration_date: getDaysFromNow(1), // expiring tomorrow
          Ingredient: { name: "Chicken" },
        }),
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "shopping_lists") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "user_inventory") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: inventoryItems, error: null }),
            }),
          };
        }
        return {};
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.suggested_action).not.toBeNull();
      expect(data.suggested_action.type).toBe("use_expiring");
      expect(data.suggested_action.title).toContain("Chicken");
      expect(data.suggested_action.action_href).toBe("/dashboard/recipes");
    });

    it("should generate complete_shopping action when list is 75%+ done", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // List with 8/10 items checked (80%)
      const mockList = createMockShoppingList({
        shopping_list_items: [
          { id: "1", item_name: "Item 1", is_checked: true, position: 0 },
          { id: "2", item_name: "Item 2", is_checked: true, position: 1 },
          { id: "3", item_name: "Item 3", is_checked: true, position: 2 },
          { id: "4", item_name: "Item 4", is_checked: true, position: 3 },
          { id: "5", item_name: "Item 5", is_checked: true, position: 4 },
          { id: "6", item_name: "Item 6", is_checked: true, position: 5 },
          { id: "7", item_name: "Item 7", is_checked: true, position: 6 },
          { id: "8", item_name: "Item 8", is_checked: true, position: 7 },
          { id: "9", item_name: "Item 9", is_checked: false, position: 8 },
          { id: "10", item_name: "Item 10", is_checked: false, position: 9 },
        ],
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "shopping_lists") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue({ data: [mockList], error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "user_inventory") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        return {};
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.suggested_action).not.toBeNull();
      expect(data.suggested_action.type).toBe("complete_shopping");
      expect(data.suggested_action.title).toContain("2 items left");
    });

    it("should generate restock action for low stock items when no other action", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const inventoryItems = [
        createMockInventoryItem({
          id: "inv-1",
          quantity: 1,
          min_quantity: 5,
          expiration_date: getDaysFromNow(30), // not expiring soon
          Ingredient: { name: "Rice" },
        }),
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "shopping_lists") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "user_inventory") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: inventoryItems, error: null }),
            }),
          };
        }
        return {};
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.suggested_action).not.toBeNull();
      expect(data.suggested_action.type).toBe("restock");
      expect(data.suggested_action.title).toContain("1 item running low");
      expect(data.suggested_action.action_href).toBe("/dashboard/inventory");
    });

    it("should handle database errors gracefully", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockImplementation(() => {
        throw new Error("Database connection failed");
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch widget data");
    });
  });
});
