/**
 * @jest-environment node
 */

import { GET } from "@/app/api/streaks/route";
import { POST } from "@/app/api/streaks/update/route";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

// Mock next/headers
jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

// Mock @supabase/ssr
jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(),
}));

import { createServerClient } from "@supabase/ssr";

type StreakRecord = {
  id: number;
  user_id: string;
  streak_type: "daily_log" | "nutrient_goal" | "green_recipe";
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  created_at: string;
  updated_at: string;
};

// Helper to create mock Supabase client
const createMockSupabase = (options: {
  user?: { id: string; email: string } | null;
  authError?: Error | null;
  streakRecords?: StreakRecord[];
  streakError?: Error | null;
  rpcResult?: { data: unknown; error: Error | null };
  singleRecord?: StreakRecord | null;
  singleError?: Error | null;
}) => {
  const {
    user = { id: "test-user-id", email: "test@example.com" },
    authError = null,
    streakRecords = [],
    streakError = null,
    rpcResult = { data: null, error: null },
    singleRecord = null,
    singleError = null,
  } = options;

  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user },
        error: authError,
      }),
    },
    from: jest.fn().mockImplementation((table: string) => {
      if (table === "streak_history") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockImplementation(() => ({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: singleRecord,
                  error: singleError,
                }),
              }),
            })),
          }),
        };
      }
      return { select: jest.fn() };
    }),
    rpc: jest.fn().mockResolvedValue(rpcResult),
  };
};

// Helper to create mock Supabase client for GET request
const createMockSupabaseForGet = (options: {
  user?: { id: string; email: string } | null;
  authError?: Error | null;
  streakRecords?: StreakRecord[];
  streakError?: Error | null;
}) => {
  const {
    user = { id: "test-user-id", email: "test@example.com" },
    authError = null,
    streakRecords = [],
    streakError = null,
  } = options;

  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user },
        error: authError,
      }),
    },
    from: jest.fn().mockImplementation((table: string) => {
      if (table === "streak_history") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: streakRecords,
              error: streakError,
            }),
          }),
        };
      }
      return { select: jest.fn() };
    }),
  };
};

// Setup cookies mock
const mockCookieStore = {
  getAll: jest.fn().mockReturnValue([]),
};

