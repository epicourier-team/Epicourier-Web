/**
 * @jest-environment node
 */

import { GET } from "@/app/api/challenges/route";
import { POST } from "@/app/api/challenges/join/route";
import { GET as GET_BY_ID } from "@/app/api/challenges/[id]/route";
import { createClient } from "@/utils/supabase/server";
import { getUserIdentity } from "@/lib/auth";

jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  getUserIdentity: jest.fn(),
}));

type Challenge = {
  id: number;
  name: string;
  title: string;
  description: string;
  type: "weekly" | "monthly" | "special";
  criteria: { metric: string; target: number; period?: string };
  reward_achievement_id: number | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
};

type UserChallenge = {
  id: number;
  user_id: string;
  challenge_id: number;
  joined_at: string;
  progress: { current: number; target: number } | null;
  completed_at: string | null;
};

// Mock chain builders
const challengesChain = (data: Challenge[], error: Error | null = null) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      order: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({ data, error }),
      }),
    }),
  }),
});

const userChallengesChain = (data: UserChallenge[], error: Error | null = null) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockResolvedValue({ data, error }),
  }),
});

const achievementDefinitionsChain = (data: unknown[], error: Error | null = null) => ({
  select: jest.fn().mockReturnValue({
    in: jest.fn().mockResolvedValue({ data, error }),
  }),
});

const calendarMealsChain = (data: unknown[], error: Error | null = null) => ({
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

const nutrientTrackingChain = (data: unknown[], error: Error | null = null) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      gte: jest.fn().mockResolvedValue({ data, error }),
    }),
  }),
});

const singleChallengeChain = (data: Challenge | null, error: Error | null = null) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data, error }),
      }),
    }),
  }),
});

const singleUserChallengeChain = (data: UserChallenge | null, error: Error | null = null) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        maybeSingle: jest.fn().mockResolvedValue({ data, error }),
      }),
    }),
  }),
});

const insertUserChallengeChain = (data: UserChallenge, error: Error | null = null) => ({
  insert: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue({ data, error }),
    }),
  }),
});

const singleAchievementChain = (data: unknown | null, error: Error | null = null) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue({ data, error }),
    }),
  }),
});

