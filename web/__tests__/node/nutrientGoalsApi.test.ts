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

  it("returns 401 with default message when non-Error is thrown", async () => {
    // Line 66: err is not instanceof Error
    mockAuthGetUser.mockImplementation(() => {
      throw "string error";
    });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
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

  it("returns 500 when database fetch fails", async () => {
    // Lines 82-83: error fetching goals
    const mockMaybeSingle = jest.fn().mockResolvedValue({ 
      data: null, 
      error: { message: "DB error" } 
    });
    const query = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: mockMaybeSingle,
    };
    mockFrom.mockImplementationOnce(() => query);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("DB error");
  });
});

describe("PUT /api/nutrients/goals", () => {
  it("returns 401 when authentication fails", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null }, error: new Error("No session") });

    const res = await PUT(createRequest("PUT", { calories_kcal: 2000 }));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toContain("User not authenticated");
  });

  it("returns 401 with default message when non-Error is thrown", async () => {
    // Line 96-97: err is not instanceof Error
    mockAuthGetUser.mockImplementation(() => {
      throw "string error";
    });

    const res = await PUT(createRequest("PUT", { calories_kcal: 2000 }));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 400 when JSON body is invalid", async () => {
    // Line 104: Invalid JSON body
    const req = new Request("http://localhost/api/nutrients/goals", {
      method: "PUT",
      body: "invalid json{",
    });

    const res = await PUT(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Invalid JSON body");
  });

  it("returns 400 when payload is not an object", async () => {
    // Line 38: body is a string, not an object
    const res = await PUT(createRequest("PUT", "not an object"));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Invalid payload");
  });

  it("returns 400 when field value is not a number", async () => {
    // Line 48: value is not a number
    const res = await PUT(createRequest("PUT", { calories_kcal: "not a number" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Invalid value for calories_kcal");
  });

  it("returns 400 when field value is NaN", async () => {
    // Line 48: value is NaN
    const res = await PUT(createRequest("PUT", { calories_kcal: NaN }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Invalid value for calories_kcal");
  });

  it("returns 400 when no goal fields are provided", async () => {
    const res = await PUT(createRequest("PUT", {}));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("At least one goal field");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns 500 when fetch existing goal fails", async () => {
    // Lines 119-120: fetchError handling
    const fetchMaybeSingle = jest.fn().mockResolvedValue({ 
      data: null, 
      error: { message: "Fetch error" } 
    });
    const fetchQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: fetchMaybeSingle,
    };
    mockFrom.mockImplementationOnce(() => fetchQuery);

    const res = await PUT(createRequest("PUT", { calories_kcal: 2000 }));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Fetch error");
  });

  it("returns 500 when upsert fails", async () => {
    // Lines 148-149: upsertError handling
    const fetchMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const fetchQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: fetchMaybeSingle,
    };

    const upsertSingle = jest.fn().mockResolvedValue({ 
      data: null, 
      error: { message: "Upsert error" } 
    });
    const upsertSelect = jest.fn().mockReturnValue({ single: upsertSingle });
    const upsert = jest.fn().mockReturnValue({ select: upsertSelect });
    const upsertQuery = { upsert };

    mockFrom.mockImplementationOnce(() => fetchQuery).mockImplementationOnce(() => upsertQuery);

    const res = await PUT(createRequest("PUT", { calories_kcal: 2000 }));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Upsert error");
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
