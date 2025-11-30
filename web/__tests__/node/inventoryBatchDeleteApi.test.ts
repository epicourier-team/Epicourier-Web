/**
 * Tests for Inventory Batch Delete API Route
 * @jest-environment node
 */

import { POST } from "@/app/api/inventory/batch-delete/route";
import { createClient } from "@/utils/supabase/server";
import { NextRequest } from "next/server";

// Mock Supabase client
jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

// Mock user
const mockUser = { id: "user-123", email: "test@example.com" };

// Helper to create mock request
const createMockRequest = (body: object): NextRequest => {
  return new NextRequest(new URL("http://localhost:3000/api/inventory/batch-delete"), {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
};

describe("Inventory Batch Delete API", () => {
  let mockSupabase: {
    auth: { getUser: jest.Mock };
    from: jest.Mock;
  };

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: jest.fn(),
    };
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication", () => {
    it("returns 401 when user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const request = createMockRequest({ ids: ["id-1", "id-2"] });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("Validation", () => {
    it("returns 400 when ids is not provided", async () => {
      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid or empty ids array");
    });

    it("returns 400 when ids is not an array", async () => {
      const request = createMockRequest({ ids: "not-an-array" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid or empty ids array");
    });

    it("returns 400 when ids is an empty array", async () => {
      const request = createMockRequest({ ids: [] });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid or empty ids array");
    });

    it("returns 400 when ids contains non-string values", async () => {
      const request = createMockRequest({ ids: ["id-1", 123, "id-3"] });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("All ids must be strings");
    });
  });

  describe("Successful deletion", () => {
    it("deletes items and returns success", async () => {
      const mockIn = jest.fn().mockResolvedValue({
        error: null,
        count: 3,
      });
      const mockEq = jest.fn().mockReturnValue({ in: mockIn });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockEq });
      mockSupabase.from.mockReturnValue({ delete: mockDelete });

      const request = createMockRequest({ ids: ["id-1", "id-2", "id-3"] });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.deleted_count).toBe(3);

      expect(mockSupabase.from).toHaveBeenCalledWith("user_inventory");
      expect(mockDelete).toHaveBeenCalled();
    });

    it("filters by user_id for security", async () => {
      const mockIn = jest.fn().mockResolvedValue({
        error: null,
        count: 2,
      });
      const mockEq = jest.fn().mockReturnValue({ in: mockIn });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockEq });
      mockSupabase.from.mockReturnValue({ delete: mockDelete });

      const request = createMockRequest({ ids: ["id-1", "id-2"] });
      await POST(request);

      expect(mockEq).toHaveBeenCalledWith("user_id", mockUser.id);
      expect(mockIn).toHaveBeenCalledWith("id", ["id-1", "id-2"]);
    });

    it("returns deleted_count from database", async () => {
      const mockIn = jest.fn().mockResolvedValue({
        error: null,
        count: 5,
      });
      const mockEq = jest.fn().mockReturnValue({ in: mockIn });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockEq });
      mockSupabase.from.mockReturnValue({ delete: mockDelete });

      const request = createMockRequest({
        ids: ["id-1", "id-2", "id-3", "id-4", "id-5"],
      });
      const response = await POST(request);
      const data = await response.json();

      expect(data.deleted_count).toBe(5);
    });

    it("uses ids.length as fallback when count is null", async () => {
      const mockIn = jest.fn().mockResolvedValue({
        error: null,
        count: null,
      });
      const mockEq = jest.fn().mockReturnValue({ in: mockIn });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockEq });
      mockSupabase.from.mockReturnValue({ delete: mockDelete });

      const request = createMockRequest({ ids: ["id-1", "id-2"] });
      const response = await POST(request);
      const data = await response.json();

      expect(data.deleted_count).toBe(2);
    });
  });

  describe("Error handling", () => {
    it("returns 500 when database error occurs", async () => {
      const mockIn = jest.fn().mockResolvedValue({
        error: { message: "Database connection failed" },
        count: null,
      });
      const mockEq = jest.fn().mockReturnValue({ in: mockIn });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockEq });
      mockSupabase.from.mockReturnValue({ delete: mockDelete });

      const request = createMockRequest({ ids: ["id-1", "id-2"] });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to delete inventory items");
    });

    it("handles invalid JSON in request body", async () => {
      const request = new NextRequest(new URL("http://localhost:3000/api/inventory/batch-delete"), {
        method: "POST",
        body: "invalid json",
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid request body");
    });
  });
});
