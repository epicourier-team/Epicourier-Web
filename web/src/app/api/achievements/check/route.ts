import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getUserIdentity } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabaseServer";
import { sendMultipleAchievementNotifications, isPushConfigured } from "@/lib/pushNotifications";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type { Achievement, AchievementCheckRequest, AchievementCheckResponse } from "@/types/data";

type UserAchievementRow = {
  achievement_id: number;
};

type CalendarMealWithTags = {
  Recipe?: {
    "Recipe-Tag_Map"?: Array<{
      Tag?: { name?: string | null } | null;
    }>;
  } | null;
};

type CalendarDate = { date: string | null };

type UserStats = {
  meals_logged: number;
  green_recipes: number;
  days_tracked: number;
  streak_days: number;
  dashboard_views: number;
  nutrient_aware_percentage: number;
};

/**
 * POST /api/achievements/check
 *
 * Checks and awards new achievements based on user's current progress.
 * Called after user performs actions (meal_logged, nutrient_viewed, etc.)
 *
 * Request body:
 * - trigger: "meal_logged" | "nutrient_viewed" | "manual"
 *
 * Returns:
 * - newly_earned: Array of newly unlocked achievements
 * - message: Success message
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  let publicUserId: number;
  let authUserId: string;

  try {
    ({ publicUserId, authUserId } = await getUserIdentity(supabase));
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unauthorized";
    console.warn("POST /api/achievements/check auth error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 401 });
  }

  let body: AchievementCheckRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.trigger) {
    return NextResponse.json({ error: "Missing trigger field" }, { status: 400 });
  }

  try {
    // Fetch all achievement definitions
    const { data: achievements, error: achievementsError } = await supabase
      .from("achievement_definitions")
      .select("*");

    if (achievementsError) {
      console.error("Error fetching achievements:", achievementsError.message);
      return NextResponse.json({ error: achievementsError.message }, { status: 500 });
    }

    // Fetch user's already earned achievements
    const { data: userAchievements, error: userAchievementsError } = await supabase
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", authUserId);

    if (userAchievementsError) {
      console.error("Error fetching user achievements:", userAchievementsError.message);
      return NextResponse.json({ error: userAchievementsError.message }, { status: 500 });
    }

    const userAchievementRows = (userAchievements ?? []) as UserAchievementRow[];
    const earnedAchievementIds = new Set(userAchievementRows.map((ua) => ua.achievement_id));

    // Get user statistics
    const stats = await calculateUserStats(supabase, publicUserId, authUserId);

    // Check which achievements are newly earned
    const newlyEarned: Achievement[] = [];

    const achievementDefinitions = (achievements ?? []) as Achievement[];

    for (const achievement of achievementDefinitions) {
      // Skip already earned
      if (earnedAchievementIds.has(achievement.id)) continue;

      const criteria = achievement.criteria;
      const isEarned = checkAchievementCriteria(criteria, stats);

      if (isEarned) {
        // Award achievement
        const { error: insertError } = await supabaseServer.from("user_achievements").insert({
          user_id: authUserId,
          achievement_id: achievement.id,
          earned_at: new Date().toISOString(),
          progress: {
            final_value: stats[criteria.metric as keyof typeof stats],
            trigger: body.trigger,
          },
        });

        if (!insertError) {
          newlyEarned.push({
            id: achievement.id,
            name: achievement.name,
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon,
            tier: achievement.tier,
            criteria: achievement.criteria,
          });
        } else {
          console.error(`Error awarding achievement ${achievement.name}:`, insertError.message);
        }
      }
    }

    const response: AchievementCheckResponse = {
      newly_earned: newlyEarned,
      message:
        newlyEarned.length > 0
          ? `Congratulations! You earned ${newlyEarned.length} new achievement(s)!`
          : "No new achievements earned.",
    };

    // Send push notifications for newly earned achievements (async, non-blocking)
    if (newlyEarned.length > 0 && isPushConfigured()) {
      sendMultipleAchievementNotifications(authUserId, newlyEarned)
        .then(({ sent, failed }) => {
          if (sent > 0) {
            console.log(`Push notifications sent for ${newlyEarned.length} achievements: ${sent} succeeded, ${failed} failed`);
          }
        })
        .catch((err) => {
          console.error("Error sending achievement push notifications:", err);
        });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error checking achievements:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Calculate user statistics for achievement checking
 */
