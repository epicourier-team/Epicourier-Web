import { NextRequest } from "next/server";
import { GET } from "../route";
import { supabaseServer } from "../../../lib/supabaseServer";

// ✅ mock Supabase 回傳資料
jest.mock("../../../lib/supabaseServer", () => ({
  supabaseServer: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    then: jest.fn(),
  },
}));

describe("/api/foods GET", () => {
  it("should return list of foods", async () => {
    (supabaseServer.select as jest.Mock).mockReturnValueOnce({
      data: [
        { id: 1, name: "Salmon", calories: 300 },
        { id: 2, name: "Broccoli", calories: 50 },
      ],
      error: null,
    });

    const req = new NextRequest("http://localhost:3000/api/foods");
    const res = await GET(req);
    const json = await res.json();

    expect(Array.isArray(json)).toBe(true);
    expect(json[0].name).toBe("Salmon");
    expect(res.status).toBe(200);
  });

  it("should handle Supabase error", async () => {
    (supabaseServer.select as jest.Mock).mockReturnValueOnce({
      data: null,
      error: { message: "Database error" },
    });

    const req = new NextRequest("http://localhost:3000/api/foods");
    const res = await GET(req);
    const json = await res.json();

    expect(json.error).toContain("Database error");
    expect(res.status).toBe(500);
  });
});
