import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getUserIdentity } from "@/lib/auth";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type {
  Challenge,
  ChallengeWithStatus,
  ChallengeProgress,
  Achievement,
} from "@/types/data";

type CalendarMealWithTags = {
  date: string | null;
  Recipe?: {
    "Recipe-Tag_Map"?: Array<{
      Tag?: { name?: string | null } | null;
    }>;
  } | null;
};

/**
 * GET /api/challenges/[id]
 *
 * Returns detailed information about a specific challenge
 * including user progress and status.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    monthly_meals_logged: 0,
    monthly_green_recipes: 0,
    monthly_nutrient_goal_days: 0,
  };

  try {
    const now = new Date();
    const startOfWeek = getStartOfWeek(now);
    const startOfMonth = getStartOfMonth(now);

    // Get meals with tags
    const { data: meals, error: mealsError } = await supabase
      .from("Calendar")
      .select(
        `
        date,
        Recipe (
          "Recipe-Tag_Map" (
            Tag (name)
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
          const tagName = tm.Tag?.name?.toLowerCase() || "";
          return (
            tagName.includes("sustainable") ||
            tagName.includes("green") ||
            tagName.includes("eco")
          );
        });

      stats.green_recipes = mealsTyped.filter(isGreenMeal).length;

      // Weekly stats
      stats.weekly_meals_logged = mealsTyped.filter(
        (meal) => meal.date && new Date(meal.date) >= startOfWeek
      ).length;
      stats.weekly_green_recipes = mealsTyped.filter(
        (meal) =>
          meal.date && new Date(meal.date) >= startOfWeek && isGreenMeal(meal)
      ).length;

      // Monthly stats
      stats.monthly_meals_logged = mealsTyped.filter(
        (meal) => meal.date && new Date(meal.date) >= startOfMonth
      ).length;
      stats.monthly_green_recipes = mealsTyped.filter(
        (meal) =>
          meal.date && new Date(meal.date) >= startOfMonth && isGreenMeal(meal)
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
      .gte("date", startOfMonth.toISOString().split("T")[0]);

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

function calculateProgress(
  challenge: Challenge,
  stats: Record<string, number>
): ChallengeProgress {
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
        current = stats.streak_days || 0;
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

  const sortedDates = dates
    .map((d) => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

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
