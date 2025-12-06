/**
 * @jest-environment node
 */

import { PATCH } from "@/app/api/events/[id]/route";
import { createClient } from "@/utils/supabase/server";
import { syncDailyNutrientTracking } from "@/app/api/nutrients/tracking";

jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("@/app/api/nutrients/tracking", () => ({
  syncDailyNutrientTracking: jest.fn(),
}));

// ------------------------------
// 型別定義
// ------------------------------
interface CalendarEntry {
  id: number;
  date: string;
  meal_type: string;
  status: boolean;
}

// ------------------------------
// Mock Supabase 結構
// ------------------------------
const mockAuthGetUser = jest.fn();
const mockFrom = jest.fn();
const mockEq = jest.fn();
const mockUpdate = jest.fn();

const mockSyncDailyNutrientTracking = syncDailyNutrientTracking as jest.Mock;

// 工具：建立 Request
const makeRequest = (body: Record<string, unknown>): Request =>
  new Request("http://localhost/api/events/1", {
    method: "PATCH",
    body: JSON.stringify(body),
  });

// ------------------------------
// beforeEach：設定雙 from mock
// ------------------------------
beforeEach(() => {
  jest.clearAllMocks();

  // 模擬 createClient()
  (createClient as jest.Mock).mockResolvedValue({
    auth: { getUser: mockAuthGetUser },
    from: mockFrom,
  });

  // 預設授權成功
  mockAuthGetUser.mockResolvedValue({
    data: { user: { email: "test@example.com", id: "auth-user-1" } },
    error: null,
  });

  // ✅ 分別模擬 from("User") 及 from("Calendar")
  (mockFrom as jest.Mock).mockImplementation((table: string) => {
    if (table === "User") {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [{ id: 99 }], // public user id
              error: null,
            }),
          }),
        }),
      };
    }

    if (table === "Calendar") {
      return {
        update: mockUpdate.mockReturnThis(),
        eq: mockEq.mockReturnThis(),
        select: jest.fn(),
      };
    }

    throw new Error(`Unexpected table name: ${table}`);
  });
});

