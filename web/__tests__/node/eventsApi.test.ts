/**
 * @jest-environment node
 */

import { GET, POST } from "@/app/api/events/route";
import { createClient } from "@/utils/supabase/server";

jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

// 建立一個工具函式來創建假 Request
const makeRequest = (url = "http://localhost/api/events", init?: RequestInit): Request =>
  new Request(url, init);

// ------------------------------
// 全域 Mock Supabase client
// ------------------------------
const mockAuthGetUser = jest.fn();
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockInsert = jest.fn();
const mockSingle = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();

  // 預設 mock Supabase client
  (createClient as jest.Mock).mockResolvedValue({
    auth: { getUser: mockAuthGetUser },
    from: mockFrom,
  });

  mockFrom.mockReturnValue({
    select: mockSelect.mockReturnThis(),
    eq: mockEq.mockReturnThis(),
    order: mockOrder.mockReturnThis(),
    insert: mockInsert.mockReturnThis(),
    single: mockSingle.mockReturnThis(),
  });
});

// ------------------------------
// GET /api/events
// ------------------------------
describe("GET /api/events", () => {
  it("returns 401 if user not authenticated", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "no user" },
    });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toMatch(/User not authenticated/i);
  });

  it("returns 200 with event data when authenticated", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { email: "test@example.com" } },
      error: null,
    });

    // 模擬查詢 public user id
    mockSelect
      .mockResolvedValueOnce({ data: [{ id: 99 }], error: null }) // getPublicUserId
      .mockResolvedValueOnce({
        data: [{ id: 1, date: "2025-11-07", meal_type: "lunch" }],
        error: null,
      }); // main events query

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual([{ id: 1, date: "2025-11-07", meal_type: "lunch" }]);
  });

  it("returns 500 if Supabase query fails", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { email: "test@example.com" } },
      error: null,
    });

    mockSelect
      .mockResolvedValueOnce({ data: [{ id: 99 }], error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "DB failed" } });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("DB failed");
  });
});

// ------------------------------
// POST /api/events
// ------------------------------
describe("POST /api/events", () => {
  it("returns 401 if user not authenticated", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "no user" },
    });

    const req = makeRequest("http://localhost/api/events", {
      method: "POST",
      body: JSON.stringify({ recipe_id: 5, date: "2025-11-08", meal_type: "lunch" }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toMatch(/User not authenticated/i);
  });

  it("returns 400 if missing required fields", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { email: "test@example.com" } },
      error: null,
    });

    mockSelect.mockResolvedValueOnce({ data: [{ id: 123 }], error: null });

    const req = makeRequest("http://localhost/api/events", {
      method: "POST",
      body: JSON.stringify({ recipe_id: 1 }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/Missing required fields/i);
  });

  it("returns 200 when insert succeeds", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { email: "test@example.com" } },
      error: null,
    });

    mockSelect.mockResolvedValueOnce({ data: [{ id: 123 }], error: null }); // getPublicUserId

    mockInsert.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 50,
          date: "2025-11-07",
          meal_type: "lunch",
          status: false,
          Recipe: { id: 99, name: "Salad" },
        },
        error: null,
      }),
    });

    const req = makeRequest("http://localhost/api/events", {
      method: "POST",
      body: JSON.stringify({
        recipe_id: 99,
        date: "2025-11-07",
        meal_type: "lunch",
        status: false,
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual(
      expect.objectContaining({
        id: 50,
        meal_type: "lunch",
        Recipe: expect.objectContaining({ name: "Salad" }),
      })
    );
  });

  it("returns 500 when insert fails", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { email: "test@example.com" } },
      error: null,
    });

    mockSelect.mockResolvedValueOnce({ data: [{ id: 123 }], error: null }); // getPublicUserId

    mockInsert.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Insert failed" },
      }),
    });

    const req = makeRequest("http://localhost/api/events", {
      method: "POST",
      body: JSON.stringify({
        recipe_id: 1,
        date: "2025-11-07",
        meal_type: "dinner",
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Insert failed");
  });
});