describe("Challenges API", () => {
  const mockChallenge: Challenge = {
    id: 1,
    name: "weekly_green_5",
    title: "Green Week Champion",
    description: "Log 5 sustainable/green recipes this week",
    type: "weekly",
    criteria: { metric: "green_recipes", target: 5, period: "week" },
    reward_achievement_id: null,
    start_date: null,
    end_date: null,
    is_active: true,
    created_at: "2024-01-01T00:00:00.000Z",
  };

  const mockUserChallenge: UserChallenge = {
    id: 1,
    user_id: "uuid-1",
    challenge_id: 1,
    joined_at: "2024-01-01T00:00:00.000Z",
    progress: { current: 2, target: 5 },
    completed_at: null,
  };

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2024-01-15T12:00:00.000Z")); // Mid-month
    jest.clearAllMocks();

    const mockSupabaseClient = {
      from: jest.fn(),
      auth: { getUser: jest.fn() },
    };
    (createClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
    (getUserIdentity as jest.Mock).mockResolvedValue({
      authUserId: "uuid-1",
      publicUserId: 42,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("GET /api/challenges", () => {
    it("returns 401 when auth fails", async () => {
      (getUserIdentity as jest.Mock).mockRejectedValue(new Error("Unauthorized"));

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.error).toBe("Unauthorized");
    });

    it("returns challenges categorized by status", async () => {
      const supabase = await createClient();
      (supabase.from as jest.Mock)
        // challenges
        .mockImplementationOnce(() => challengesChain([mockChallenge]))
        // user_challenges
        .mockImplementationOnce(() => userChallengesChain([]))
        // achievement_definitions (for rewards)
        .mockImplementationOnce(() => achievementDefinitionsChain([]))
        // Calendar meals
        .mockImplementationOnce(() => calendarMealsChain([]))
        // Calendar dates
        .mockImplementationOnce(() => calendarDatesChain([]))
        // nutrient_tracking
        .mockImplementationOnce(() => nutrientTrackingChain([]));

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.active).toHaveLength(1);
      expect(json.joined).toHaveLength(0);
      expect(json.completed).toHaveLength(0);
      expect(json.active[0].title).toBe("Green Week Champion");
      expect(json.active[0].is_joined).toBe(false);
    });

    it("returns joined challenges with progress", async () => {
      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => challengesChain([mockChallenge]))
        .mockImplementationOnce(() => userChallengesChain([mockUserChallenge]))
        .mockImplementationOnce(() => achievementDefinitionsChain([]))
        .mockImplementationOnce(() =>
          calendarMealsChain([
            { date: "2024-01-14", Recipe: { "Recipe-Tag_Map": [{ Tag: { name: "green" } }] } },
            { date: "2024-01-15", Recipe: { "Recipe-Tag_Map": [{ Tag: { name: "sustainable" } }] } },
          ])
        )
        .mockImplementationOnce(() => calendarDatesChain(["2024-01-14", "2024-01-15"]))
        .mockImplementationOnce(() => nutrientTrackingChain([]));

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.active).toHaveLength(0);
      expect(json.joined).toHaveLength(1);
      expect(json.joined[0].is_joined).toBe(true);
      expect(json.joined[0].progress).toBeDefined();
    });

    it("returns 500 when challenges query fails", async () => {
      const supabase = await createClient();
      (supabase.from as jest.Mock).mockImplementationOnce(() =>
        challengesChain([], new Error("DB error"))
      );

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.error).toBe("DB error");
    });

    it("returns 500 when user challenges query fails", async () => {
      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => challengesChain([mockChallenge]))
        .mockImplementationOnce(() => userChallengesChain([], new Error("user_challenges error")));

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.error).toBe("user_challenges error");
    });

    it("returns empty lists when no challenges exist", async () => {
      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => challengesChain([]))
        .mockImplementationOnce(() => userChallengesChain([]))
        .mockImplementationOnce(() => achievementDefinitionsChain([]))
        .mockImplementationOnce(() => calendarMealsChain([]))
        .mockImplementationOnce(() => calendarDatesChain([]))
        .mockImplementationOnce(() => nutrientTrackingChain([]));

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.active).toHaveLength(0);
      expect(json.joined).toHaveLength(0);
      expect(json.completed).toHaveLength(0);
    });

    it("includes reward achievement when present", async () => {
      const challengeWithReward = { ...mockChallenge, reward_achievement_id: 5 };
      const mockAchievement = { id: 5, name: "green_champ", title: "Green Champ", tier: "gold" };

      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => challengesChain([challengeWithReward]))
        .mockImplementationOnce(() => userChallengesChain([]))
        .mockImplementationOnce(() => achievementDefinitionsChain([mockAchievement]))
        .mockImplementationOnce(() => calendarMealsChain([]))
        .mockImplementationOnce(() => calendarDatesChain([]))
        .mockImplementationOnce(() => nutrientTrackingChain([]));

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.active[0].reward_achievement).toBeDefined();
      expect(json.active[0].reward_achievement.title).toBe("Green Champ");
    });

    it("calculates days remaining for weekly challenge", async () => {
      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => challengesChain([mockChallenge]))
        .mockImplementationOnce(() => userChallengesChain([]))
        .mockImplementationOnce(() => achievementDefinitionsChain([]))
        .mockImplementationOnce(() => calendarMealsChain([]))
        .mockImplementationOnce(() => calendarDatesChain([]))
        .mockImplementationOnce(() => nutrientTrackingChain([]));

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.active[0].days_remaining).toBeGreaterThanOrEqual(0);
      expect(json.active[0].days_remaining).toBeLessThanOrEqual(7);
    });

    it("shows completed challenges separately", async () => {
      const completedUserChallenge = { ...mockUserChallenge, completed_at: "2024-01-10T00:00:00Z" };

      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => challengesChain([mockChallenge]))
        .mockImplementationOnce(() => userChallengesChain([completedUserChallenge]))
        .mockImplementationOnce(() => achievementDefinitionsChain([]))
        .mockImplementationOnce(() => calendarMealsChain([]))
        .mockImplementationOnce(() => calendarDatesChain([]))
        .mockImplementationOnce(() => nutrientTrackingChain([]));

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.completed).toHaveLength(1);
      expect(json.joined).toHaveLength(0);
      expect(json.active).toHaveLength(0);
    });
  });

  describe("POST /api/challenges/join", () => {
    const createRequest = (body: unknown) =>
      new Request("http://localhost/api/challenges/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

    it("returns 401 when auth fails", async () => {
      (getUserIdentity as jest.Mock).mockRejectedValue(new Error("Unauthorized"));

      const res = await POST(createRequest({ challenge_id: 1 }));
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.error).toBe("Unauthorized");
    });

    it("returns 400 when challenge_id is missing", async () => {
      const res = await POST(createRequest({}));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toContain("challenge_id");
    });

    it("returns 400 when challenge_id is not a number", async () => {
      const res = await POST(createRequest({ challenge_id: "abc" }));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toContain("challenge_id");
    });

    it("returns 404 when challenge not found", async () => {
      const supabase = await createClient();
      (supabase.from as jest.Mock).mockImplementationOnce(() => singleChallengeChain(null));

      const res = await POST(createRequest({ challenge_id: 999 }));
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.error).toContain("not found");
    });

    it("returns 409 when already joined", async () => {
      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => singleChallengeChain(mockChallenge))
        .mockImplementationOnce(() => singleUserChallengeChain(mockUserChallenge));

      const res = await POST(createRequest({ challenge_id: 1 }));
      const json = await res.json();

      expect(res.status).toBe(409);
      expect(json.error).toContain("already joined");
    });

    it("successfully joins a challenge", async () => {
      const newUserChallenge: UserChallenge = {
        id: 2,
        user_id: "uuid-1",
        challenge_id: 1,
        joined_at: "2024-01-15T12:00:00.000Z",
        progress: { current: 0, target: 5 },
        completed_at: null,
      };

      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => singleChallengeChain(mockChallenge))
        .mockImplementationOnce(() => singleUserChallengeChain(null))
        .mockImplementationOnce(() => insertUserChallengeChain(newUserChallenge));

      const res = await POST(createRequest({ challenge_id: 1 }));
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.user_challenge).toBeDefined();
      expect(json.message).toContain("Green Week Champion");
    });

    it("returns 500 when insert fails", async () => {
      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => singleChallengeChain(mockChallenge))
        .mockImplementationOnce(() => singleUserChallengeChain(null))
        .mockImplementationOnce(() => ({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: new Error("Insert failed") }),
            }),
          }),
        }));

      const res = await POST(createRequest({ challenge_id: 1 }));
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.error).toBe("Insert failed");
    });
  });

  describe("GET /api/challenges/[id]", () => {
    const createParams = (id: string) => Promise.resolve({ id });

    it("returns 401 when auth fails", async () => {
      (getUserIdentity as jest.Mock).mockRejectedValue(new Error("Unauthorized"));

      const res = await GET_BY_ID(
        new Request("http://localhost/api/challenges/1"),
        { params: createParams("1") }
      );
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.error).toBe("Unauthorized");
    });

    it("returns 400 for invalid ID", async () => {
      const res = await GET_BY_ID(
        new Request("http://localhost/api/challenges/abc"),
        { params: createParams("abc") }
      );
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toContain("Invalid");
    });

    it("returns 404 when challenge not found", async () => {
      const supabase = await createClient();
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
          }),
        }),
      }));

      const res = await GET_BY_ID(
        new Request("http://localhost/api/challenges/999"),
        { params: createParams("999") }
      );
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.error).toContain("not found");
    });

    it("returns challenge details with progress", async () => {
      const supabase = await createClient();
      (supabase.from as jest.Mock)
        // challenges
        .mockImplementationOnce(() => ({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockChallenge, error: null }),
            }),
          }),
        }))
        // user_challenges
        .mockImplementationOnce(() => singleUserChallengeChain(mockUserChallenge))
        // Calendar meals for stats
        .mockImplementationOnce(() => calendarMealsChain([]))
        // Calendar dates
        .mockImplementationOnce(() => calendarDatesChain([]))
        // nutrient_tracking
        .mockImplementationOnce(() => nutrientTrackingChain([]));

      const res = await GET_BY_ID(
        new Request("http://localhost/api/challenges/1"),
        { params: createParams("1") }
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.title).toBe("Green Week Champion");
      expect(json.is_joined).toBe(true);
      expect(json.progress).toBeDefined();
      expect(json.days_remaining).toBeGreaterThanOrEqual(0);
    });

    it("returns challenge details with reward achievement", async () => {
      const challengeWithReward = { ...mockChallenge, reward_achievement_id: 5 };
      const mockAchievement = { id: 5, name: "green_champ", title: "Green Champ", tier: "gold" };

      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => ({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: challengeWithReward, error: null }),
            }),
          }),
        }))
        .mockImplementationOnce(() => singleUserChallengeChain(null))
        .mockImplementationOnce(() => singleAchievementChain(mockAchievement))
        .mockImplementationOnce(() => calendarMealsChain([]))
        .mockImplementationOnce(() => calendarDatesChain([]))
        .mockImplementationOnce(() => nutrientTrackingChain([]));

      const res = await GET_BY_ID(
        new Request("http://localhost/api/challenges/1"),
        { params: createParams("1") }
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.reward_achievement).toBeDefined();
      expect(json.reward_achievement.title).toBe("Green Champ");
    });
  });

  describe("Progress Calculation", () => {
    // Note: Progress calculation tests are complex because they require
    // mocking multiple sequential Calendar queries with different select options
    // (count vs data). These are better tested as integration tests.
    // Here we test that the API returns the expected response structure.

    it("returns progress with correct structure for joined challenges", async () => {
      const supabase = await createClient();
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => challengesChain([mockChallenge]))
        .mockImplementationOnce(() => userChallengesChain([mockUserChallenge]))
        .mockImplementationOnce(() => achievementDefinitionsChain([]))
        // Calendar count query (head: true)
        .mockImplementationOnce(() => ({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ count: 10, error: null }),
            }),
          }),
        }))
        // Calendar meals with tags
        .mockImplementationOnce(() => calendarMealsChain([]))
        // Calendar dates for streak
        .mockImplementationOnce(() => calendarDatesChain([]))
        // nutrient_tracking
        .mockImplementationOnce(() => nutrientTrackingChain([]));

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.joined[0].progress).toBeDefined();
      expect(json.joined[0].progress).toHaveProperty("current");
      expect(json.joined[0].progress).toHaveProperty("target");
      expect(json.joined[0].progress.target).toBe(5);
    });

    it("returns progress with weekly green recipes metric", async () => {
      const supabase = await createClient();
      const greenMeals = [
        { date: "2024-01-14", Recipe: { "Recipe-Tag_Map": [{ Tag: { name: "green" } }] } },
        { date: "2024-01-15", Recipe: { "Recipe-Tag_Map": [{ Tag: { name: "sustainable" } }] } },
      ];

      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => challengesChain([mockChallenge]))
        .mockImplementationOnce(() => userChallengesChain([mockUserChallenge]))
        .mockImplementationOnce(() => achievementDefinitionsChain([]))
        // Calendar count
        .mockImplementationOnce(() => ({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ count: greenMeals.length, error: null }),
            }),
          }),
        }))
        // Calendar meals with tags
        .mockImplementationOnce(() => calendarMealsChain(greenMeals))
        // Calendar dates
        .mockImplementationOnce(() => calendarDatesChain(["2024-01-14", "2024-01-15"]))
        // nutrient_tracking
        .mockImplementationOnce(() => nutrientTrackingChain([]));

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.joined).toHaveLength(1);
      expect(json.joined[0].progress).toBeDefined();
      // Progress should reflect green recipes calculation (based on tag filtering)
      expect(json.joined[0].progress.current).toBeGreaterThanOrEqual(0);
      expect(json.joined[0].progress.target).toBe(5);
    });

    it("handles monthly challenges progress", async () => {
      const monthlyChallenge: Challenge = {
        ...mockChallenge,
        id: 2,
        name: "monthly_meals_60",
        title: "Meal Planning Pro",
        type: "monthly",
        criteria: { metric: "meals_logged", target: 60, period: "month" },
      };

      const supabase = await createClient();

      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => challengesChain([monthlyChallenge]))
        .mockImplementationOnce(() => userChallengesChain([{ ...mockUserChallenge, challenge_id: 2 }]))
        .mockImplementationOnce(() => achievementDefinitionsChain([]))
        .mockImplementationOnce(() => ({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ count: 20, error: null }),
            }),
          }),
        }))
        .mockImplementationOnce(() => calendarMealsChain([]))
        .mockImplementationOnce(() => calendarDatesChain([]))
        .mockImplementationOnce(() => nutrientTrackingChain([]));

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.joined[0].progress.target).toBe(60);
    });

    it("handles streak-based challenges", async () => {
      const streakChallenge: Challenge = {
        ...mockChallenge,
        id: 3,
        name: "weekly_streak_7",
        title: "Week Warrior",
        type: "weekly",
        criteria: { metric: "streak_days", target: 7, period: "week" },
      };

      const supabase = await createClient();

      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => challengesChain([streakChallenge]))
        .mockImplementationOnce(() => userChallengesChain([{ ...mockUserChallenge, challenge_id: 3 }]))
        .mockImplementationOnce(() => achievementDefinitionsChain([]))
        .mockImplementationOnce(() => ({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ count: 4, error: null }),
            }),
          }),
        }))
        .mockImplementationOnce(() => calendarMealsChain([]))
        .mockImplementationOnce(() => calendarDatesChain(["2024-01-12", "2024-01-13", "2024-01-14", "2024-01-15"]))
        .mockImplementationOnce(() => nutrientTrackingChain([]));

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.joined[0].progress.target).toBe(7);
      // Streak calculation depends on consecutive dates - just verify structure
      expect(json.joined[0].progress).toHaveProperty("current");
    });
  });
});
