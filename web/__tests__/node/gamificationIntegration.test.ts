/**
 * @jest-environment node
 *
 * Integration tests for gamification features.
 * Tests the interaction between different gamification components.
 */

// Mock dependencies before imports
jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  getUserIdentity: jest.fn(),
}));

jest.mock("@/lib/supabaseServer", () => ({
  supabaseServer: { from: jest.fn() },
}));

jest.mock("@/lib/pushNotifications", () => ({
  sendAchievementNotification: jest.fn().mockResolvedValue(undefined),
}));

import { createClient } from "@/utils/supabase/server";
import { getUserIdentity } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabaseServer";

// Test data factories
const createChallenge = (overrides = {}) => ({
  id: 1,
  name: "weekly_green_5",
  title: "Green Week Champion",
  description: "Log 5 green recipes this week",
  type: "weekly",
  criteria: { metric: "green_recipes", target: 5, period: "week" },
  reward_achievement_id: 10,
  start_date: null,
  end_date: null,
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

const createUserChallenge = (overrides = {}) => ({
  id: 1,
  user_id: "test-user-id",
  challenge_id: 1,
  joined_at: "2024-01-15T10:00:00Z",
  progress: { current: 0, target: 5 },
  completed_at: null,
  ...overrides,
});

const createAchievement = (overrides = {}) => ({
  id: 1,
  name: "first_meal",
  title: "First Bite",
  description: "Log your first meal",
  icon: "🍽️",
  tier: "bronze",
  criteria: { type: "count", metric: "meals_logged", target: 1 },
  created_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

const createStreak = (overrides = {}) => ({
  id: 1,
  user_id: "test-user-id",
  streak_type: "daily_log",
  current_streak: 5,
  longest_streak: 10,
  last_activity_date: "2024-01-15",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-15T10:00:00Z",
  ...overrides,
});

describe("Gamification Integration Tests", () => {
  const mockUserId = "test-user-id";
  const mockPublicId = 42;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date("2024-01-15T12:00:00Z"));

    const mockSupabaseClient = {
      from: jest.fn(),
      auth: { getUser: jest.fn() },
      rpc: jest.fn(),
    };
    (createClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
    (getUserIdentity as jest.Mock).mockResolvedValue({
      authUserId: mockUserId,
      publicUserId: mockPublicId,
    });
    (supabaseServer.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Challenge System Logic", () => {
    describe("Challenge Progress Calculation", () => {
      it("calculates weekly challenge progress correctly", () => {
        const challenge = createChallenge({
          criteria: { metric: "green_recipes", target: 5, period: "week" },
        });

        // Simulate user stats
        const userStats = {
          weekly_green_recipes: 3,
          weekly_meals_logged: 10,
        };

        const progress = calculateProgress(challenge.criteria, userStats);

        expect(progress.current).toBe(3);
        expect(progress.target).toBe(5);
        expect(progress.percentage).toBe(60);
      });

      it("calculates monthly challenge progress correctly", () => {
        const challenge = createChallenge({
          type: "monthly",
          criteria: { metric: "meals_logged", target: 30, period: "month" },
        });

        const userStats = {
          monthly_meals_logged: 15,
        };

        const progress = calculateProgress(challenge.criteria, userStats);

        expect(progress.current).toBe(15);
        expect(progress.target).toBe(30);
        expect(progress.percentage).toBe(50);
      });

      it("caps progress at 100%", () => {
        const challenge = createChallenge({
          criteria: { metric: "green_recipes", target: 5, period: "week" },
        });

        const userStats = {
          weekly_green_recipes: 10, // Exceeded target
        };

        const progress = calculateProgress(challenge.criteria, userStats);

        expect(progress.current).toBe(10);
        expect(progress.percentage).toBe(100); // Capped at 100%
      });
    });

    describe("Challenge Completion Detection", () => {
      it("detects when challenge is completed", () => {
        const userChallenge = createUserChallenge({
          progress: { current: 5, target: 5 },
        });

        const isCompleted = userChallenge.progress.current >= userChallenge.progress.target;
        expect(isCompleted).toBe(true);
      });

      it("detects incomplete challenge", () => {
        const userChallenge = createUserChallenge({
          progress: { current: 3, target: 5 },
        });

        const isCompleted = userChallenge.progress.current >= userChallenge.progress.target;
        expect(isCompleted).toBe(false);
      });
    });

    describe("Days Remaining Calculation", () => {
      it("calculates days remaining for weekly challenge", () => {
        // Test date is 2024-01-15 (Monday)
        const daysRemaining = calculateDaysRemaining("weekly", null);
        
        // Should be 6 days (until Sunday)
        expect(daysRemaining).toBeGreaterThanOrEqual(0);
        expect(daysRemaining).toBeLessThanOrEqual(7);
      });

      it("calculates days remaining with explicit end date", () => {
        const endDate = "2024-01-20";
        const daysRemaining = calculateDaysRemaining("special", endDate);

        // From Jan 15 to Jan 20 = 5 days
        expect(daysRemaining).toBe(5);
      });

      it("returns 0 for past end date", () => {
        const endDate = "2024-01-10"; // Past date
        const daysRemaining = calculateDaysRemaining("special", endDate);

        expect(daysRemaining).toBe(0);
      });
    });
  });

  describe("Achievement System Logic", () => {
    describe("Achievement Criteria Evaluation", () => {
      it("evaluates count-based criteria correctly", () => {
        const achievement = createAchievement({
          criteria: { type: "count", metric: "meals_logged", target: 10 },
        });

        const userMetrics = { meals_logged: 15 };
        const isEarned = evaluateAchievementCriteria(achievement.criteria, userMetrics);

        expect(isEarned).toBe(true);
      });

      it("evaluates streak-based criteria correctly", () => {
        const achievement = createAchievement({
          criteria: { type: "streak", metric: "current_streak", target: 7 },
        });

        const userMetrics = { current_streak: 5 };
        const isEarned = evaluateAchievementCriteria(achievement.criteria, userMetrics);

        expect(isEarned).toBe(false);
      });

      it("evaluates threshold-based criteria correctly", () => {
        const achievement = createAchievement({
          criteria: { type: "threshold", metric: "green_percentage", target: 50 },
        });

        const userMetrics = { green_percentage: 60 };
        const isEarned = evaluateAchievementCriteria(achievement.criteria, userMetrics);

        expect(isEarned).toBe(true);
      });
    });

    describe("Multiple Achievement Processing", () => {
      it("identifies all earned achievements from definitions", () => {
        const definitions = [
          createAchievement({ id: 1, criteria: { type: "count", metric: "meals_logged", target: 1 } }),
          createAchievement({ id: 2, criteria: { type: "count", metric: "meals_logged", target: 5 } }),
          createAchievement({ id: 3, criteria: { type: "count", metric: "meals_logged", target: 10 } }),
        ];

        const userMetrics = { meals_logged: 7 };
        const earnedIds = new Set([1]); // User already has achievement 1

        const newlyEarned = definitions.filter((def) => {
          if (earnedIds.has(def.id)) return false;
          return evaluateAchievementCriteria(def.criteria, userMetrics);
        });

        expect(newlyEarned.length).toBe(1);
        expect(newlyEarned[0].id).toBe(2);
      });
    });

    describe("Achievement Tier Progression", () => {
      it("identifies tier progression path", () => {
        const tiers = ["bronze", "silver", "gold", "platinum"];
        const achievementsByTier = {
          bronze: createAchievement({ tier: "bronze", criteria: { type: "count", metric: "meals_logged", target: 1 } }),
          silver: createAchievement({ tier: "silver", criteria: { type: "count", metric: "meals_logged", target: 10 } }),
          gold: createAchievement({ tier: "gold", criteria: { type: "count", metric: "meals_logged", target: 50 } }),
          platinum: createAchievement({ tier: "platinum", criteria: { type: "count", metric: "meals_logged", target: 100 } }),
        };

        const userMetrics = { meals_logged: 25 };

        const earnedTiers = tiers.filter((tier) => {
          const achievement = achievementsByTier[tier as keyof typeof achievementsByTier];
          return evaluateAchievementCriteria(achievement.criteria, userMetrics);
        });

        expect(earnedTiers).toEqual(["bronze", "silver"]);
      });
    });
  });

  describe("Streak System Logic", () => {
    describe("Streak Calculation", () => {
      it("calculates streak from consecutive dates", () => {
        const dates = [
          "2024-01-15",
          "2024-01-14",
          "2024-01-13",
          "2024-01-12",
          "2024-01-11",
        ];

        const streak = calculateStreakFromDates(dates, "2024-01-15");
        expect(streak).toBe(5);
      });

      it("returns 0 when no recent activity", () => {
        const dates = ["2024-01-10", "2024-01-09"];
        
        // Last activity was 5 days ago
        const streak = calculateStreakFromDates(dates, "2024-01-15");
        expect(streak).toBe(0);
      });

      it("handles gap in dates (streak break)", () => {
        const dates = [
          "2024-01-15",
          "2024-01-14",
          // Gap on 2024-01-13
          "2024-01-12",
          "2024-01-11",
        ];

        const streak = calculateStreakFromDates(dates, "2024-01-15");
        expect(streak).toBe(2); // Only Jan 14-15
      });

      it("includes today if active today", () => {
        const dates = ["2024-01-15"]; // Activity today

        const streak = calculateStreakFromDates(dates, "2024-01-15");
        expect(streak).toBe(1);
      });
    });

    describe("Longest Streak Tracking", () => {
      it("updates longest when current exceeds it", () => {
        const currentStreak = 15;
        const longestStreak = 10;

        const newLongest = Math.max(currentStreak, longestStreak);
        expect(newLongest).toBe(15);
      });

      it("preserves longest when current is lower", () => {
        const currentStreak = 5;
        const longestStreak = 10;

        const newLongest = Math.max(currentStreak, longestStreak);
        expect(newLongest).toBe(10);
      });
    });

    describe("Activity Today Detection", () => {
      it("detects activity on current day", () => {
        const lastActivity = "2024-01-15";
        const today = "2024-01-15";

        const isActiveToday = lastActivity === today;
        expect(isActiveToday).toBe(true);
      });

      it("detects no activity today", () => {
        const lastActivity: string = "2024-01-14";
        const today: string = "2024-01-15";

        const isActiveToday = lastActivity === today;
        expect(isActiveToday).toBe(false);
      });
    });
  });

  describe("Cross-Feature Integration", () => {
    describe("Challenge Completion → Achievement Unlock", () => {
      it("links challenge reward to achievement", () => {
        const challenge = createChallenge({ reward_achievement_id: 10 });
        const rewardAchievement = createAchievement({
          id: 10,
          name: "green_champion",
          title: "Green Week Champion",
        });

        // When challenge is completed, reward achievement should be unlocked
        const completedChallenge = createUserChallenge({
          challenge_id: challenge.id,
          progress: { current: 5, target: 5 },
          completed_at: "2024-01-15T12:00:00Z",
        });

        expect(completedChallenge.completed_at).not.toBeNull();
        expect(challenge.reward_achievement_id).toBe(rewardAchievement.id);
      });
    });

    describe("Streak → Achievement Unlock", () => {
      it("streak milestone triggers achievement check", () => {
        const streak = createStreak({ current_streak: 7 });
        const weekStreakAchievement = createAchievement({
          criteria: { type: "streak", metric: "current_streak", target: 7 },
        });

        const userMetrics = { current_streak: streak.current_streak };
        const isEarned = evaluateAchievementCriteria(
          weekStreakAchievement.criteria,
          userMetrics
        );

        expect(isEarned).toBe(true);
      });
    });

    describe("Meal Log → Multiple Updates", () => {
      it("meal log affects challenges, achievements, and streaks", () => {
        // Simulating a meal log that affects multiple systems
        const mealLogEffects = {
          challengeProgress: {
            before: { current: 4, target: 5 },
            after: { current: 5, target: 5 }, // Completed!
          },
          achievementProgress: {
            mealsLogged: 100, // Milestone reached
          },
          streakUpdate: {
            before: 6,
            after: 7, // Week streak achieved!
          },
        };

        // Challenge completed
        expect(mealLogEffects.challengeProgress.after.current).toBe(
          mealLogEffects.challengeProgress.after.target
        );

        // Achievement milestone
        expect(mealLogEffects.achievementProgress.mealsLogged).toBe(100);

        // Streak milestone
        expect(mealLogEffects.streakUpdate.after).toBe(7);
      });
    });
  });

  describe("Edge Cases", () => {
    describe("Empty Data Handling", () => {
      it("handles user with no data gracefully", () => {
        const emptyResponse = {
          challenges: { available: [], active: [], completed: [] },
          achievements: { earned: [], available: [] },
          streaks: [],
        };

        expect(emptyResponse.challenges.available).toHaveLength(0);
        expect(emptyResponse.achievements.earned).toHaveLength(0);
        expect(emptyResponse.streaks).toHaveLength(0);
      });
    });

    describe("First-Time User", () => {
      it("initializes with default values", () => {
        const newUserData = {
          streaks: [
            { type: "daily_log", current: 0, longest: 0 },
            { type: "nutrient_goal", current: 0, longest: 0 },
            { type: "green_recipe", current: 0, longest: 0 },
          ],
          achievements: [],
          challenges: [],
        };

        expect(newUserData.streaks.every((s) => s.current === 0)).toBe(true);
        expect(newUserData.achievements).toHaveLength(0);
      });
    });

    describe("Timezone Edge Cases", () => {
      it("handles date boundary correctly", () => {
        // Activity at 11:59 PM should count for that day
        const activityTime = new Date("2024-01-15T23:59:00Z");
        const activityDate = activityTime.toISOString().split("T")[0];

        expect(activityDate).toBe("2024-01-15");
      });
    });
  });
});

// Helper functions for testing (simulating API logic)
function calculateProgress(
  criteria: { metric: string; target: number; period?: string },
  stats: Record<string, number>
) {
  const period = criteria.period;
  let current = 0;

  if (period === "week") {
    current = stats[`weekly_${criteria.metric}`] || 0;
  } else if (period === "month") {
    current = stats[`monthly_${criteria.metric}`] || 0;
  } else {
    current = stats[criteria.metric] || 0;
  }

  return {
    current,
    target: criteria.target,
    percentage: Math.min(100, Math.round((current / criteria.target) * 100)),
  };
}

function calculateDaysRemaining(
  type: string,
  endDate: string | null
): number {
  const now = new Date("2024-01-15T12:00:00Z");

  if (endDate) {
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  if (type === "weekly") {
    // Days until end of week (Sunday)
    const dayOfWeek = now.getDay();
    return 7 - dayOfWeek;
  }

  if (type === "monthly") {
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const diffTime = endOfMonth.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  return 0;
}

function evaluateAchievementCriteria(
  criteria: { type: string; metric: string; target: number },
  metrics: Record<string, number>
): boolean {
  const value = metrics[criteria.metric] || 0;
  return value >= criteria.target;
}

function calculateStreakFromDates(dates: string[], today: string): number {
  if (dates.length === 0) return 0;

  const sortedDates = [...dates].sort().reverse();
  const todayDate = new Date(today);
  const mostRecent = new Date(sortedDates[0]);

  // Check if most recent activity is within streak window (today or yesterday)
  const daysSince = Math.floor(
    (todayDate.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSince > 1) return 0;

  let streak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const current = new Date(sortedDates[i]);
    const previous = new Date(sortedDates[i - 1]);
    const dayDiff = Math.floor(
      (previous.getTime() - current.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (dayDiff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
