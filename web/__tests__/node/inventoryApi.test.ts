/**
 * Tests for Inventory API Routes
 * Issue #92: test(frontend): Inventory system tests
 * @jest-environment node
 */

import { GET, POST } from "@/app/api/inventory/route";
import { GET as GET_BY_ID, PUT, DELETE } from "@/app/api/inventory/[id]/route";
import { GET as GET_EXPIRING } from "@/app/api/inventory/expiring/route";
import { createClient } from "@/utils/supabase/server";
import { NextRequest } from "next/server";

// Mock Supabase client
jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

// Mock user
const mockUser = { id: "user-123", email: "test@example.com" };

// Helper to create mock request
const createMockRequest = (
  url: string,
  options: { method?: string; body?: object } = {}
): NextRequest => {
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method: options.method || "GET",
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
  });
};

// Helper to get date string relative to today
const getDateString = (daysFromNow: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split("T")[0];
};

// Mock data factory - creates raw DB items
const createMockDbItem = (overrides: Record<string, unknown> = {}) => ({
  id: "inv-1",
  user_id: mockUser.id,
  ingredient_id: 101,
  quantity: 500,
  unit: "g",
  location: "pantry",
  expiration_date: getDateString(14), // 14 days from now
  min_quantity: 100,
  notes: "Test item",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  ingredient: { id: 101, name: "Flour" },
  ...overrides,
});

