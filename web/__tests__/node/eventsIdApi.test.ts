/**
 * @jest-environment node
 */

import { PATCH } from "@/app/api/events/[id]/route";
import { createClient } from "@/utils/supabase/server";

jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

// ------------------------------
// Mock Supabase chain
// ------------------------------
const mockAuthGetUser = jest.fn();
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockUpdate = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();

  (createClient as jest.Mock).mockResolvedValue({
    auth: { getUser: mockAuthGetUser },
    from: mockFrom,
  });

  mockFrom.mockReturnValue({
    select: mockSelect.mockReturnThis(),
    eq: mockEq.mockReturnThis(),
    update: mockUpdate.mockReturnThis(),
  });
});

// ------------------------------
// 工具函式：建立 Request
// ------------------------------
const makeRequest = (body: Record<string, unknown>): Request =>
  new Request("http://localhost/api/events/1", {
    method: "PATCH",
    body: JSON.stringify(body),
  });

// ------------------------------
// 測試
// ------------------------------
describe("PATCH /api/events/[id]", () => {
  it("returns 401 if user is not authenticated", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "no user" },
    });

    const res = await PATCH(makeRequest({ status: true }), {
      params: Promise.resolve({ id: "1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toMatch(/User not authenticated/i);
  });

  it("returns 400 if status is not boolean", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { email: "test@example.com" } },
      error: null,
    });

    mockSelect.mockResolvedValueOnce({ data: [{ id: 1 }], error: null }); // getPublicUserId

    const res = await PATCH(makeRequest({ status: "invalid" }), {
      params: Promise.resolve({ id: "1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/Invalid 'status'/i);
  });

  it("returns 200 when update succeeds", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { email: "test@example.com" } },
      error: null,
    });

    mockSelect.mockResolvedValueOnce({ data: [{ id: 88 }], error: null }); // getPublicUserId

    mockUpdate.mockReturnValueOnce({
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({
        data: [
          {
            id: 1,
            status: true,
            date: "2025-11-06",
            meal_type: "dinner",
          },
        ],
        error: null,
      }),
    });

    const res = await PATCH(makeRequest({ status: true }), {
      params: Promise.resolve({ id: "1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json[0]).toEqual(
      expect.objectContaining({
        id: 1,
        status: true,
      })
    );
  });

  it("returns 500 when supabase returns error", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { email: "test@example.com" } },
      error: null,
    });

    mockSelect.mockResolvedValueOnce({ data: [{ id: 88 }], error: null });

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
  });

  it("returns 404 when no data is returned", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { email: "test@example.com" } },
      error: null,
    });

    mockSelect.mockResolvedValueOnce({ data: [{ id: 88 }], error: null });

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
  });
});
