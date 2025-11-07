/**
 * @jest-environment node
 */

import { GET, POST } from "@/app/api/calendar/route";
import { supabaseServer } from "@/lib/supabaseServer";

jest.mock("@/lib/supabaseServer", () => ({
  supabaseServer: {
    from: jest.fn(),
  },
}));

// Utility to build a mock Next.js Request
const createRequest = (url: string, options?: RequestInit): Request => {
  return new Request(url, options);
};

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

beforeEach(() => {
  jest.clearAllMocks();

  // default chain setup
  (supabaseServer.from as jest.Mock).mockReturnValue({
    select: mockSelect.mockReturnThis(),
    eq: mockEq.mockReturnThis(),
    order: mockOrder.mockReturnThis(),
    gte: mockGte.mockReturnThis(),
    lte: mockLte.mockReturnThis(),
    insert: mockInsert.mockReturnThis(),
    single: mockSingle.mockReturnThis(),
  });
});

describe("GET /api/calendar", () => {
  it("returns 400 if user_id is missing", async () => {
    const req = createRequest("http://localhost/api/calendar");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Missing user_id");
  });

  it("returns 200 with data when user_id provided", async () => {
    const mockData = [{ id: 1, date: "2025-11-06", meal_type: "lunch", Recipe: { name: "Pasta" } }];

    mockSelect.mockReturnValueOnce({
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      then: undefined,
    });
    mockSelect.mockResolvedValue({ data: mockData, error: null });

    const req = createRequest("http://localhost/api/calendar?user_id=123");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual(mockData);
  });

  it("returns 500 if Supabase throws error", async () => {
    const supabaseError = new Error("Database failed");

    mockSelect.mockReturnValueOnce({
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      then: undefined,
    });
    mockSelect.mockResolvedValue({ data: null, error: supabaseError });

    const req = createRequest("http://localhost/api/calendar?user_id=456");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Database failed");
  });
});

describe("POST /api/calendar", () => {
  it("returns 400 if required fields are missing", async () => {
    const body = { recipe_id: 1 };
    const req = createRequest("http://localhost/api/calendar", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Missing required fields");
  });

  it("returns 200 with inserted data", async () => {
    const newItem = {
      id: 10,
      user_id: "user123",
      recipe_id: 55,
      date: "2025-11-06",
      meal_type: "dinner",
      status: false,
      Recipe: { id: 55, name: "Salad" },
    };

    mockInsert.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: newItem, error: null }),
    });

    const req = createRequest("http://localhost/api/calendar", {
      method: "POST",
      body: JSON.stringify({
        user_id: "user123",
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
    mockInsert.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: new Error("Insert failed") }),
    });

    const req = createRequest("http://localhost/api/calendar", {
      method: "POST",
      body: JSON.stringify({
        user_id: "u123",
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