describe("Inventory API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // GET /api/inventory
  // ============================================================================
  describe("GET /api/inventory", () => {
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

      const request = createMockRequest("http://localhost:3000/api/inventory");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe("Unauthorized");
    });

    it("should return inventory items with summary for authenticated user", async () => {
      const mockItems = [
        createMockDbItem({ id: "inv-1", location: "pantry" }),
        createMockDbItem({ id: "inv-2", location: "fridge" }),
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
              order: jest.fn().mockResolvedValue({
                data: mockItems,
                error: null,
              }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = createMockRequest("http://localhost:3000/api/inventory");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.items).toHaveLength(2);
      expect(json.summary).toBeDefined();
      expect(json.summary.total_items).toBe(2);
    });

    it("should filter by location when location param is provided", async () => {
      const mockItems = [createMockDbItem({ id: "inv-1", location: "fridge" })];

      // Create chainable mock that handles both filtered and unfiltered queries
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockImplementation((field, value) => {
              if (field === "user_id") {
                return {
                  order: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                      data: mockItems,
                      error: null,
                    }),
                  }),
                };
              }
              return {
                order: jest.fn().mockResolvedValue({
                  data: mockItems,
                  error: null,
                }),
              };
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = createMockRequest("http://localhost:3000/api/inventory?location=fridge");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.items).toHaveLength(1);
      expect(json.items[0].location).toBe("fridge");
    });

    it("should filter by search term", async () => {
      const mockItems = [
        createMockDbItem({
          id: "inv-1",
          ingredient: { id: 101, name: "Flour" },
        }),
        createMockDbItem({
          id: "inv-2",
          ingredient: { id: 102, name: "Sugar" },
        }),
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
              order: jest.fn().mockResolvedValue({
                data: mockItems,
                error: null,
              }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = createMockRequest("http://localhost:3000/api/inventory?search=flour");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      // Should filter to only Flour
      expect(json.items).toHaveLength(1);
      expect(json.items[0].ingredient.name).toBe("Flour");
    });

    it("should calculate expiration status correctly", async () => {
      const mockItems = [
        createMockDbItem({
          id: "inv-1",
          expiration_date: getDateString(-1), // expired
        }),
        createMockDbItem({
          id: "inv-2",
          expiration_date: getDateString(1), // critical (within 2 days)
        }),
        createMockDbItem({
          id: "inv-3",
          expiration_date: getDateString(5), // warning (within 7 days)
        }),
        createMockDbItem({
          id: "inv-4",
          expiration_date: getDateString(14), // good
        }),
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
              order: jest.fn().mockResolvedValue({
                data: mockItems,
                error: null,
              }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = createMockRequest("http://localhost:3000/api/inventory");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.items[0].expiration_status).toBe("expired");
      expect(json.items[1].expiration_status).toBe("critical");
      expect(json.items[2].expiration_status).toBe("warning");
      expect(json.items[3].expiration_status).toBe("good");
    });

    it("should calculate low stock status correctly", async () => {
      const mockItems = [
        createMockDbItem({
          id: "inv-1",
          quantity: 50, // below min_quantity of 100
          min_quantity: 100,
        }),
        createMockDbItem({
          id: "inv-2",
          quantity: 500, // above min_quantity of 100
          min_quantity: 100,
        }),
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
              order: jest.fn().mockResolvedValue({
                data: mockItems,
                error: null,
              }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = createMockRequest("http://localhost:3000/api/inventory");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.items[0].is_low_stock).toBe(true);
      expect(json.items[1].is_low_stock).toBe(false);
      expect(json.summary.low_stock).toBe(1);
    });

    it("should filter by expiring_within parameter", async () => {
      const mockItems = [
        createMockDbItem({
          id: "inv-1",
          expiration_date: getDateString(3), // 3 days from now
        }),
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
              order: jest.fn().mockReturnValue({
                lte: jest.fn().mockReturnValue({
                  gte: jest.fn().mockResolvedValue({
                    data: mockItems,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = createMockRequest("http://localhost:3000/api/inventory?expiring_within=7");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.items).toHaveLength(1);
    });

    it("should return 500 when database error occurs", async () => {
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
              order: jest.fn().mockResolvedValue({
                data: null,
                error: new Error("Database error"),
              }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = createMockRequest("http://localhost:3000/api/inventory");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe("Failed to fetch inventory");
    });

    it("should handle null expiration_date (unknown status)", async () => {
      const mockItems = [
        createMockDbItem({
          id: "inv-1",
          expiration_date: null,
        }),
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
              order: jest.fn().mockResolvedValue({
                data: mockItems,
                error: null,
              }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = createMockRequest("http://localhost:3000/api/inventory");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.items[0].expiration_status).toBe("unknown");
      expect(json.items[0].days_until_expiration).toBeNull();
    });
  });

  // ============================================================================
  // POST /api/inventory
  // ============================================================================
  describe("POST /api/inventory", () => {
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

      const request = createMockRequest("http://localhost:3000/api/inventory", {
        method: "POST",
        body: { ingredient_id: 101, quantity: 100 },
      });
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe("Unauthorized");
    });

    it("should return 400 if ingredient_id is missing", async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = createMockRequest("http://localhost:3000/api/inventory", {
        method: "POST",
        body: { quantity: 100 },
      });
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe("ingredient_id is required");
    });

    it("should return 400 if quantity is invalid", async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = createMockRequest("http://localhost:3000/api/inventory", {
        method: "POST",
        body: { ingredient_id: 101, quantity: -10 },
      });
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe("Valid quantity is required");
    });

    it("should create a new inventory item successfully", async () => {
      const newItem = createMockDbItem({ id: "new-inv-1" });

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn().mockImplementation((table) => {
          if (table === "Ingredient") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: 101, name: "Flour" },
                    error: null,
                  }),
                }),
              }),
            };
          }
          // user_inventory table
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: null, // No existing item
                      error: { code: "PGRST116" }, // Not found
                    }),
                  }),
                }),
              }),
            }),
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: newItem,
                  error: null,
                }),
              }),
            }),
          };
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = createMockRequest("http://localhost:3000/api/inventory", {
        method: "POST",
        body: { ingredient_id: 101, quantity: 500, unit: "g", location: "pantry" },
      });
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.id).toBe("new-inv-1");
    });

    it("should return 404 if ingredient not found", async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn().mockImplementation((table) => {
          if (table === "Ingredient") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: "PGRST116" },
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = createMockRequest("http://localhost:3000/api/inventory", {
        method: "POST",
        body: { ingredient_id: 9999, quantity: 100 },
      });
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error).toBe("Ingredient not found");
    });

    it("should update existing item quantity when adding same ingredient to same location", async () => {
      const existingItem = { id: "existing-1", quantity: 200 };
      const updatedItem = createMockDbItem({ id: "existing-1", quantity: 700 }); // 200 + 500

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn().mockImplementation((table) => {
          if (table === "Ingredient") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: 101, name: "Flour" },
                    error: null,
                  }),
                }),
              }),
            };
          }
          // user_inventory table
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: existingItem, // Existing item found
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: updatedItem,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = createMockRequest("http://localhost:3000/api/inventory", {
        method: "POST",
        body: { ingredient_id: 101, quantity: 500, unit: "g", location: "pantry" },
      });
      const response = await POST(request);
      const json = await response.json();

      // Should return 200 (update) not 201 (create)
      expect(response.status).toBe(200);
      expect(json.quantity).toBe(700);
    });

    it("should return 500 when update fails on existing item", async () => {
      const existingItem = { id: "existing-1", quantity: 200 };

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn().mockImplementation((table) => {
          if (table === "Ingredient") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: 101, name: "Flour" },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: existingItem,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: new Error("Update failed"),
                  }),
                }),
              }),
            }),
          };
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = createMockRequest("http://localhost:3000/api/inventory", {
        method: "POST",
        body: { ingredient_id: 101, quantity: 500 },
      });
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe("Failed to update inventory item");
    });

    it("should return 500 when create fails", async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn().mockImplementation((table) => {
          if (table === "Ingredient") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: 101, name: "Flour" },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: null,
                      error: { code: "PGRST116" },
                    }),
                  }),
                }),
              }),
            }),
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: new Error("Insert failed"),
                }),
              }),
            }),
          };
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = createMockRequest("http://localhost:3000/api/inventory", {
        method: "POST",
        body: { ingredient_id: 101, quantity: 500 },
      });
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe("Failed to create inventory item");
    });
  });

  // ============================================================================
  // GET /api/inventory/[id]
  // ============================================================================
  describe("GET /api/inventory/[id]", () => {
    const mockParams = Promise.resolve({ id: "inv-1" });

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

      const request = createMockRequest("http://localhost:3000/api/inventory/inv-1");
      const response = await GET_BY_ID(request, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe("Unauthorized");
    });

    it("should return 404 if item not found", async () => {
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
                  error: { code: "PGRST116" },
                }),
              }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = createMockRequest("http://localhost:3000/api/inventory/non-existent");
      const response = await GET_BY_ID(request, {
        params: Promise.resolve({ id: "non-existent" }),
      });
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error).toBe("Inventory item not found");
    });

    it("should return inventory item by id", async () => {
      const mockItem = createMockDbItem({ id: "inv-1" });

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
                  data: mockItem,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = createMockRequest("http://localhost:3000/api/inventory/inv-1");
      const response = await GET_BY_ID(request, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(200);
      // API returns item directly, not { item: ... }
      expect(json.id).toBe("inv-1");
      expect(json.expiration_status).toBeDefined();
    });
  });

  // ============================================================================
  // PUT /api/inventory/[id]
  // ============================================================================
  describe("PUT /api/inventory/[id]", () => {
    const mockParams = Promise.resolve({ id: "inv-1" });

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

      const request = createMockRequest("http://localhost:3000/api/inventory/inv-1", {
        method: "PUT",
        body: { quantity: 300 },
      });
      const response = await PUT(request, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe("Unauthorized");
    });

    it("should return 404 if item not found", async () => {
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
                  error: { code: "PGRST116" },
                }),
              }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = createMockRequest("http://localhost:3000/api/inventory/non-existent", {
        method: "PUT",
        body: { quantity: 300 },
      });
      const response = await PUT(request, {
        params: Promise.resolve({ id: "non-existent" }),
      });
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error).toBe("Inventory item not found");
    });

    it("should update inventory item successfully", async () => {
      const updatedItem = createMockDbItem({ id: "inv-1", quantity: 300 });

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
                  data: { id: "inv-1" }, // existing item check
                  error: null,
                }),
              }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: updatedItem,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = createMockRequest("http://localhost:3000/api/inventory/inv-1", {
        method: "PUT",
        body: { quantity: 300 },
      });
      const response = await PUT(request, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(200);
      // API returns item directly, not { item: ... }
      expect(json.quantity).toBe(300);
    });

    it("should return 400 for invalid quantity", async () => {
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
                  data: { id: "inv-1" },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = createMockRequest("http://localhost:3000/api/inventory/inv-1", {
        method: "PUT",
        body: { quantity: -50 },
      });
      const response = await PUT(request, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe("Invalid quantity");
    });

    it("should return 400 for invalid location", async () => {
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
                  data: { id: "inv-1" },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = createMockRequest("http://localhost:3000/api/inventory/inv-1", {
        method: "PUT",
        body: { location: "invalid_location" },
      });
      const response = await PUT(request, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe("Invalid location");
    });

    it("should update multiple fields including unit, notes, location", async () => {
      const updatedItem = createMockDbItem({
        id: "inv-1",
        quantity: 300,
        unit: "kg",
        location: "freezer",
        notes: "Updated notes",
        min_quantity: 50,
        expiration_date: getDateString(30),
      });

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
                  data: { id: "inv-1" },
                  error: null,
                }),
              }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: updatedItem,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = createMockRequest("http://localhost:3000/api/inventory/inv-1", {
        method: "PUT",
        body: {
          quantity: 300,
          unit: "kg",
          location: "freezer",
          notes: "Updated notes",
          min_quantity: 50,
          expiration_date: getDateString(30),
        },
      });
      const response = await PUT(request, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.unit).toBe("kg");
      expect(json.location).toBe("freezer");
      expect(json.notes).toBe("Updated notes");
    });

    it("should return 500 when update fails", async () => {
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
                  data: { id: "inv-1" },
                  error: null,
                }),
              }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: new Error("Update failed"),
                }),
              }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = createMockRequest("http://localhost:3000/api/inventory/inv-1", {
        method: "PUT",
        body: { quantity: 300 },
      });
      const response = await PUT(request, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe("Failed to update inventory item");
    });
  });

  // ============================================================================
  // DELETE /api/inventory/[id]
  // ============================================================================
  describe("DELETE /api/inventory/[id]", () => {
    const mockParams = Promise.resolve({ id: "inv-1" });

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

      const request = createMockRequest("http://localhost:3000/api/inventory/inv-1", {
        method: "DELETE",
      });
      const response = await DELETE(request, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe("Unauthorized");
    });

    it("should delete inventory item successfully", async () => {
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
              eq: jest.fn().mockResolvedValue({
                error: null,
              }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = createMockRequest("http://localhost:3000/api/inventory/inv-1", {
        method: "DELETE",
      });
      const response = await DELETE(request, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(200);
      // API returns { success: true }, not { message: ... }
      expect(json.success).toBe(true);
    });

    it("should return 500 when delete fails", async () => {
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
              eq: jest.fn().mockResolvedValue({
                error: new Error("Delete failed"),
              }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = createMockRequest("http://localhost:3000/api/inventory/inv-1", {
        method: "DELETE",
      });
      const response = await DELETE(request, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe("Failed to delete inventory item");
    });
  });

  // ============================================================================
  // GET /api/inventory/expiring
  // ============================================================================
  describe("GET /api/inventory/expiring", () => {
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

      const request = createMockRequest("http://localhost:3000/api/inventory/expiring");
      const response = await GET_EXPIRING(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe("Unauthorized");
    });

    it("should return expiring items grouped by status", async () => {
      const mockItems = [
        createMockDbItem({
          id: "inv-1",
          expiration_date: getDateString(-1), // expired
        }),
        createMockDbItem({
          id: "inv-2",
          expiration_date: getDateString(1), // critical
        }),
        createMockDbItem({
          id: "inv-3",
          expiration_date: getDateString(5), // warning
        }),
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
              not: jest.fn().mockReturnValue({
                lte: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({
                    data: mockItems,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = createMockRequest("http://localhost:3000/api/inventory/expiring");
      const response = await GET_EXPIRING(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.items).toBeDefined();
      expect(json.grouped).toBeDefined();
      // Check status grouping
      expect(json.grouped.expired).toHaveLength(1);
      expect(json.grouped.critical).toHaveLength(1);
      expect(json.grouped.warning).toHaveLength(1);
    });

    it("should accept days parameter", async () => {
      const mockItems = [
        createMockDbItem({
          id: "inv-1",
          expiration_date: getDateString(2),
        }),
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
              not: jest.fn().mockReturnValue({
                lte: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({
                    data: mockItems,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = createMockRequest("http://localhost:3000/api/inventory/expiring?days=3");
      const response = await GET_EXPIRING(request);

      expect(response.status).toBe(200);
    });

    it("should return 400 for invalid days parameter", async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = createMockRequest("http://localhost:3000/api/inventory/expiring?days=-5");
      const response = await GET_EXPIRING(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe("Invalid days parameter");
    });

    it("should return 500 when database error occurs", async () => {
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
              not: jest.fn().mockReturnValue({
                lte: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({
                    data: null,
                    error: new Error("Database error"),
                  }),
                }),
              }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = createMockRequest("http://localhost:3000/api/inventory/expiring");
      const response = await GET_EXPIRING(request);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe("Failed to fetch expiring items");
    });
  });
});
