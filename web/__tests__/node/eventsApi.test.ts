/**
 * @jest-environment node
 */

import { GET, POST } from "@/app/api/events/route";
import { createClient } from "@/utils/supabase/server";

// Mock supabase server client
jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

// Utility to build a mock Next.js Request
const createRequest = (url: string, options?: RequestInit): Request => {
  return new Request(url, options);
};

// ------------------------------
// Type Definitions
// ------------------------------
interface CalendarEntry {
  id: number;
  date: string;
  meal_type: string;
  Recipe?: { name: string };
}

// ------------------------------
// Mock Object Definitions
// ------------------------------

// ------------------------------
// Mock Supabase chainable behavior
// ------------------------------
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockGte = jest.fn();
const mockLte = jest.fn();
const mockInsert = jest.fn();
const mockSingle = jest.fn();
const mockLimit = jest.fn();
const mockAuthGetUser = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();

  // Setup mock for createClient() -> supabase instance
  const mockSupabaseClient = {
    auth: {
      getUser: mockAuthGetUser,
    },
    from: jest.fn().mockReturnValue({
      select: mockSelect.mockReturnThis(),
      eq: mockEq.mockReturnThis(),
      order: mockOrder.mockReturnThis(),
      gte: mockGte.mockReturnThis(),
      lte: mockLte.mockReturnThis(),
      insert: mockInsert.mockReturnThis(),
      single: mockSingle.mockReturnThis(),
      limit: mockLimit.mockReturnThis(),
    }),
  };
  (createClient as jest.Mock).mockResolvedValue(mockSupabaseClient);

  // Default auth mock (success)
  mockAuthGetUser.mockResolvedValue({
    data: { user: { email: "test@example.com" } },
    error: null,
  });

  // Default user profile mock (for getPublicUserId)
  mockSelect.mockReturnValue({
    eq: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnValue({
      then: async (resolve: (...args: unknown[]) => void) =>
        resolve({ data: [{ id: 123 }], error: null }),
    }),
    // For other queries
    order: jest.fn().mockReturnThis(),
    then: async (resolve: (...args: unknown[]) => void) => resolve({ data: [], error: null }),
  });
});

describe("GET /api/events", () => {
  it("returns 401 if user is not authenticated", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null }, error: new Error("No session") });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("User not authenticated");
  });

  it("returns 200 with data when authenticated", async () => {
    const mockData: CalendarEntry[] = [
      { id: 1, date: "2025-11-06", meal_type: "lunch", Recipe: { name: "Pasta" } },
    ];

    // 1. Mock user profile fetch (getPublicUserId)
    mockSelect.mockReturnValueOnce({
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnValue({
        then: async (resolve: (...args: unknown[]) => void) =>
          resolve({ data: [{ id: 123 }], error: null }),
      }),
    });

    // 2. Mock events fetch
    mockSelect.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnValue({
        then: async (resolve: (...args: unknown[]) => void) =>
          resolve({ data: mockData, error: null }),
      }),
    });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual(mockData);
  });

  it("returns 500 if Supabase throws error during fetch", async () => {
    const supabaseError = new Error("Database failed");

    // 1. Mock user profile fetch (success)
    mockSelect.mockReturnValueOnce({
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnValue({
        then: async (resolve: (...args: unknown[]) => void) =>
          resolve({ data: [{ id: 123 }], error: null }),
      }),
    });

    // 2. Mock events fetch (failure)
    mockSelect.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnValue({
        then: async (resolve: (...args: unknown[]) => void) =>
          resolve({ data: null, error: supabaseError }),
      }),
    });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Database failed");
  });
});

describe("POST /api/events", () => {
  it("returns 400 if required fields are missing", async () => {
    // Mock auth success
    mockSelect.mockReturnValueOnce({
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnValue({
        then: async (resolve: (...args: unknown[]) => void) =>
          resolve({ data: [{ id: 123 }], error: null }),
      }),
    });

    const body = { recipe_id: 1 }; // Missing date and meal_type
    const req = createRequest("http://localhost/api/events", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("Missing required fields");
  });

  it("returns 200 with inserted data", async () => {
    const newItem = {
      id: 10,
      user_id: 123,
      recipe_id: 55,
      date: "2025-11-06",
      meal_type: "dinner",
      status: false,
      Recipe: { id: 55, name: "Salad" },
    };

    // 1. Mock user profile fetch
    mockSelect.mockReturnValueOnce({
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnValue({
        then: async (resolve: (...args: unknown[]) => void) =>
          resolve({ data: [{ id: 123 }], error: null }),
      }),
    });

    // 2. Mock insert
    mockInsert.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: newItem, error: null }),
    });

    const req = createRequest("http://localhost/api/events", {
      method: "POST",
      body: JSON.stringify({
        recipe_id: 55,
        date: "2025-11-06",
        meal_type: "dinner",
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual(newItem);
  });

  it("returns 500 if Supabase insert fails", async () => {
    // 1. Mock user profile fetch
    mockSelect.mockReturnValueOnce({
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnValue({
        then: async (resolve: (...args: unknown[]) => void) =>
          resolve({ data: [{ id: 123 }], error: null }),
      }),
    });

    // 2. Mock insert failure
    mockInsert.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: new Error("Insert failed") }),
    });

    const req = createRequest("http://localhost/api/events", {
      method: "POST",
      body: JSON.stringify({
        recipe_id: 44,
        date: "2025-11-07",
        meal_type: "lunch",
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Insert failed");
  });
});
