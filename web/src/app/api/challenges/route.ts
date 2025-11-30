import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getUserIdentity } from "@/lib/auth";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type {
  Challenge,
  ChallengeWithStatus,
  ChallengeProgress,
  ChallengesResponse,
  Achievement,
} from "@/types/data";

type UserChallengeRow = {
  id: number;
  user_id: string;
  challenge_id: number;
  joined_at: string;
  progress: ChallengeProgress | null;
  completed_at: string | null;
};

type CalendarMealWithTags = {
  date: string | null;
  Recipe?: {
    "Recipe-Tag_Map"?: Array<{
      RecipeTag?: { name?: string | null } | null;
    }>;
  } | null;
};

/**
 * GET /api/challenges
 *
 * Returns all challenges for the current user:
 * - active: Array of active challenges user hasn't joined
 * - joined: Array of challenges user has joined (in progress)
 * - completed: Array of challenges user has completed
 *
 * Each challenge includes progress data and days remaining.
 */
export async function GET() {
  const supabase = await createClient();
  let publicUserId: number;
  let authUserId: string;

  try {
    ({ publicUserId, authUserId } = await getUserIdentity(supabase));
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unauthorized";
    console.warn("GET /api/challenges auth error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 401 });
  }

  try {
    // Fetch all active challenges
    const { data: challenges, error: challengesError } = await supabase
      .from("challenges")
      .select("*")
      .eq("is_active", true)
      .order("type", { ascending: true })
      .order("name", { ascending: true });

    if (challengesError) {
      console.error("Error fetching challenges:", challengesError.message);
      return NextResponse.json({ error: challengesError.message }, { status: 500 });
    }

    // Fetch user's challenge participation
    const { data: userChallenges, error: userChallengesError } = await supabase
      .from("user_challenges")
      .select("*")
      .eq("user_id", authUserId);

    if (userChallengesError) {
      console.error("Error fetching user challenges:", userChallengesError.message);
      return NextResponse.json({ error: userChallengesError.message }, { status: 500 });
    }

    // Fetch reward achievements for challenges that have them
    const rewardIds = (challenges ?? [])
      .map((c) => c.reward_achievement_id)
      .filter((id): id is number => id !== null);

    let rewardAchievements: Achievement[] = [];
    if (rewardIds.length > 0) {
      const { data: rewards, error: rewardsError } = await supabase
        .from("achievement_definitions")
        .select("*")
        .in("id", rewardIds);

      if (!rewardsError && rewards) {
        rewardAchievements = rewards as Achievement[];
      }
    }

    // Calculate user stats for progress
    const stats = await calculateUserStats(supabase, publicUserId, authUserId);

    // Build challenge maps
    const userChallengeMap = new Map<number, UserChallengeRow>();
    (userChallenges ?? []).forEach((uc) => {
      userChallengeMap.set(uc.challenge_id, uc as UserChallengeRow);
    });

    const rewardMap = new Map<number, Achievement>();
    rewardAchievements.forEach((a) => rewardMap.set(a.id, a));

    // Categorize challenges
    const active: ChallengeWithStatus[] = [];
    const joined: ChallengeWithStatus[] = [];
    const completed: ChallengeWithStatus[] = [];

    // Collect progress updates for joined challenges
    const progressUpdates: Array<{
      id: number;
      progress: ChallengeProgress;
      isCompleted: boolean;
    }> = [];

    for (const challenge of challenges ?? []) {
      const userChallenge = userChallengeMap.get(challenge.id);
      const isJoined = !!userChallenge;
      const isCompleted =
        userChallenge?.completed_at !== null && userChallenge?.completed_at !== undefined;

      // Calculate progress
      const progress = calculateProgress(challenge as Challenge, stats);
      const daysRemaining = calculateDaysRemaining(challenge as Challenge);

      // Track progress updates for joined but not completed challenges
      if (isJoined && !isCompleted && userChallenge) {
        const newlyCompleted = progress.current >= progress.target;
        progressUpdates.push({
          id: userChallenge.id,
          progress,
          isCompleted: newlyCompleted,
        });
      }

      const challengeWithStatus: ChallengeWithStatus = {
        ...(challenge as Challenge),
        is_joined: isJoined,
        progress,
        reward_achievement: challenge.reward_achievement_id
          ? rewardMap.get(challenge.reward_achievement_id)
          : undefined,
        days_remaining: daysRemaining,
      };

      if (isCompleted) {
        completed.push(challengeWithStatus);
      } else if (isJoined) {
        joined.push(challengeWithStatus);
      } else {
        active.push(challengeWithStatus);
      }
    }

    // Sync progress to database for joined challenges (fire-and-forget, don't block response)
    if (progressUpdates.length > 0) {
      syncProgressToDatabase(supabase, progressUpdates).catch((err) => {
        console.error("Error syncing challenge progress to database:", err);
      });
    }

    const response: ChallengesResponse = {
      active,
      joined,
      completed,
    };

    return NextResponse.json(response);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("GET /api/challenges error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * Calculate user statistics for challenge progress
 */
async function calculateUserStats(
  supabase: SupabaseClient<Database>,
  publicUserId: number,
  authUserId: string
) {
  const stats = {
    meals_logged: 0,
    green_recipes: 0,
    nutrient_goal_days: 0,
    streak_days: 0,
    // Weekly stats
    weekly_meals_logged: 0,
    weekly_green_recipes: 0,
    weekly_unique_days: 0, // Number of unique days with meals this week (for Week Warrior)
    // Monthly stats
    monthly_meals_logged: 0,
    monthly_green_recipes: 0,
    monthly_nutrient_goal_days: 0,
  };

  try {
    const now = new Date();
    const startOfWeekDate = getStartOfWeek(now);
    const startOfMonthDate = getStartOfMonth(now);

    // Convert to YYYY-MM-DD strings for reliable date comparison
    // This avoids timezone issues when comparing with database DATE type
    const startOfWeekStr = toDateString(startOfWeekDate);
    const startOfMonthStr = toDateString(startOfMonthDate);

    // Count total meals logged
    const { count: mealsCount, error: mealsError } = await supabase
      .from("Calendar")
      .select("*", { count: "exact", head: true })
      .eq("user_id", publicUserId)
      .eq("status", true);

    if (!mealsError && mealsCount !== null) {
      stats.meals_logged = mealsCount;
    }

    // Get all meals for this user (status=true) for counting
    const { data: allMeals, error: allMealsError } = await supabase
      .from("Calendar")
      .select("id, date")
      .eq("user_id", publicUserId)
      .eq("status", true);

    if (!allMealsError && allMeals) {
      // Weekly stats - use string comparison for YYYY-MM-DD dates
      const weeklyMeals = allMeals.filter((meal) => meal.date && meal.date >= startOfWeekStr);
      stats.weekly_meals_logged = weeklyMeals.length;

      // Count unique days with meals this week (for Week Warrior streak challenge)
      const weeklyUniqueDays = new Set(
        weeklyMeals.map((m) => m.date).filter((d): d is string => d !== null)
      );
      stats.weekly_unique_days = weeklyUniqueDays.size;

      // Monthly stats
      stats.monthly_meals_logged = allMeals.filter(
        (meal) => meal.date && meal.date >= startOfMonthStr
      ).length;
    }

    // Get meals with tags for green recipe counting (separate query)
    // Note: The tag table is named "RecipeTag", not "Tag"
    const { data: meals, error: mealsDataError } = await supabase
      .from("Calendar")
      .select(
        `
        date,
        Recipe (
          "Recipe-Tag_Map" (
            RecipeTag (name)
          )
        )
      `
      )
      .eq("user_id", publicUserId)
      .eq("status", true);

    if (!mealsDataError && meals) {
      const mealsTyped = meals as CalendarMealWithTags[];

      // Count green recipes
      stats.green_recipes = mealsTyped.filter((meal) => {
        return meal.Recipe?.["Recipe-Tag_Map"]?.some((tm) => {
          const tagName = tm.RecipeTag?.name?.toLowerCase() || "";
          return (
            tagName.includes("sustainable") || tagName.includes("green") || tagName.includes("eco")
          );
        });
      }).length;

      // Weekly green recipes
      stats.weekly_green_recipes = mealsTyped.filter((meal) => {
        if (!meal.date || meal.date < startOfWeekStr) return false;
        return meal.Recipe?.["Recipe-Tag_Map"]?.some((tm) => {
          const tagName = tm.RecipeTag?.name?.toLowerCase() || "";
          return (
            tagName.includes("sustainable") || tagName.includes("green") || tagName.includes("eco")
          );
        });
      }).length;

      // Monthly green recipes
      stats.monthly_green_recipes = mealsTyped.filter((meal) => {
        if (!meal.date || meal.date < startOfMonthStr) return false;
        return meal.Recipe?.["Recipe-Tag_Map"]?.some((tm) => {
          const tagName = tm.RecipeTag?.name?.toLowerCase() || "";
          return (
            tagName.includes("sustainable") || tagName.includes("green") || tagName.includes("eco")
          );
        });
      }).length;
    }

    // Calculate streak
    const { data: calendarDates, error: datesError } = await supabase
      .from("Calendar")
      .select("date")
      .eq("user_id", publicUserId)
      .eq("status", true);

    if (!datesError && calendarDates) {
      const uniqueDates = new Set(
        calendarDates.map((c) => c.date).filter((d): d is string => d !== null)
      );
      const datesArray = Array.from(uniqueDates);
      stats.streak_days = calculateStreak(datesArray);
    }

    // Count nutrient goal achievement days (from nutrient_tracking)
    const { data: nutrientData, error: nutrientError } = await supabase
      .from("nutrient_tracking")
      .select("date")
      .eq("user_id", authUserId)
      .gte("date", startOfMonthStr);

    if (!nutrientError && nutrientData) {
      // Simplified: count days with any nutrient tracking as "goal days"
      const uniqueNutrientDays = new Set(nutrientData.map((n) => n.date));
      stats.monthly_nutrient_goal_days = uniqueNutrientDays.size;
      stats.nutrient_goal_days = uniqueNutrientDays.size;
    }
  } catch (err) {
    console.error("Error calculating user stats:", err);
  }

  return stats;
}

/**
 * Calculate progress for a specific challenge
 */
function calculateProgress(challenge: Challenge, stats: Record<string, number>): ChallengeProgress {
  const { criteria } = challenge;
  const period = criteria.period;
  let current = 0;

  // Get the appropriate stat based on metric and period
  if (period === "week") {
    switch (criteria.metric) {
      case "meals_logged":
        current = stats.weekly_meals_logged || 0;
        break;
      case "green_recipes":
        current = stats.weekly_green_recipes || 0;
        break;
      case "streak_days":
        // For weekly streak challenges, use the number of unique days with meals this week
        // This makes more sense for a weekly challenge than requiring consecutive days
        current = stats.weekly_unique_days || 0;
        break;
      default:
        current = 0;
    }
  } else if (period === "month") {
    switch (criteria.metric) {
      case "meals_logged":
        current = stats.monthly_meals_logged || 0;
        break;
      case "green_recipes":
        current = stats.monthly_green_recipes || 0;
        break;
      case "nutrient_goal_days":
        current = stats.monthly_nutrient_goal_days || 0;
        break;
      default:
        current = 0;
    }
  } else {
    // No period specified, use total stats
    current = stats[criteria.metric] || 0;
  }

  return {
    current,
    target: criteria.target,
  };
}

/**
 * Calculate days remaining for a challenge
 */
function calculateDaysRemaining(challenge: Challenge): number {
  const now = new Date();

  if (challenge.end_date) {
    const endDate = new Date(challenge.end_date);
    const diffTime = endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  // For recurring challenges, calculate based on type
  if (challenge.type === "weekly") {
    const endOfWeek = getEndOfWeek(now);
    const diffTime = endOfWeek.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  if (challenge.type === "monthly") {
    const endOfMonth = getEndOfMonth(now);
    const diffTime = endOfMonth.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  return 0;
}

/**
 * Calculate current streak from array of dates
 */
function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const sortedDates = dates.map((d) => new Date(d)).sort((a, b) => b.getTime() - a.getTime());

  let streak = 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const mostRecent = new Date(sortedDates[0]);
  mostRecent.setHours(0, 0, 0, 0);

  const daysSinceLastLog = Math.floor(
    (today.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceLastLog > 1) return 0;

  for (let i = 1; i < sortedDates.length; i++) {
    const current = new Date(sortedDates[i]);
    const previous = new Date(sortedDates[i - 1]);
    current.setHours(0, 0, 0, 0);
    previous.setHours(0, 0, 0, 0);

    const dayDiff = Math.floor((previous.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));
    if (dayDiff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// Date utility functions
function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getEndOfWeek(date: Date): Date {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getEndOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * Convert Date to YYYY-MM-DD string for database comparison
 */
function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Sync calculated progress to user_challenges table
 * This runs asynchronously to avoid blocking the response
 */
async function syncProgressToDatabase(
  supabase: SupabaseClient<Database>,
  updates: Array<{ id: number; progress: ChallengeProgress; isCompleted: boolean }>
) {
  for (const update of updates) {
    const updateData: {
      progress: { current: number; target: number };
      completed_at?: string;
    } = {
      progress: { current: update.progress.current, target: update.progress.target },
    };

    // Mark as completed if target is reached
    if (update.isCompleted) {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase.from("user_challenges").update(updateData).eq("id", update.id);

    if (error) {
      console.error(`Failed to update user_challenge ${update.id}:`, error.message, error.details);
    }
  }
}
