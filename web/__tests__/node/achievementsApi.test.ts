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

    it("handles generic catch block error (non-Error instance)", async () => {
      (getUserIdentity as jest.Mock).mockRejectedValue("string_error");

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.error).toBe("Unauthorized");
    });

    it("continues with default stats when calculateUserStats has internal errors", async () => {
      // calculateUserStats catches errors internally and returns default stats
      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => definitionChain([definition]))
        .mockImplementationOnce(() => userAchievementsChain([]))
        // calendarCountChain throws error - but it's caught internally
        .mockImplementationOnce(() => ({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockRejectedValue(new Error("DB error")),
            }),
          }),
        }));

      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const res = await GET();
      const json = await res.json();

      // Internal errors in calculateUserStats are caught, default stats (all 0) are used
      expect(res.status).toBe(200);
      expect(consoleSpy).toHaveBeenCalled();
      expect(json.available).toHaveLength(1);
      expect(json.progress.first_meal.current).toBe(0);
      consoleSpy.mockRestore();
    });

    it("returns progress for streak type achievement", async () => {
      const streakDef: Definition = {
        id: 2,
        name: "streak_master",
        title: "Streak Master",
        description: "7 day streak",
        icon: "fire",
        tier: "silver",
        criteria: { type: "streak", metric: "streak_days", target: 7 },
      };

      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => definitionChain([streakDef]))
        .mockImplementationOnce(() => userAchievementsChain([]))
        .mockImplementationOnce(() => calendarCountChain(3))
        .mockImplementationOnce(() => greenMealsChain([]))
        .mockImplementationOnce(() =>
          calendarDatesChain(["2024-01-01", "2023-12-31", "2023-12-30"])
        )
        .mockImplementationOnce(() => nutrientViewsChain(0))
        .mockImplementationOnce(() => nutrientMealsChain([]));

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.progress.streak_master).toBeDefined();
      expect(json.progress.streak_master.current).toBe(3);
      expect(json.progress.streak_master.target).toBe(7);
    });

    it("returns progress for threshold type achievement", async () => {
      const thresholdDef: Definition = {
        id: 3,
        name: "nutrient_master",
        title: "Nutrient Master",
        description: "80% nutrient awareness",
        icon: "star",
        tier: "gold",
        criteria: { type: "threshold", metric: "nutrient_aware_percentage", target: 80 },
      };

      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => definitionChain([thresholdDef]))
        .mockImplementationOnce(() => userAchievementsChain([]))
        .mockImplementationOnce(() => calendarCountChain(10))
        .mockImplementationOnce(() => greenMealsChain([]))
        .mockImplementationOnce(() => calendarDatesChain(["2024-01-01"]))
        .mockImplementationOnce(() => nutrientViewsChain(0))
        .mockImplementationOnce(() =>
          nutrientMealsChain([
            { date: "2024-01-01" },
            { date: "2024-01-02" },
            { date: "2024-01-03" },
          ])
        );

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.progress.nutrient_master).toBeDefined();
      expect(json.progress.nutrient_master.percentage).toBeGreaterThanOrEqual(0);
    });

    it("returns progress for green_recipes metric", async () => {
      const greenDef: Definition = {
        id: 4,
        name: "eco_champ",
        title: "Eco Champ",
        description: "Log 10 green recipes",
        icon: "leaf",
        tier: "silver",
        criteria: { type: "count", metric: "green_recipes", target: 10 },
      };

      const greenMealData = [
        {
          id: 1,
          Recipe: {
            id: 1,
            "Recipe-Tag_Map": [{ Tag: { name: "sustainable" } }],
          },
        },
        {
          id: 2,
          Recipe: {
            id: 2,
            "Recipe-Tag_Map": [{ Tag: { name: "Green cooking" } }],
          },
        },
      ];

      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => definitionChain([greenDef]))
        .mockImplementationOnce(() => userAchievementsChain([]))
        .mockImplementationOnce(() => calendarCountChain(5))
        .mockImplementationOnce(() => greenMealsChain(greenMealData))
        .mockImplementationOnce(() => calendarDatesChain(["2024-01-01"]))
        .mockImplementationOnce(() => nutrientViewsChain(0))
        .mockImplementationOnce(() => nutrientMealsChain([]));

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.progress.eco_champ).toBeDefined();
      expect(json.progress.eco_champ.current).toBe(2);
    });

    it("returns progress for days_tracked metric", async () => {
      const daysDef: Definition = {
        id: 5,
        name: "daily_tracker",
        title: "Daily Tracker",
        description: "Track 30 days",
        icon: "calendar",
        tier: "gold",
        criteria: { type: "count", metric: "days_tracked", target: 30 },
      };

      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => definitionChain([daysDef]))
        .mockImplementationOnce(() => userAchievementsChain([]))
        .mockImplementationOnce(() => calendarCountChain(5))
        .mockImplementationOnce(() => greenMealsChain([]))
        .mockImplementationOnce(() =>
          calendarDatesChain(["2024-01-01", "2024-01-02", "2024-01-03", "2024-01-04", "2024-01-05"])
        )
        .mockImplementationOnce(() => nutrientViewsChain(0))
        .mockImplementationOnce(() => nutrientMealsChain([]));

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.progress.daily_tracker).toBeDefined();
      expect(json.progress.daily_tracker.current).toBe(5);
    });

    it("returns progress for dashboard_views metric", async () => {
      const viewsDef: Definition = {
        id: 6,
        name: "data_lover",
        title: "Data Lover",
        description: "View dashboard 50 times",
        icon: "chart",
        tier: "silver",
        criteria: { type: "count", metric: "dashboard_views", target: 50 },
      };

      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => definitionChain([viewsDef]))
        .mockImplementationOnce(() => userAchievementsChain([]))
        .mockImplementationOnce(() => calendarCountChain(5))
        .mockImplementationOnce(() => greenMealsChain([]))
        .mockImplementationOnce(() => calendarDatesChain(["2024-01-01"]))
        .mockImplementationOnce(() => nutrientViewsChain(15))
        .mockImplementationOnce(() => nutrientMealsChain([]));

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.progress.data_lover).toBeDefined();
      expect(json.progress.data_lover.current).toBe(15);
    });

    it("returns 0 for unknown metric", async () => {
      const unknownDef: Definition = {
        id: 7,
        name: "mystery",
        title: "Mystery",
        description: "Unknown metric",
        icon: "question",
        tier: "bronze",
        criteria: { type: "count", metric: "unknown_metric", target: 10 },
      };

      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => definitionChain([unknownDef]))
        .mockImplementationOnce(() => userAchievementsChain([]))
        .mockImplementationOnce(() => calendarCountChain(5))
        .mockImplementationOnce(() => greenMealsChain([]))
        .mockImplementationOnce(() => calendarDatesChain(["2024-01-01"]))
        .mockImplementationOnce(() => nutrientViewsChain(0))
        .mockImplementationOnce(() => nutrientMealsChain([]));

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.progress.mystery.current).toBe(0);
    });

    it("calculates broken streak correctly (last log > 1 day ago)", async () => {
      const streakDef: Definition = {
        id: 2,
        name: "streak_master",
        title: "Streak Master",
        description: "7 day streak",
        icon: "fire",
        tier: "silver",
        criteria: { type: "streak", metric: "streak_days", target: 7 },
      };

      // Today is 2024-01-01, last log is 2023-12-29 (3 days ago), streak should be 0
      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => definitionChain([streakDef]))
        .mockImplementationOnce(() => userAchievementsChain([]))
        .mockImplementationOnce(() => calendarCountChain(3))
        .mockImplementationOnce(() => greenMealsChain([]))
        .mockImplementationOnce(() =>
          calendarDatesChain(["2023-12-29", "2023-12-28", "2023-12-27"])
        )
        .mockImplementationOnce(() => nutrientViewsChain(0))
        .mockImplementationOnce(() => nutrientMealsChain([]));

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.progress.streak_master.current).toBe(0);
    });

    it("handles streak calculation with gap in consecutive days", async () => {
      const streakDef: Definition = {
        id: 2,
        name: "streak_master",
        title: "Streak Master",
        description: "7 day streak",
        icon: "fire",
        tier: "silver",
        criteria: { type: "streak", metric: "streak_days", target: 7 },
      };

      // Dates with gap: 2024-01-01, 2023-12-31, 2023-12-28 (missing 12/30 and 12/29)
      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => definitionChain([streakDef]))
        .mockImplementationOnce(() => userAchievementsChain([]))
        .mockImplementationOnce(() => calendarCountChain(3))
        .mockImplementationOnce(() => greenMealsChain([]))
        .mockImplementationOnce(() =>
          calendarDatesChain(["2024-01-01", "2023-12-31", "2023-12-28"])
        )
        .mockImplementationOnce(() => nutrientViewsChain(0))
        .mockImplementationOnce(() => nutrientMealsChain([]));

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.progress.streak_master.current).toBe(2); // Only 01-01 and 12-31 are consecutive
    });

    it("filters green recipes correctly with various tag patterns", async () => {
      const greenDef: Definition = {
        id: 4,
        name: "eco_champ",
        title: "Eco Champ",
        description: "Log 5 green recipes",
        icon: "leaf",
        tier: "silver",
        criteria: { type: "count", metric: "green_recipes", target: 5 },
      };

      const greenMealData = [
        // Should match: contains "sustainable"
        {
          id: 1,
          Recipe: {
            id: 1,
            "Recipe-Tag_Map": [{ Tag: { name: "sustainable living" } }],
          },
        },
        // Should match: contains "green"
        {
          id: 2,
          Recipe: {
            id: 2,
            "Recipe-Tag_Map": [{ Tag: { name: "GREEN" } }],
          },
        },
        // Should match: contains "eco"
        {
          id: 3,
          Recipe: {
            id: 3,
            "Recipe-Tag_Map": [{ Tag: { name: "eco-friendly" } }],
          },
        },
        // Should NOT match: no matching tags
        {
          id: 4,
          Recipe: {
            id: 4,
            "Recipe-Tag_Map": [{ Tag: { name: "vegetarian" } }],
          },
        },
        // Should NOT match: null Recipe
        { id: 5, Recipe: null },
        // Should NOT match: empty tags
        {
          id: 6,
          Recipe: {
            id: 6,
            "Recipe-Tag_Map": [],
          },
        },
      ];

      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => definitionChain([greenDef]))
        .mockImplementationOnce(() => userAchievementsChain([]))
        .mockImplementationOnce(() => calendarCountChain(6))
        .mockImplementationOnce(() => greenMealsChain(greenMealData))
        .mockImplementationOnce(() => calendarDatesChain(["2024-01-01"]))
        .mockImplementationOnce(() => nutrientViewsChain(0))
        .mockImplementationOnce(() => nutrientMealsChain([]));

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.progress.eco_champ.current).toBe(3);
    });

    it("maps earned achievements with achievement object correctly", async () => {
      const earnedWithAchievement = [
        {
          id: 10,
          user_id: "uuid-1",
          achievement_id: 1,
          earned_at: "2024-01-01T00:00:00.000Z",
          progress: { final_value: 1 },
          achievement: definition,
        },
      ];

      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => definitionChain([definition]))
        .mockImplementationOnce(() => userAchievementsChain(earnedWithAchievement))
        .mockImplementationOnce(() => calendarCountChain(5))
        .mockImplementationOnce(() => greenMealsChain([]))
        .mockImplementationOnce(() => calendarDatesChain(["2024-01-01"]))
        .mockImplementationOnce(() => nutrientViewsChain(0))
        .mockImplementationOnce(() => nutrientMealsChain([]));

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.earned).toHaveLength(1);
      expect(json.earned[0].achievement).toBeDefined();
      expect(json.earned[0].achievement.name).toBe("first_meal");
    });

    it("maps earned achievements without achievement object", async () => {
      const earnedWithoutAchievement = [
        {
          id: 10,
          user_id: "uuid-1",
          achievement_id: 1,
          earned_at: "2024-01-01T00:00:00.000Z",
          progress: { final_value: 1 },
          achievement: null,
        },
      ];

      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => definitionChain([definition]))
        .mockImplementationOnce(() => userAchievementsChain(earnedWithoutAchievement))
        .mockImplementationOnce(() => calendarCountChain(5))
        .mockImplementationOnce(() => greenMealsChain([]))
        .mockImplementationOnce(() => calendarDatesChain(["2024-01-01"]))
        .mockImplementationOnce(() => nutrientViewsChain(0))
        .mockImplementationOnce(() => nutrientMealsChain([]));

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.earned).toHaveLength(1);
      expect(json.earned[0].achievement).toBeUndefined();
    });

    it("returns 500 when outer try-catch catches unexpected error", async () => {
      const supabase = await createClient();
      // Force a synchronous error in from() to escape normal error handling
      (supabase.from as jest.Mock).mockImplementationOnce(() => {
        throw new Error("Unexpected sync error in from()");
      });

      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.error).toBe("Internal server error");
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("handles hasMetCriteria with unknown criteria type returning false", async () => {
      // Achievement with unknown criteria type - hasMetCriteria should return false
      const unknownTypeDef = {
        id: 88,
        name: "special_achievement",
        title: "Special Achievement",
        description: "Unknown criteria type",
        icon: "star",
        tier: "platinum" as const,
        criteria: { type: "special" as "count", metric: "meals_logged", target: 1 },
      };

      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => definitionChain([unknownTypeDef]))
        .mockImplementationOnce(() => userAchievementsChain([]))
        .mockImplementationOnce(() => calendarCountChain(100)) // Progress exceeds target
        .mockImplementationOnce(() => greenMealsChain([]))
        .mockImplementationOnce(() => calendarDatesChain(["2024-01-01"]))
        .mockImplementationOnce(() => nutrientViewsChain(0))
        .mockImplementationOnce(() => nutrientMealsChain([]));

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      // Even with current > target, hasMetCriteria returns false for unknown types
      // So achievement should be in available, not earned
      expect(json.available).toHaveLength(1);
      expect(json.progress.special_achievement).toBeDefined();
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

    it("handles streak type achievements", async () => {
      const streakAchievement: Definition = {
        id: 2,
        name: "weekly_warrior",
        title: "Weekly Warrior",
        description: "7 day streak",
        icon: "fire",
        tier: "silver",
        criteria: { type: "streak", metric: "streak_days", target: 7 },
      };

      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => definitionChain([streakAchievement]))
        .mockImplementationOnce(() => userAchievementsChain([]))
        .mockImplementationOnce(() => calendarCountChain(7))
        .mockImplementationOnce(() => greenMealsChain([]))
        .mockImplementationOnce(() =>
          calendarDatesChain([
            "2024-01-01",
            "2023-12-31",
            "2023-12-30",
            "2023-12-29",
            "2023-12-28",
            "2023-12-27",
            "2023-12-26",
          ])
        )
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
      expect(json.newly_earned).toHaveLength(1);
      expect(json.newly_earned[0].name).toBe("weekly_warrior");
    });

    it("handles threshold type achievements for nutrient awareness", async () => {
      const thresholdAchievement: Definition = {
        id: 3,
        name: "nutrient_guru",
        title: "Nutrient Guru",
        description: "50% nutrient awareness",
        icon: "star",
        tier: "gold",
        criteria: { type: "threshold", metric: "nutrient_aware_percentage", target: 50 },
      };

      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => definitionChain([thresholdAchievement]))
        .mockImplementationOnce(() => userAchievementsChain([]))
        .mockImplementationOnce(() => calendarCountChain(10))
        .mockImplementationOnce(() => greenMealsChain([]))
        .mockImplementationOnce(() => calendarDatesChain(["2024-01-01"]))
        .mockImplementationOnce(() => nutrientViewsChain(5))
        .mockImplementationOnce(() =>
          nutrientMealsChain([
            { date: "2024-01-01" },
            { date: "2024-01-02" },
            { date: "2024-01-03" },
            { date: "2024-01-04" },
            { date: "2024-01-05" },
          ])
        );

      mockInsert.mockResolvedValue({ data: null, error: null });

      const req = createRequest("http://localhost/api/achievements/check", {
        method: "POST",
        body: JSON.stringify({ trigger: "manual" }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.newly_earned).toHaveLength(1);
      expect(json.newly_earned[0].name).toBe("nutrient_guru");
    });
  });

  describe("Achievement metrics coverage", () => {
    it("handles green_recipes metric", async () => {
      const greenAchievement: Definition = {
        id: 4,
        name: "eco_warrior",
        title: "Eco Warrior",
        description: "Log 5 green recipes",
        icon: "leaf",
        tier: "silver",
        criteria: { type: "count", metric: "green_recipes", target: 5 },
      };

      const greenMealData = [
        {
          id: 1,
          Recipe: {
            id: 1,
            "Recipe-Tag_Map": [{ Tag: { name: "sustainable" } }],
          },
        },
        {
          id: 2,
          Recipe: {
            id: 2,
            "Recipe-Tag_Map": [{ Tag: { name: "green cooking" } }],
          },
        },
        {
          id: 3,
          Recipe: {
            id: 3,
            "Recipe-Tag_Map": [{ Tag: { name: "eco friendly" } }],
          },
        },
        {
          id: 4,
          Recipe: {
            id: 4,
            "Recipe-Tag_Map": [{ Tag: { name: "Green" } }],
          },
        },
        {
          id: 5,
          Recipe: {
            id: 5,
            "Recipe-Tag_Map": [{ Tag: { name: "ECO" } }],
          },
        },
      ];

      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => definitionChain([greenAchievement]))
        .mockImplementationOnce(() => userAchievementsChain([]))
        .mockImplementationOnce(() => calendarCountChain(5))
        .mockImplementationOnce(() => greenMealsChain(greenMealData))
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
      expect(json.newly_earned).toHaveLength(1);
    });

    it("handles days_tracked metric", async () => {
      const daysAchievement: Definition = {
        id: 5,
        name: "consistent_tracker",
        title: "Consistent Tracker",
        description: "Track 7 different days",
        icon: "calendar",
        tier: "bronze",
        criteria: { type: "count", metric: "days_tracked", target: 7 },
      };

      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => definitionChain([daysAchievement]))
        .mockImplementationOnce(() => userAchievementsChain([]))
        .mockImplementationOnce(() => calendarCountChain(10))
        .mockImplementationOnce(() => greenMealsChain([]))
        .mockImplementationOnce(() =>
          calendarDatesChain([
            "2024-01-01",
            "2024-01-02",
            "2024-01-03",
            "2024-01-04",
            "2024-01-05",
            "2024-01-06",
            "2024-01-07",
          ])
        )
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
      expect(json.newly_earned).toHaveLength(1);
    });

    it("handles dashboard_views metric", async () => {
      const viewsAchievement: Definition = {
        id: 6,
        name: "data_driven",
        title: "Data Driven",
        description: "View dashboard 10 times",
        icon: "chart",
        tier: "bronze",
        criteria: { type: "count", metric: "dashboard_views", target: 10 },
      };

      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => definitionChain([viewsAchievement]))
        .mockImplementationOnce(() => userAchievementsChain([]))
        .mockImplementationOnce(() => calendarCountChain(5))
        .mockImplementationOnce(() => greenMealsChain([]))
        .mockImplementationOnce(() => calendarDatesChain(["2024-01-01"]))
        .mockImplementationOnce(() => nutrientViewsChain(10))
        .mockImplementationOnce(() => nutrientMealsChain([]));

      mockInsert.mockResolvedValue({ data: null, error: null });

      const req = createRequest("http://localhost/api/achievements/check", {
        method: "POST",
        body: JSON.stringify({ trigger: "manual" }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.newly_earned).toHaveLength(1);
    });

    it("handles unknown metric type gracefully", async () => {
      const unknownAchievement: Definition = {
        id: 7,
        name: "mystery",
        title: "Mystery",
        description: "Unknown metric",
        icon: "question",
        tier: "bronze",
        criteria: { type: "count", metric: "unknown_metric", target: 1 },
      };

      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => definitionChain([unknownAchievement]))
        .mockImplementationOnce(() => userAchievementsChain([]))
        .mockImplementationOnce(() => calendarCountChain(5))
        .mockImplementationOnce(() => greenMealsChain([]))
        .mockImplementationOnce(() => calendarDatesChain(["2024-01-01"]))
        .mockImplementationOnce(() => nutrientViewsChain(0))
        .mockImplementationOnce(() => nutrientMealsChain([]));

      const req = createRequest("http://localhost/api/achievements/check", {
        method: "POST",
        body: JSON.stringify({ trigger: "manual" }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.newly_earned).toHaveLength(0);
    });

    it("filters out meals with no recipe", async () => {
      const greenAchievement: Definition = {
        id: 4,
        name: "eco_warrior",
        title: "Eco Warrior",
        description: "Log 1 green recipe",
        icon: "leaf",
        tier: "silver",
        criteria: { type: "count", metric: "green_recipes", target: 1 },
      };

      const mixedMealData = [
        { id: 1, Recipe: null },
        {
          id: 2,
          Recipe: {
            id: 2,
            "Recipe-Tag_Map": [{ Tag: { name: "green" } }],
          },
        },
      ];

      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => definitionChain([greenAchievement]))
        .mockImplementationOnce(() => userAchievementsChain([]))
        .mockImplementationOnce(() => calendarCountChain(2))
        .mockImplementationOnce(() => greenMealsChain(mixedMealData))
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
      expect(json.newly_earned).toHaveLength(1);
    });

    it("returns 0 streak when last logged day is more than 1 day ago", async () => {
      // System time is 2024-01-01, last log is 2023-12-25 (7 days ago)
      const streakAchievement: Definition = {
        id: 2,
        name: "weekly_warrior",
        title: "Weekly Warrior",
        description: "7 day streak",
        icon: "fire",
        tier: "silver",
        criteria: { type: "streak", metric: "streak_days", target: 7 },
      };

      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => definitionChain([streakAchievement]))
        .mockImplementationOnce(() => userAchievementsChain([]))
        .mockImplementationOnce(() => calendarCountChain(7))
        .mockImplementationOnce(() => greenMealsChain([]))
        .mockImplementationOnce(() =>
          calendarDatesChain([
            "2023-12-25",
            "2023-12-24",
            "2023-12-23",
            "2023-12-22",
            "2023-12-21",
            "2023-12-20",
            "2023-12-19",
          ])
        )
        .mockImplementationOnce(() => nutrientViewsChain(0))
        .mockImplementationOnce(() => nutrientMealsChain([]));

      const req = createRequest("http://localhost/api/achievements/check", {
        method: "POST",
        body: JSON.stringify({ trigger: "manual" }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.newly_earned).toHaveLength(0);
    });

    it("handles non-consecutive streak days correctly", async () => {
      const streakAchievement: Definition = {
        id: 2,
        name: "three_day_streak",
        title: "Three Day Streak",
        description: "3 day streak",
        icon: "fire",
        tier: "bronze",
        criteria: { type: "streak", metric: "streak_days", target: 3 },
      };

      // Dates with a gap: 2024-01-01, 2023-12-31, 2023-12-28 (gap before 12/28)
      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => definitionChain([streakAchievement]))
        .mockImplementationOnce(() => userAchievementsChain([]))
        .mockImplementationOnce(() => calendarCountChain(3))
        .mockImplementationOnce(() => greenMealsChain([]))
        .mockImplementationOnce(() =>
          calendarDatesChain(["2024-01-01", "2023-12-31", "2023-12-28"])
        )
        .mockImplementationOnce(() => nutrientViewsChain(0))
        .mockImplementationOnce(() => nutrientMealsChain([]));

      const req = createRequest("http://localhost/api/achievements/check", {
        method: "POST",
        body: JSON.stringify({ trigger: "manual" }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      // Streak should be 2 (2024-01-01 and 2023-12-31), not 3
      expect(json.newly_earned).toHaveLength(0);
    });

    it("handles achievement with unknown criteria type in checkAchievementCriteria", async () => {
      const unknownTypeAchievement = {
        id: 99,
        name: "unknown_type",
        title: "Unknown Type",
        description: "Unknown criteria type",
        icon: "question",
        tier: "bronze" as const,
        criteria: { type: "special" as "count", metric: "meals_logged", target: 1 },
      };

      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => definitionChain([unknownTypeAchievement]))
        .mockImplementationOnce(() => userAchievementsChain([]))
        .mockImplementationOnce(() => calendarCountChain(10))
        .mockImplementationOnce(() => greenMealsChain([]))
        .mockImplementationOnce(() => calendarDatesChain(["2024-01-01"]))
        .mockImplementationOnce(() => nutrientViewsChain(0))
        .mockImplementationOnce(() => nutrientMealsChain([]));

      const req = createRequest("http://localhost/api/achievements/check", {
        method: "POST",
        body: JSON.stringify({ trigger: "manual" }),
      });

      const res = await POST(req);
      const json = await res.json();

      // Unknown type should return false from checkAchievementCriteria
      expect(res.status).toBe(200);
      expect(json.newly_earned).toHaveLength(0);
    });

    it("returns 500 when outer try-catch catches unexpected error", async () => {
      const supabase = await createClient();
      // Force an error that escapes the normal flow
      (supabase.from as jest.Mock).mockImplementationOnce(() => {
        throw new Error("Unexpected sync error");
      });

      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const req = createRequest("http://localhost/api/achievements/check", {
        method: "POST",
        body: JSON.stringify({ trigger: "manual" }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.error).toBe("Internal server error");
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("continues with default stats when internal calculateUserStats error occurs", async () => {
      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => definitionChain([definition]))
        .mockImplementationOnce(() => userAchievementsChain([]))
        // Throw error in calendarCount query to trigger internal catch
        .mockImplementationOnce(() => ({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockRejectedValue(new Error("DB connection lost")),
            }),
          }),
        }));

      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const req = createRequest("http://localhost/api/achievements/check", {
        method: "POST",
        body: JSON.stringify({ trigger: "manual" }),
      });

      const res = await POST(req);
      const json = await res.json();

      // Internal errors are caught, default stats returned, criteria not met
      expect(res.status).toBe(200);
      expect(json.newly_earned).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
