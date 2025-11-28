/**
 * @jest-environment node
 */

import { GET } from "@/app/api/achievements/route";
import { POST } from "@/app/api/achievements/check/route";
import { createClient } from "@/utils/supabase/server";
import { getUserIdentity } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabaseServer";

jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  getUserIdentity: jest.fn(),
}));

jest.mock("@/lib/supabaseServer", () => ({
  supabaseServer: { from: jest.fn() },
}));

type Definition = {
  id: number;
  name: string;
  title: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  criteria: { type: "count" | "streak" | "threshold"; metric: string; target: number };
};

const asPromise = <T>(value: T) => Promise.resolve(value);

const definitionChain = (data: Definition[], error: Error | null = null) => {
  const response = { data, error };
  return {
    select: jest.fn().mockReturnValue({
      ...response,
      order: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue(response),
      }),
    }),
  };
};

const userAchievementsChain = (data: unknown, error: Error | null = null) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockResolvedValue({ data, error }),
  }),
});

const refreshAchievementsChain = (data: unknown, error: Error | null = null) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockResolvedValue({ data, error }),
  }),
});

const calendarCountChain = (count: number, error: Error | null = null) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ count, error }),
    }),
  }),
});

const greenMealsChain = (data: unknown[], error: Error | null = null) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data, error }),
    }),
  }),
});

const calendarDatesChain = (dates: string[], error: Error | null = null) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({
        data: dates.map((d) => ({ date: d })),
        error,
      }),
    }),
  }),
});

const nutrientViewsChain = (count: number, error: Error | null = null) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockResolvedValue({ count, error }),
  }),
});

const nutrientMealsChain = (data: unknown[], error: Error | null = null) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockResolvedValue({ data, error }),
  }),
});

const createRequest = (url: string, options?: RequestInit) => new Request(url, options);