// ------------------------------
// 測試案例
// ------------------------------
describe("PATCH /api/events/[id]", () => {
  beforeEach(() => {
    mockSyncDailyNutrientTracking.mockResolvedValue(undefined);
  });

  it("returns 401 if user not authenticated", async () => {
    mockAuthGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "no user" },
    });

    const res = await PATCH(makeRequest({ status: true }), {
      params: Promise.resolve({ id: "1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toMatch(/User not authenticated/i);
    expect(mockSyncDailyNutrientTracking).not.toHaveBeenCalled();
  });

  it("returns 401 if authenticated user does not have an email", async () => {
    // Line 24: user has no email
    mockAuthGetUser.mockResolvedValueOnce({
      data: { user: { id: "auth-user-1", email: null } },
      error: null,
    });

    const res = await PATCH(makeRequest({ status: true }), {
      params: Promise.resolve({ id: "1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Authenticated user does not have an email.");
    expect(mockSyncDailyNutrientTracking).not.toHaveBeenCalled();
  });

  it("returns 401 if profile fetch fails", async () => {
    // Lines 35-36: profileError handling
    (mockFrom as jest.Mock).mockImplementation((table: string) => {
      if (table === "User") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: null,
                error: { message: "Profile DB error" },
              }),
            }),
          }),
        };
      }
      return { update: mockUpdate.mockReturnThis(), eq: mockEq.mockReturnThis(), select: jest.fn() };
    });

    const res = await PATCH(makeRequest({ status: true }), {
      params: Promise.resolve({ id: "1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Error fetching user profile.");
    expect(mockSyncDailyNutrientTracking).not.toHaveBeenCalled();
  });

  it("returns 401 if public user profile not found", async () => {
    // Line 40: empty publicUsers array
    (mockFrom as jest.Mock).mockImplementation((table: string) => {
      if (table === "User") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        };
      }
      return { update: mockUpdate.mockReturnThis(), eq: mockEq.mockReturnThis(), select: jest.fn() };
    });

    const res = await PATCH(makeRequest({ status: true }), {
      params: Promise.resolve({ id: "1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Public user profile not found.");
    expect(mockSyncDailyNutrientTracking).not.toHaveBeenCalled();
  });

  it("returns 401 with default error message when non-Error is thrown", async () => {
    // Line 59: err is not instanceof Error
    mockAuthGetUser.mockImplementation(() => {
      throw "string error";
    });

    const res = await PATCH(makeRequest({ status: true }), {
      params: Promise.resolve({ id: "1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
    expect(mockSyncDailyNutrientTracking).not.toHaveBeenCalled();
  });

  it("returns 400 if status is not boolean", async () => {
    const res = await PATCH(makeRequest({ status: "invalid" }), {
      params: Promise.resolve({ id: "1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/Invalid 'status'/i);
    expect(mockSyncDailyNutrientTracking).not.toHaveBeenCalled();
  });

  it("returns 200 when update succeeds", async () => {
    const updatedData: CalendarEntry[] = [
      { id: 1, date: "2025-11-06", meal_type: "dinner", status: true },
    ];

    mockUpdate.mockReturnValueOnce({
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({
        data: updatedData,
        error: null,
      }),
    });

    const res = await PATCH(makeRequest({ status: true }), {
      params: Promise.resolve({ id: "1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json[0]).toEqual(expect.objectContaining({ id: 1, status: true }));
    expect(mockSyncDailyNutrientTracking).toHaveBeenCalledWith({
      authUserId: "auth-user-1",
      date: "2025-11-06",
      publicUserId: 99,
      supabase: expect.any(Object),
    });
  });

  it("returns 200 and skips sync when entry has no date", async () => {
    // Line 93: updatedEntry.date is null/undefined
    const updatedData = [
      { id: 1, date: null, meal_type: "dinner", status: true },
    ];

    mockUpdate.mockReturnValueOnce({
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({
        data: updatedData,
        error: null,
      }),
    });

    const res = await PATCH(makeRequest({ status: true }), {
      params: Promise.resolve({ id: "1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(mockSyncDailyNutrientTracking).not.toHaveBeenCalled();
  });

  it("returns 500 when supabase update fails", async () => {
    mockUpdate.mockReturnValueOnce({
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({
        data: null,
        error: { message: "DB update failed" },
      }),
    });

    const res = await PATCH(makeRequest({ status: true }), {
      params: Promise.resolve({ id: "1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("DB update failed");
    expect(mockSyncDailyNutrientTracking).not.toHaveBeenCalled();
  });

  it("returns 404 when no data is returned", async () => {
    mockUpdate.mockReturnValueOnce({
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
    });

    const res = await PATCH(makeRequest({ status: false }), {
      params: Promise.resolve({ id: "1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toMatch(/Entry not found/i);
    expect(mockSyncDailyNutrientTracking).not.toHaveBeenCalled();
  });

  it("returns 500 when nutrient tracking sync fails", async () => {
    const updatedData: CalendarEntry[] = [
      { id: 1, date: "2025-11-06", meal_type: "dinner", status: true },
    ];

    mockUpdate.mockReturnValueOnce({
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({
        data: updatedData,
        error: null,
      }),
    });

    mockSyncDailyNutrientTracking.mockRejectedValueOnce(new Error("sync failed"));

    const res = await PATCH(makeRequest({ status: true }), {
      params: Promise.resolve({ id: "1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("sync failed");
  });

  it("returns 500 with default message when nutrient tracking sync fails with non-Error", async () => {
    const updatedData: CalendarEntry[] = [
      { id: 1, date: "2025-11-06", meal_type: "dinner", status: true },
    ];

    mockUpdate.mockReturnValueOnce({
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({
        data: updatedData,
        error: null,
      }),
    });

    mockSyncDailyNutrientTracking.mockRejectedValueOnce("non-error string");

    const res = await PATCH(makeRequest({ status: true }), {
      params: Promise.resolve({ id: "1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Failed to sync nutrient tracking for the day.");
  });
});