async function calculateUserStats(
  supabase: SupabaseClient<Database>,
  publicUserId: number,
  authUserId: string
) {
  const stats: UserStats = {
    meals_logged: 0,
    green_recipes: 0,
    days_tracked: 0,
    streak_days: 0,
    dashboard_views: 0,
    nutrient_aware_percentage: 0,
  };

  try {
    // Count meals logged
    const { count: mealsCount, error: mealsError } = await supabase
      .from("Calendar")
      .select("*", { count: "exact", head: true })
      .eq("user_id", publicUserId)
      .eq("status", true);

    if (!mealsError && mealsCount !== null) {
      stats.meals_logged = mealsCount;
    }

    // Count green recipes
    const { data: greenMeals, error: greenError } = await supabase
      .from("Calendar")
      .select(
        `
        id,
        Recipe: recipe_id (
          id,
          Recipe-Tag_Map (
            Tag: tag_id (
              name
            )
          )
        )
      `
      )
      .eq("user_id", publicUserId)
      .eq("status", true);

    if (!greenError && greenMeals) {
      const greenMealsTyped = greenMeals as CalendarMealWithTags[];
      stats.green_recipes = greenMealsTyped.filter((meal) => {
        const recipe = meal.Recipe;
        if (!recipe) return false;
        const tagMaps = recipe["Recipe-Tag_Map"] || [];
        return tagMaps.some(
          (tm) =>
            tm.Tag?.name?.toLowerCase().includes("sustainable") ||
            tm.Tag?.name?.toLowerCase().includes("green") ||
            tm.Tag?.name?.toLowerCase().includes("eco")
        );
      }).length;
    }

    // Count days tracked and calculate streak
    const { data: calendarDates, error: datesError } = await supabase
      .from("Calendar")
      .select("date")
      .eq("user_id", publicUserId)
      .eq("status", true);

    if (!datesError && calendarDates) {
      const calendarDatesTyped = calendarDates as CalendarDate[];
      const uniqueDates = new Set(calendarDatesTyped.map((c) => c.date));
      stats.days_tracked = uniqueDates.size;
      stats.streak_days = calculateStreak(Array.from(uniqueDates) as string[]);
    }

    // Count dashboard views
    const { count: nutrientViewsCount, error: nutrientError } = await supabase
      .from("nutrient_tracking")
      .select("*", { count: "exact", head: true })
      .eq("user_id", authUserId);

    if (!nutrientError && nutrientViewsCount !== null) {
      stats.dashboard_views = nutrientViewsCount;
    }

    // Calculate nutrient-aware percentage
    const { data: nutrientMeals, error: nutrientMealsError } = await supabase
      .from("nutrient_tracking")
      .select("date")
      .eq("user_id", authUserId);

    if (!nutrientMealsError && nutrientMeals && stats.meals_logged > 0) {
      stats.nutrient_aware_percentage = Math.round(
        (nutrientMeals.length / stats.meals_logged) * 100
      );
    }
  } catch (error) {
    console.error("Error calculating user stats:", error);
  }

  return stats;
}

/**
 * Calculate current streak from array of dates
 */
function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const sortedDates = dates.map((d) => new Date(d)).sort((a, b) => b.getTime() - a.getTime()); // Most recent first

  let streak = 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const mostRecent = new Date(sortedDates[0]);
  mostRecent.setHours(0, 0, 0, 0);

  // Check if most recent is today or yesterday
  const daysSinceLastLog = Math.floor(
    (today.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceLastLog > 1) return 0;

  // Count consecutive days
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

/**
 * Check if achievement criteria is met
 */
function checkAchievementCriteria(criteria: Achievement["criteria"], stats: UserStats): boolean {
  const current = stats[criteria.metric as keyof UserStats] || 0;

  switch (criteria.type) {
    case "count":
      return current >= criteria.target;
    case "streak":
      return current >= criteria.target;
    case "threshold":
      return current >= criteria.target;
    default:
      return false;
  }
}
