/**
 * @jest-environment node
 */

import { POST, DELETE } from "@/app/api/inventory/transfer/route";
import { createClient } from "@/utils/supabase/server";
import { NextRequest } from "next/server";

jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

// Mock data
const mockUser = { id: "user-123", email: "test@example.com" };

const mockTransferItem = {
  shopping_item_id: "item-1",
  ingredient_id: 101,
  quantity: 2,
  unit: "kg",
  location: "fridge",
  expiration_date: "2024-02-01",
};

describe("Inventory Transfer API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/inventory/transfer", () => {
    it("should return 401 if user is not authenticated", async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: { message: "Not authenticated" },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = new NextRequest("http://localhost/api/inventory/transfer", {
        method: "POST",
        body: JSON.stringify({ items: [mockTransferItem] }),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it("should return 400 if items array is missing", async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = new NextRequest("http://localhost/api/inventory/transfer", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Items array is required");
    });

    it("should return 400 if items array is empty", async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = new NextRequest("http://localhost/api/inventory/transfer", {
        method: "POST",
        body: JSON.stringify({ items: [] }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("should return 400 if item is missing required fields", async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = new NextRequest("http://localhost/api/inventory/transfer", {
        method: "POST",
        body: JSON.stringify({
          items: [{ shopping_item_id: "item-1" }], // Missing ingredient_id
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Each item must have shopping_item_id and ingredient_id");
    });

    it("should transfer items to inventory (new item)", async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      });

      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      const mockUpdateShoppingItem = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn().mockImplementation((table: string) => {
          if (table === "user_inventory") {
            return {
              select: mockSelect,
              insert: mockInsert,
            };
          }
          if (table === "shopping_list_items") {
            return {
              update: mockUpdateShoppingItem,
            };
          }
          return {};
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = new NextRequest("http://localhost/api/inventory/transfer", {
        method: "POST",
        body: JSON.stringify({ items: [mockTransferItem] }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.transferred_count).toBe(1);
    });

    it("should update existing inventory item quantity", async () => {
      const existingInventoryItem = {
        id: "inv-1",
        quantity: 5,
        expiration_date: "2024-01-15",
      };

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: existingInventoryItem, error: null }),
            }),
          }),
        }),
      });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockUpdateShoppingItem = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn().mockImplementation((table: string) => {
          if (table === "user_inventory") {
            return {
              select: mockSelect,
              update: mockUpdate,
            };
          }
          if (table === "shopping_list_items") {
            return {
              update: mockUpdateShoppingItem,
            };
          }
          return {};
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = new NextRequest("http://localhost/api/inventory/transfer", {
        method: "POST",
        body: JSON.stringify({ items: [mockTransferItem] }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe("DELETE /api/inventory/transfer", () => {
    it("should return 401 if user is not authenticated", async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: { message: "Not authenticated" },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = new NextRequest("http://localhost/api/inventory/transfer", {
        method: "DELETE",
        body: JSON.stringify({ items: [mockTransferItem] }),
      });

      const response = await DELETE(request);
      expect(response.status).toBe(401);
    });

    it("should return 400 if items array is missing", async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = new NextRequest("http://localhost/api/inventory/transfer", {
        method: "DELETE",
        body: JSON.stringify({}),
      });

      const response = await DELETE(request);
      expect(response.status).toBe(400);
    });

    it("should undo transfer (uncheck shopping item and remove inventory)", async () => {
      const existingInventoryItem = {
        id: "inv-1",
        quantity: 2, // Same as mockTransferItem.quantity, so should delete
      };

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: existingInventoryItem, error: null }),
            }),
          }),
        }),
      });

      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockUpdateShoppingItem = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn().mockImplementation((table: string) => {
          if (table === "user_inventory") {
            return {
              select: mockSelect,
              delete: mockDelete,
            };
          }
          if (table === "shopping_list_items") {
            return {
              update: mockUpdateShoppingItem,
            };
          }
          return {};
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const request = new NextRequest("http://localhost/api/inventory/transfer", {
        method: "DELETE",
        body: JSON.stringify({ items: [mockTransferItem] }),
      });

      const response = await DELETE(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });
});
