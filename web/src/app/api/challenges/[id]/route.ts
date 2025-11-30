import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getUserIdentity } from "@/lib/auth";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type { Challenge, ChallengeWithStatus, ChallengeProgress, Achievement } from "@/types/data";

type CalendarMealWithTags = {
  date: string | null;
  Recipe?: {
    "Recipe-Tag_Map"?: Array<{
      RecipeTag?: { name?: string | null } | null;
    }>;
  } | null;
};

/**
 * GET /api/challenges/[id]
 *
 * Returns detailed information about a specific challenge
 * including user progress and status.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  let publicUserId: number;
  let authUserId: string;

  try {
    ({ publicUserId, authUserId } = await getUserIdentity(supabase));
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unauthorized";
    console.warn("GET /api/challenges/[id] auth error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 401 });
  }

  const { id } = await params;
  const challengeId = parseInt(id, 10);

  if (isNaN(challengeId)) {
    return NextResponse.json({ error: "Invalid challenge ID" }, { status: 400 });
  }

  try {
    // Fetch the challenge
    const { data: challenge, error: challengeError } = await supabase
      .from("challenges")
      .select("*")
      .eq("id", challengeId)
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // Fetch user's participation status
    const { data: userChallenge, error: userChallengeError } = await supabase
      .from("user_challenges")
      .select("*")
      .eq("user_id", authUserId)
      .eq("challenge_id", challengeId)
      .maybeSingle();

    if (userChallengeError) {
      console.error("Error fetching user challenge:", userChallengeError.message);
    }

    // Fetch reward achievement if exists
    let rewardAchievement: Achievement | undefined;
    if (challenge.reward_achievement_id) {
      const { data: reward, error: rewardError } = await supabase
        .from("achievement_definitions")
        .select("*")
        .eq("id", challenge.reward_achievement_id)
        .single();

      if (!rewardError && reward) {
        rewardAchievement = reward as Achievement;
      }
    }

    // Calculate progress
    const stats = await calculateUserStats(supabase, publicUserId, authUserId);
    const progress = calculateProgress(challenge as Challenge, stats);
    const daysRemaining = calculateDaysRemaining(challenge as Challenge);

    const response: ChallengeWithStatus = {
      ...(challenge as Challenge),
      is_joined: !!userChallenge,
      progress,
      reward_achievement: rewardAchievement,
      days_remaining: daysRemaining,
    };

    return NextResponse.json(response);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("GET /api/challenges/[id] error:", errorMessage);
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
    weekly_meals_logged: 0,
    weekly_green_recipes: 0,
    weekly_unique_days: 0, // Number of unique days with meals this week (for Week Warrior)
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

    // Get meals with tags
    // Note: The tag table is named "RecipeTag", not "Tag"
    const { data: meals, error: mealsError } = await supabase
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

    if (!mealsError && meals) {
      const mealsTyped = meals as CalendarMealWithTags[];

      stats.meals_logged = mealsTyped.length;

      // Count green recipes
      const isGreenMeal = (meal: CalendarMealWithTags) =>
        meal.Recipe?.["Recipe-Tag_Map"]?.some((tm) => {
          const tagName = tm.RecipeTag?.name?.toLowerCase() || "";
          return (
            tagName.includes("sustainable") || tagName.includes("green") || tagName.includes("eco")
          );
        });

      stats.green_recipes = mealsTyped.filter(isGreenMeal).length;

      // Weekly stats - use string comparison for YYYY-MM-DD dates
      const weeklyMeals = mealsTyped.filter((meal) => meal.date && meal.date >= startOfWeekStr);
      stats.weekly_meals_logged = weeklyMeals.length;

      // Count unique days with meals this week (for Week Warrior streak challenge)
      const weeklyUniqueDays = new Set(
        weeklyMeals.map((m) => m.date).filter((d): d is string => d !== null)
      );
      stats.weekly_unique_days = weeklyUniqueDays.size;

      stats.weekly_green_recipes = weeklyMeals.filter(isGreenMeal).length;

      // Monthly stats - use string comparison for YYYY-MM-DD dates
      stats.monthly_meals_logged = mealsTyped.filter(
        (meal) => meal.date && meal.date >= startOfMonthStr
      ).length;
      stats.monthly_green_recipes = mealsTyped.filter(
        (meal) => meal.date && meal.date >= startOfMonthStr && isGreenMeal(meal)
      ).length;
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
      stats.streak_days = calculateStreak(Array.from(uniqueDates));
    }

    // Nutrient goal days
    const { data: nutrientData, error: nutrientError } = await supabase
      .from("nutrient_tracking")
      .select("date")
      .eq("user_id", authUserId)
      .gte("date", startOfMonthStr);

    if (!nutrientError && nutrientData) {
      const uniqueNutrientDays = new Set(nutrientData.map((n) => n.date));
      stats.monthly_nutrient_goal_days = uniqueNutrientDays.size;
      stats.nutrient_goal_days = uniqueNutrientDays.size;
    }
  } catch (err) {
    console.error("Error calculating user stats:", err);
  }

  return stats;
}

function calculateProgress(challenge: Challenge, stats: Record<string, number>): ChallengeProgress {
  const { criteria } = challenge;
  const period = criteria.period;
  let current = 0;

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
    current = stats[criteria.metric] || 0;
  }

  return {
    current,
    target: criteria.target,
  };
}

function calculateDaysRemaining(challenge: Challenge): number {
  const now = new Date();

  if (challenge.end_date) {
    const endDate = new Date(challenge.end_date);
    const diffTime = endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

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

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
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
