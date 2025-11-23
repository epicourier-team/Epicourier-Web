/**
 * @jest-environment node
 */

import { GET, PUT } from "@/app/api/nutrients/goals/route";
import { createClient } from "@/utils/supabase/server";

jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

const mockAuthGetUser = jest.fn();
const mockFrom = jest.fn();

const createRequest = (method: string, body?: unknown) =>
  new Request("http://localhost/api/nutrients/goals", {
    method,
    body: body ? JSON.stringify(body) : undefined,
  });

beforeEach(() => {
  jest.clearAllMocks();
  (createClient as jest.Mock).mockResolvedValue({
    auth: { getUser: mockAuthGetUser },
    from: mockFrom,
  });

  mockAuthGetUser.mockResolvedValue({
    data: { user: { id: "auth-user-1" } },
    error: null,
  });
});

describe("GET /api/nutrients/goals", () => {
  it("returns 401 when authentication fails", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null }, error: new Error("No session") });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toContain("User not authenticated");
  });

  it("returns null goal when no record exists", async () => {
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const query = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: mockMaybeSingle,
    };
    mockFrom.mockImplementationOnce(() => query);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ goal: null });
    expect(mockMaybeSingle).toHaveBeenCalled();
  });
});

describe("PUT /api/nutrients/goals", () => {
  it("returns 400 when no goal fields are provided", async () => {
    const res = await PUT(createRequest("PUT", {}));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("At least one goal field");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("merges existing values and upserts new goals", async () => {
    const existingGoal = {
      calories_kcal: 2000,
      protein_g: 150,
      carbs_g: 240,
      fats_g: 70,
      sodium_mg: 1800,
      fiber_g: 30,
      created_at: "2025-11-20T00:00:00Z",
    };

    const updatedGoal = {
      ...existingGoal,
      calories_kcal: 2200,
      protein_g: 160,
      updated_at: "2025-11-21T00:00:00Z",
      user_id: "auth-user-1",
    };

    const fetchMaybeSingle = jest.fn().mockResolvedValue({ data: existingGoal, error: null });
    const fetchQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: fetchMaybeSingle,
    };

    const upsertSingle = jest.fn().mockResolvedValue({ data: updatedGoal, error: null });
    const upsertSelect = jest.fn().mockReturnValue({ single: upsertSingle });
    const upsert = jest.fn().mockReturnValue({ select: upsertSelect });
    const upsertQuery = { upsert };

    mockFrom.mockImplementationOnce(() => fetchQuery).mockImplementationOnce(() => upsertQuery);

    const payload = { calories_kcal: 2200, protein_g: 160 };
    const res = await PUT(createRequest("PUT", payload));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.goal).toEqual(updatedGoal);
    expect(fetchMaybeSingle).toHaveBeenCalled();
    expect(upsert).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          user_id: "auth-user-1",
          calories_kcal: 2200,
          protein_g: 160,
          carbs_g: existingGoal.carbs_g,
          fats_g: existingGoal.fats_g,
          sodium_mg: existingGoal.sodium_mg,
          fiber_g: existingGoal.fiber_g,
        }),
      ],
      { onConflict: "user_id" }
    );
    expect(upsertSelect).toHaveBeenCalledWith(
      "user_id, calories_kcal, protein_g, carbs_g, fats_g, sodium_mg, fiber_g, created_at, updated_at"
    );
    expect(upsertSingle).toHaveBeenCalled();
  });
});