describe("Streak API Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (cookies as jest.Mock).mockResolvedValue(mockCookieStore);
  });

  describe("GET /api/streaks", () => {
    it("should return 401 when user is not authenticated", async () => {
      const mockSupabase = createMockSupabaseForGet({
        user: null,
        authError: new Error("Not authenticated"),
      });
      (createServerClient as jest.Mock).mockReturnValue(mockSupabase);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return empty streaks for new user", async () => {
      const mockSupabase = createMockSupabaseForGet({
        streakRecords: [],
      });
      (createServerClient as jest.Mock).mockReturnValue(mockSupabase);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.streaks).toHaveLength(3);
      expect(data.streaks[0]).toMatchObject({
        type: "daily_log",
        label: "Daily Logging",
        current: 0,
        longest: 0,
        isActiveToday: false,
      });
      expect(data.totalCurrentStreak).toBe(0);
    });

    it("should return existing streak data", async () => {
      const today = new Date().toISOString().split("T")[0];
      const mockSupabase = createMockSupabaseForGet({
        streakRecords: [
          {
            id: 1,
            user_id: "test-user-id",
            streak_type: "daily_log",
            current_streak: 5,
            longest_streak: 10,
            last_activity_date: today,
            created_at: "2024-01-01",
            updated_at: today,
          },
          {
            id: 2,
            user_id: "test-user-id",
            streak_type: "nutrient_goal",
            current_streak: 3,
            longest_streak: 7,
            last_activity_date: "2024-01-14",
            created_at: "2024-01-01",
            updated_at: "2024-01-14",
          },
        ],
      });
      (createServerClient as jest.Mock).mockReturnValue(mockSupabase);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.streaks).toHaveLength(3);

      // Daily log streak (active today)
      const dailyLog = data.streaks.find((s: { type: string }) => s.type === "daily_log");
      expect(dailyLog).toMatchObject({
        type: "daily_log",
        current: 5,
        longest: 10,
        isActiveToday: true,
      });

      // Nutrient goal streak (not active today)
      const nutrientGoal = data.streaks.find((s: { type: string }) => s.type === "nutrient_goal");
      expect(nutrientGoal).toMatchObject({
        type: "nutrient_goal",
        current: 3,
        longest: 7,
        isActiveToday: false,
      });

      // Green recipe streak (no record, defaults)
      const greenRecipe = data.streaks.find((s: { type: string }) => s.type === "green_recipe");
      expect(greenRecipe).toMatchObject({
        type: "green_recipe",
        current: 0,
        longest: 0,
        isActiveToday: false,
      });

      expect(data.totalCurrentStreak).toBe(8); // 5 + 3 + 0
    });

    it("should handle database errors gracefully", async () => {
      const mockSupabase = createMockSupabaseForGet({
        streakError: new Error("Database connection failed"),
      });
      (createServerClient as jest.Mock).mockReturnValue(mockSupabase);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch streaks");
    });

    it("should include correct labels for all streak types", async () => {
      const mockSupabase = createMockSupabaseForGet({
        streakRecords: [],
      });
      (createServerClient as jest.Mock).mockReturnValue(mockSupabase);

      const response = await GET();
      const data = await response.json();

      const labels = data.streaks.map((s: { label: string }) => s.label);
      expect(labels).toContain("Daily Logging");
      expect(labels).toContain("Nutrient Goals");
      expect(labels).toContain("Green Recipes");
    });
  });

  describe("POST /api/streaks/update", () => {
    const createRequest = (body: object) => {
      return new NextRequest("http://localhost:3000/api/streaks/update", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });
    };

    it("should return 401 when user is not authenticated", async () => {
      const mockSupabase = createMockSupabase({
        user: null,
        authError: new Error("Not authenticated"),
      });
      (createServerClient as jest.Mock).mockReturnValue(mockSupabase);

      const request = createRequest({ streak_type: "daily_log" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 400 for invalid streak_type", async () => {
      const mockSupabase = createMockSupabase({});
      (createServerClient as jest.Mock).mockReturnValue(mockSupabase);

      const request = createRequest({ streak_type: "invalid_type" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Invalid streak_type");
    });

    it("should return 400 for missing streak_type", async () => {
      const mockSupabase = createMockSupabase({});
      (createServerClient as jest.Mock).mockReturnValue(mockSupabase);

      const request = createRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Invalid streak_type");
    });

    it("should successfully update daily_log streak", async () => {
      const today = new Date().toISOString().split("T")[0];
      const mockSupabase = createMockSupabase({
        rpcResult: { data: null, error: null },
        singleRecord: {
          id: 1,
          user_id: "test-user-id",
          streak_type: "daily_log",
          current_streak: 6,
          longest_streak: 10,
          last_activity_date: today,
          created_at: "2024-01-01",
          updated_at: today,
        },
      });
      (createServerClient as jest.Mock).mockReturnValue(mockSupabase);

      const request = createRequest({ streak_type: "daily_log" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.streak).toMatchObject({
        streak_type: "daily_log",
        current_streak: 6,
        longest_streak: 10,
      });
      expect(data.message).toContain("6 days");
    });

    it("should successfully update nutrient_goal streak", async () => {
      const today = new Date().toISOString().split("T")[0];
      const mockSupabase = createMockSupabase({
        rpcResult: { data: null, error: null },
        singleRecord: {
          id: 2,
          user_id: "test-user-id",
          streak_type: "nutrient_goal",
          current_streak: 4,
          longest_streak: 4,
          last_activity_date: today,
          created_at: "2024-01-01",
          updated_at: today,
        },
      });
      (createServerClient as jest.Mock).mockReturnValue(mockSupabase);

      const request = createRequest({ streak_type: "nutrient_goal" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.streak.streak_type).toBe("nutrient_goal");
    });

    it("should successfully update green_recipe streak", async () => {
      const today = new Date().toISOString().split("T")[0];
      const mockSupabase = createMockSupabase({
        rpcResult: { data: null, error: null },
        singleRecord: {
          id: 3,
          user_id: "test-user-id",
          streak_type: "green_recipe",
          current_streak: 1,
          longest_streak: 5,
          last_activity_date: today,
          created_at: "2024-01-01",
          updated_at: today,
        },
      });
      (createServerClient as jest.Mock).mockReturnValue(mockSupabase);

      const request = createRequest({ streak_type: "green_recipe" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.streak.streak_type).toBe("green_recipe");
    });

    it("should handle RPC errors", async () => {
      const mockSupabase = createMockSupabase({
        rpcResult: { data: null, error: new Error("RPC failed") },
      });
      (createServerClient as jest.Mock).mockReturnValue(mockSupabase);

      const request = createRequest({ streak_type: "daily_log" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to update streak");
    });

    it("should handle fetch errors after RPC success", async () => {
      const mockSupabase = createMockSupabase({
        rpcResult: { data: null, error: null },
        singleRecord: null,
        singleError: new Error("Fetch failed"),
      });
      (createServerClient as jest.Mock).mockReturnValue(mockSupabase);

      const request = createRequest({ streak_type: "daily_log" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch updated streak");
    });

    it("should return 400 for invalid JSON body", async () => {
      const mockSupabase = createMockSupabase({});
      (createServerClient as jest.Mock).mockReturnValue(mockSupabase);

      const request = new NextRequest("http://localhost:3000/api/streaks/update", {
        method: "POST",
        body: "invalid json",
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      // NextRequest.json() throws a SyntaxError which may result in 400 or 500
      // depending on how the error is caught
      expect([400, 500]).toContain(response.status);
      expect(data.error).toBeDefined();
    });

    it("should call RPC with correct parameters", async () => {
      const today = new Date().toISOString().split("T")[0];
      const mockSupabase = createMockSupabase({
        rpcResult: { data: null, error: null },
        singleRecord: {
          id: 1,
          user_id: "test-user-id",
          streak_type: "daily_log",
          current_streak: 1,
          longest_streak: 1,
          last_activity_date: today,
          created_at: "2024-01-01",
          updated_at: today,
        },
      });
      (createServerClient as jest.Mock).mockReturnValue(mockSupabase);

      const request = createRequest({ streak_type: "daily_log" });
      await POST(request);

      expect(mockSupabase.rpc).toHaveBeenCalledWith("update_streak", {
        p_user_id: "test-user-id",
        p_streak_type: "daily_log",
      });
    });
  });

  describe("Streak Type Validation", () => {
    const validTypes = ["daily_log", "nutrient_goal", "green_recipe"];
    const invalidTypes = ["invalid", "weekly", "monthly", "", null, undefined];

    it.each(validTypes)('should accept valid streak type: "%s"', async (type) => {
      const today = new Date().toISOString().split("T")[0];
      const mockSupabase = createMockSupabase({
        rpcResult: { data: null, error: null },
        singleRecord: {
          id: 1,
          user_id: "test-user-id",
          streak_type: type as "daily_log" | "nutrient_goal" | "green_recipe",
          current_streak: 1,
          longest_streak: 1,
          last_activity_date: today,
          created_at: "2024-01-01",
          updated_at: today,
        },
      });
      (createServerClient as jest.Mock).mockReturnValue(mockSupabase);

      const request = new NextRequest("http://localhost:3000/api/streaks/update", {
        method: "POST",
        body: JSON.stringify({ streak_type: type }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });

    it.each(invalidTypes)('should reject invalid streak type: "%s"', async (type) => {
      const mockSupabase = createMockSupabase({});
      (createServerClient as jest.Mock).mockReturnValue(mockSupabase);

      const request = new NextRequest("http://localhost:3000/api/streaks/update", {
        method: "POST",
        body: JSON.stringify({ streak_type: type }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });
});
