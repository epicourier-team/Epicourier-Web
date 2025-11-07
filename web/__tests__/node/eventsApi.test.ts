/**
 * @jest-environment node
 */

import { GET, POST } from "@/app/api/events/route";
import { createClient } from "@/utils/supabase/server";

jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

// ------------------------------
// 型別定義
// ------------------------------
interface Recipe {
  id: number;
  name: string;
  image_url?: string;
  description?: string;
  min_prep_time?: number;
  green_score?: number;
}

interface CalendarEntry {
  id: number;
  date: string;
  meal_type: string;
  status: boolean;
  Recipe?: Recipe;
}

// ------------------------------
// Mock 定義
// ------------------------------
const mockAuthGetUser = jest.fn();
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockInsert = jest.fn();

// 工具：建立 Request
const makeRequest = (body?: Record<string, unknown>): Request =>
  new Request("http://localhost/api/events", {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });

// ------------------------------
// beforeEach：設定雙 from mock
// ------------------------------
beforeEach(() => {
  jest.clearAllMocks();

  // ✅ createClient mock
  (createClient as jest.Mock).mockResolvedValue({
    auth: { getUser: mockAuthGetUser },
    from: mockFrom,
  });

  // ✅ 預設使用者登入成功
  mockAuthGetUser.mockResolvedValue({
    data: { user: { email: "test@example.com" } },
    error: null,
  });

  // ✅ 區分 from("User") vs from("Calendar")
  (mockFrom as jest.Mock).mockImplementation((table: string) => {
    if (table === "User") {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [{ id: 99 }],
              error: null,
            }),
          }),
        }),
      };
    }

    if (table === "Calendar") {
      return {
        select: mockSelect.mockReturnThis(),
        eq: mockEq.mockReturnThis(),
        order: mockOrder.mockReturnThis(),
        insert: mockInsert.mockReturnThis(),
      };
    }

    throw new Error(`Unexpected table name: ${table}`);
  });
});

// ------------------------------
// 測試開始
// ------------------------------
describe("GET /api/events", () => {
  it("returns 401 if user not authenticated", async () => {
    mockAuthGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "no user" },
    });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toMatch(/User not authenticated/i);
  });

  it("returns 200 with event data when authenticated", async () => {
    const mockData: CalendarEntry[] = [
      { id: 1, date: "2025-11-07", meal_type: "lunch", status: false },
    ];

    mockSelect.mockReturnValueOnce({
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      then: async (resolve: (v: { data: CalendarEntry[]; error: null }) => void) =>
        resolve({ data: mockData, error: null }),
    });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual(mockData);
  });

  it("returns 500 if Supabase query fails", async () => {
    mockSelect.mockReturnValueOnce({
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      then: async (resolve: (v: { data: null; error: Error }) => void) =>
        resolve({ data: null, error: new Error("DB failed") }),
    });

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
    mockAuthGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "no user" },
    });

    const res = await POST(makeRequest({ recipe_id: 5, date: "2025-11-08", meal_type: "lunch" }));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toMatch(/User not authenticated/i);
  });

  it("returns 400 if missing required fields", async () => {
    const res = await POST(makeRequest({ recipe_id: 1 }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/Missing required fields/i);
  });

  it("returns 200 when insert succeeds", async () => {
    const newEvent: CalendarEntry = {
      id: 50,
      date: "2025-11-07",
      meal_type: "lunch",
      status: false,
      Recipe: { id: 10, name: "Salad" },
    };

    mockInsert.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: newEvent, error: null }),
    });

    const res = await POST(
      makeRequest({ recipe_id: 10, date: "2025-11-07", meal_type: "lunch", status: false })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual(expect.objectContaining({ id: 50, meal_type: "lunch" }));
  });

  it("returns 500 when insert fails", async () => {
    mockInsert.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { message: "Insert failed" } }),
    });

    const res = await POST(makeRequest({ recipe_id: 1, date: "2025-11-07", meal_type: "dinner" }));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Insert failed");
  });
});