describe("Achievements API", () => {
  const definition: Definition = {
    id: 1,
    name: "first_meal",
    title: "First Meal",
    description: "Log your first meal",
    icon: "utensils",
    tier: "bronze",
    criteria: { type: "count", metric: "meals_logged", target: 1 },
  };

  const mockInsert = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
    jest.clearAllMocks();

    const mockSupabaseClient = {
      from: jest.fn(),
      auth: { getUser: jest.fn() },
    };
    (createClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
    mockInsert.mockReset();
    (supabaseServer.from as jest.Mock).mockReturnValue({
      insert: mockInsert,
    });
    (getUserIdentity as jest.Mock).mockResolvedValue({
      authUserId: "uuid-1",
      publicUserId: 42,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("GET /api/achievements", () => {
    it("returns 401 when auth fails", async () => {
      (getUserIdentity as jest.Mock).mockRejectedValue(new Error("Unauthorized"));

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.error).toBe("Unauthorized");
    });

    it("returns available achievements with progress when none earned", async () => {
      const supabase = await createClient();
      (supabase.from as jest.Mock)
        // achievement_definitions
        .mockImplementationOnce(() => definitionChain([definition]))
        // user_achievements
        .mockImplementationOnce(() => userAchievementsChain([]))
        // Calendar count (meals_logged)
        .mockImplementationOnce(() => calendarCountChain(0))
        // green meals
        .mockImplementationOnce(() => greenMealsChain([]))
        // dates for streak
        .mockImplementationOnce(() => calendarDatesChain([]))
        // dashboard views
        .mockImplementationOnce(() => nutrientViewsChain(0))
        // nutrient aware meals
        .mockImplementationOnce(() => nutrientMealsChain([]));

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.earned).toHaveLength(0);
      expect(json.available).toHaveLength(1);
      expect(json.progress.first_meal.current).toBe(0);
      expect(json.progress.first_meal.target).toBe(1);
    });

    it("returns 500 when definitions query fails", async () => {
      const supabase = await createClient();
      (supabase.from as jest.Mock).mockImplementationOnce(() =>
        definitionChain([], new Error("defs fail"))
      );

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.error).toBe("defs fail");
    });

    it("returns 500 when user achievements query fails", async () => {
      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => definitionChain([definition]))
        .mockImplementationOnce(() => userAchievementsChain([], new Error("ua fail")));

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.error).toBe("ua fail");
    });

    it("keeps available list when refresh after insert fails", async () => {
      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => definitionChain([definition]))
        .mockImplementationOnce(() => userAchievementsChain([]))
        .mockImplementationOnce(() => calendarCountChain(1))
        .mockImplementationOnce(() => greenMealsChain([]))
        .mockImplementationOnce(() => calendarDatesChain(["2024-01-01"]))
        .mockImplementationOnce(() => nutrientViewsChain(0))
        .mockImplementationOnce(() => nutrientMealsChain([]))
        .mockImplementationOnce(() => refreshAchievementsChain(null, new Error("refresh fail")));

      mockInsert.mockResolvedValue({ data: null, error: null });

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.earned).toHaveLength(0);
      expect(json.available).toHaveLength(0);
    });

    it("auto-awards achievements when criteria met", async () => {
      const supabase = await createClient();
      const refreshedEarned = [
        {
          id: 10,
          user_id: "uuid-1",
          achievement_id: 1,
          earned_at: "2024-01-01T00:00:00.000Z",
          progress: { final_value: 1 },
          achievement: definition,
        },
      ];

      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => definitionChain([definition])) // defs
        .mockImplementationOnce(() => userAchievementsChain([])) // existing
        .mockImplementationOnce(() => calendarCountChain(1)) // meals_logged
        .mockImplementationOnce(() => greenMealsChain([]))
        .mockImplementationOnce(() => calendarDatesChain(["2024-01-01"]))
        .mockImplementationOnce(() => nutrientViewsChain(0))
        .mockImplementationOnce(() => nutrientMealsChain([]))
        .mockImplementationOnce(() => refreshAchievementsChain(refreshedEarned)); // refresh after insert

      mockInsert.mockResolvedValue({ data: null, error: null });

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(mockInsert).toHaveBeenCalledWith([
        {
          user_id: "uuid-1",
          achievement_id: 1,
          earned_at: "2024-01-01T00:00:00.000Z",
          progress: { final_value: 1, source: "GET /api/achievements", trigger: "auto_check" },
        },
      ]);
      expect(json.earned).toHaveLength(1);
      expect(json.available).toHaveLength(0);
      expect(json.progress).toEqual({});
    });

    it("returns progress when auto-award insert fails", async () => {
      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => definitionChain([definition]))
        .mockImplementationOnce(() => userAchievementsChain([]))
        .mockImplementationOnce(() => calendarCountChain(1))
        .mockImplementationOnce(() => greenMealsChain([]))
        .mockImplementationOnce(() => calendarDatesChain(["2024-01-01"]))
        .mockImplementationOnce(() => nutrientViewsChain(0))
        .mockImplementationOnce(() => nutrientMealsChain([]));

      mockInsert.mockResolvedValue({ data: null, error: { message: "RLS" } });

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.earned).toHaveLength(0);
      expect(json.available).toHaveLength(1);
      expect(json.progress.first_meal.current).toBe(1);
      expect(json.progress.first_meal.percentage).toBe(100);
    });
  });

  describe("POST /api/achievements/check", () => {
    it("returns 401 when auth fails", async () => {
      (getUserIdentity as jest.Mock).mockRejectedValue(new Error("Unauthorized"));
      const req = createRequest("http://localhost/api/achievements/check", {
        method: "POST",
        body: JSON.stringify({ trigger: "manual" }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.error).toBe("Unauthorized");
    });

    it("returns 400 for missing trigger", async () => {
      const req = createRequest("http://localhost/api/achievements/check", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe("Missing trigger field");
    });

    it("awards new achievements when criteria are met", async () => {
      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => definitionChain([definition])) // defs
        .mockImplementationOnce(() => userAchievementsChain([])) // already earned
        .mockImplementationOnce(() => calendarCountChain(1)) // meals_logged
        .mockImplementationOnce(() => greenMealsChain([]))
        .mockImplementationOnce(() => calendarDatesChain(["2024-01-01"]))
        .mockImplementationOnce(() => nutrientViewsChain(0))
        .mockImplementationOnce(() => nutrientMealsChain([]));

      mockInsert.mockResolvedValue({ data: null, error: null });

      const req = createRequest("http://localhost/api/achievements/check", {
        method: "POST",
        body: JSON.stringify({ trigger: "manual" }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "uuid-1",
        achievement_id: 1,
        earned_at: "2024-01-01T00:00:00.000Z",
        progress: { final_value: 1, trigger: "manual" },
      });
      expect(json.newly_earned).toHaveLength(1);
      expect(json.message).toContain("Congratulations");
    });

    it("skips insert when achievement already earned", async () => {
      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => definitionChain([definition])) // defs
        .mockImplementationOnce(() =>
          userAchievementsChain([
            {
              achievement_id: 1,
            },
          ])
        ) // already earned
        .mockImplementationOnce(() => calendarCountChain(1))
        .mockImplementationOnce(() => greenMealsChain([]))
        .mockImplementationOnce(() => calendarDatesChain(["2024-01-01"]))
        .mockImplementationOnce(() => nutrientViewsChain(0))
        .mockImplementationOnce(() => nutrientMealsChain([]));

      mockInsert.mockResolvedValue({ data: null, error: null });

      const req = createRequest("http://localhost/api/achievements/check", {
        method: "POST",
        body: JSON.stringify({ trigger: "manual" }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(mockInsert).not.toHaveBeenCalled();
      expect(json.newly_earned).toHaveLength(0);
      expect(json.message).toBe("No new achievements earned.");
    });

    it("returns 400 for invalid JSON body", async () => {
      const badReq = new Request("http://localhost/api/achievements/check", {
        method: "POST",
        body: "{",
      });

      const res = await POST(badReq);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe("Invalid JSON body");
    });

    it("returns 500 when definitions fetch fails", async () => {
      const supabase = await createClient();
      (supabase.from as jest.Mock).mockImplementationOnce(() =>
        definitionChain([], new Error("defs fail"))
      );

      const req = createRequest("http://localhost/api/achievements/check", {
        method: "POST",
        body: JSON.stringify({ trigger: "manual" }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.error).toBe("defs fail");
    });

    it("returns 500 when user achievements fetch fails", async () => {
      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => definitionChain([definition]))
        .mockImplementationOnce(() => userAchievementsChain([], new Error("ua fail")));

      const req = createRequest("http://localhost/api/achievements/check", {
        method: "POST",
        body: JSON.stringify({ trigger: "manual" }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.error).toBe("ua fail");
    });

    it("logs insert error but continues response", async () => {
      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => definitionChain([definition]))
        .mockImplementationOnce(() => userAchievementsChain([]))
        .mockImplementationOnce(() => calendarCountChain(1))
        .mockImplementationOnce(() => greenMealsChain([]))
        .mockImplementationOnce(() => calendarDatesChain(["2024-01-01"]))
        .mockImplementationOnce(() => nutrientViewsChain(0))
        .mockImplementationOnce(() => nutrientMealsChain([]));

      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      mockInsert.mockResolvedValue({ data: null, error: { message: "insert fail" } });

      const req = createRequest("http://localhost/api/achievements/check", {
        method: "POST",
        body: JSON.stringify({ trigger: "manual" }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.newly_earned).toHaveLength(0);
      expect(json.message).toBe("No new achievements earned.");
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
