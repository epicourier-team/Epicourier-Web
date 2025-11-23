/**
 * @jest-environment node
 */

import { GET } from "@/app/api/nutrients/export/route";
import { createClient } from "@/utils/supabase/server";

jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

const mockAuthGetUser = jest.fn();
const mockFrom = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (createClient as jest.Mock).mockResolvedValue({
    auth: { getUser: mockAuthGetUser },
    from: mockFrom,
  });

  mockAuthGetUser.mockResolvedValue({
    data: { 
      user: { 
        id: "auth-user-1", 
        email: "test@example.com" 
      } 
    },
    error: null,
  });
});

describe("GET /api/nutrients/export", () => {
  const createRequest = (params: string) =>
    new Request(`http://localhost/api/nutrients/export?${params}`);

  it("returns 401 when authentication fails", async () => {
    mockAuthGetUser.mockResolvedValue({ 
      data: { user: null }, 
      error: new Error("No session") 
    });

    const res = await GET(createRequest("format=csv&start=2025-01-01&end=2025-01-31"));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toContain("User not authenticated");
  });

  it("returns 400 when format is invalid", async () => {
    const mockUserQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ 
        data: [{ id: 1 }], 
        error: null 
      }),
    };
    mockFrom.mockImplementationOnce(() => mockUserQuery);

    const res = await GET(createRequest("format=xml&start=2025-01-01&end=2025-01-31"));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("Invalid format");
  });

  it("returns 400 when start date is missing", async () => {
    const mockUserQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ 
        data: [{ id: 1 }], 
        error: null 
      }),
    };
    mockFrom.mockImplementationOnce(() => mockUserQuery);

    const res = await GET(createRequest("format=csv&end=2025-01-31"));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("start");
  });

  it("returns 400 when end date is missing", async () => {
    const mockUserQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ 
        data: [{ id: 1 }], 
        error: null 
      }),
    };
    mockFrom.mockImplementationOnce(() => mockUserQuery);

    const res = await GET(createRequest("format=csv&start=2025-01-01"));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("end");
  });

  it("returns 400 when date format is invalid", async () => {
    const mockUserQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ 
        data: [{ id: 1 }], 
        error: null 
      }),
    };
    mockFrom.mockImplementationOnce(() => mockUserQuery);

    const res = await GET(createRequest("format=csv&start=invalid-date&end=2025-01-31"));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("Invalid date format");
  });

  it("returns 400 when start date is after end date", async () => {
    const mockUserQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ 
        data: [{ id: 1 }], 
        error: null 
      }),
    };
    mockFrom.mockImplementationOnce(() => mockUserQuery);

    const res = await GET(createRequest("format=csv&start=2025-12-31&end=2025-01-01"));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("Start date must be before");
  });

  it("returns CSV data with correct headers and content", async () => {
    const mockUserQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ 
        data: [{ id: 1 }], 
        error: null 
      }),
    };

    const mockCalendarQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [
          {
            id: 1,
            date: "2025-01-15",
            meal_type: "breakfast",
            recipe_id: 1,
            Recipe: {
              id: 1,
              name: "Oatmeal",
              "Recipe-Ingredient_Map": [
                {
                  relative_unit_100: 100,
                  Ingredient: {
                    agg_fats_g: 5,
                    calories_kcal: 300,
                    carbs_g: 50,
                    protein_g: 10,
                    sugars_g: 8,
                  },
                },
              ],
            },
          },
        ],
        error: null,
      }),
    };

    mockFrom
      .mockImplementationOnce(() => mockUserQuery)
      .mockImplementationOnce(() => mockCalendarQuery);

    const res = await GET(createRequest("format=csv&start=2025-01-01&end=2025-01-31"));
    const text = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/csv");
    expect(res.headers.get("Content-Disposition")).toContain("attachment");
    expect(res.headers.get("Content-Disposition")).toContain("nutrition-2025-01-01-to-2025-01-31.csv");
    
    // Check CSV headers
    expect(text).toContain("Date,Calories (kcal),Protein (g),Carbs (g),Fats (g),Fiber (g),Sugar (g),Sodium (mg),Meal Count");
    
    // Check CSV content
    expect(text).toContain("2025-01-15");
    expect(text).toContain("300");
    expect(text).toContain("10");
    expect(text).toContain("50");
    expect(text).toContain("5");
  });

  it("returns PDF data with correct content", async () => {
    const mockUserQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ 
        data: [{ id: 1 }], 
        error: null 
      }),
    };

    const mockCalendarQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [
          {
            id: 1,
            date: "2025-01-15",
            meal_type: "breakfast",
            recipe_id: 1,
            Recipe: {
              id: 1,
              name: "Oatmeal",
              "Recipe-Ingredient_Map": [
                {
                  relative_unit_100: 100,
                  Ingredient: {
                    agg_fats_g: 5,
                    calories_kcal: 300,
                    carbs_g: 50,
                    protein_g: 10,
                    sugars_g: 8,
                  },
                },
              ],
            },
          },
        ],
        error: null,
      }),
    };

    mockFrom
      .mockImplementationOnce(() => mockUserQuery)
      .mockImplementationOnce(() => mockCalendarQuery);

    const res = await GET(createRequest("format=pdf&start=2025-01-01&end=2025-01-31"));
    const text = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/plain");
    expect(res.headers.get("Content-Disposition")).toContain("attachment");
    expect(res.headers.get("Content-Disposition")).toContain("nutrition-2025-01-01-to-2025-01-31.txt");
    
    // Check PDF content
    expect(text).toContain("NUTRITION SUMMARY REPORT");
    expect(text).toContain("Period: 2025-01-01 to 2025-01-31");
    expect(text).toContain("TOTAL NUTRIENTS");
    expect(text).toContain("DAILY AVERAGES");
    expect(text).toContain("DAILY BREAKDOWN");
    expect(text).toContain("Date: 2025-01-15");
  });

  it("handles empty data gracefully", async () => {
    const mockUserQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ 
        data: [{ id: 1 }], 
        error: null 
      }),
    };

    const mockCalendarQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    mockFrom
      .mockImplementationOnce(() => mockUserQuery)
      .mockImplementationOnce(() => mockCalendarQuery);

    const res = await GET(createRequest("format=csv&start=2025-01-01&end=2025-01-31"));
    const text = await res.text();

    expect(res.status).toBe(200);
    expect(text).toContain("Date,Calories (kcal),Protein (g)");
  });
});
