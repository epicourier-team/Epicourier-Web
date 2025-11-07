/**
 * @jest-environment node
 */

import { GET } from "@/app/api/recommendations/route";
import { supabaseServer } from "@/lib/supabaseServer";

jest.mock("@/lib/supabaseServer", () => ({
  supabaseServer: {
    from: jest.fn(),
  },
}));

// ------------------------------
// 全域 Mock
// ------------------------------
const mockSelect = jest.fn();
const mockLimit = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();

  (supabaseServer.from as jest.Mock).mockReturnValue({
    select: mockSelect.mockReturnThis(),
    limit: mockLimit.mockReturnThis(),
  });
});

// ------------------------------
// 測試案例
// ------------------------------
describe("GET /api/recommendations", () => {
  it("returns 200 and 3 random recipes when query succeeds", async () => {
    const mockData = [
      { id: 1, name: "Salad" },
      { id: 2, name: "Soup" },
      { id: 3, name: "Pasta" },
      { id: 4, name: "Rice" },
      { id: 5, name: "Steak" },
    ];

    mockLimit.mockResolvedValue({ data: mockData, error: null });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(json)).toBe(true);
    expect(json.length).toBeLessThanOrEqual(3);
    expect(json[0]).toHaveProperty("name");
  });

  it("returns 500 if Supabase returns error", async () => {
    mockLimit.mockResolvedValue({
      data: null,
      error: { message: "Query failed" },
    });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Query failed");
  });
});
