import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getUserIdentity } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabaseServer";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type {
  Achievement,
  AchievementsResponse,
  AchievementProgress,
  UserAchievement,
} from "@/types/data";

type UserAchievementWithDefinition = UserAchievement & {
  achievement?: Achievement | null;
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
  current_streak: number;
  dashboard_views: number;
  nutrient_aware_meals: number;
  total_meals: number;
};

/**
 * GET /api/achievements
 *
 * Returns all achievements for the current user:
 * - earned: Array of unlocked achievements with earned_at timestamp
 * - available: Array of locked achievements with progress
 * - progress: Map of achievement names to progress data
 *
 * Progress calculation based on achievement criteria:
 * - count: Count of completed actions (meals_logged, dashboard_views, etc.)
 * - streak: Current consecutive days streak
 * - threshold: Percentage of nutrient-aware meals
 */
export async function GET() {
  const supabase = await createClient();
  let publicUserId: number;
  let authUserId: string;

  try {
    ({ publicUserId, authUserId } = await getUserIdentity(supabase));
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unauthorized";
    console.warn("GET /api/achievements auth error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 401 });
  }

  try {
    // Fetch all achievement definitions
    const { data: achievements, error: achievementsError } = await supabase
      .from("achievement_definitions")
      .select("*")
      .order("tier", { ascending: true })
      .order("name", { ascending: true });

    if (achievementsError) {
      console.error("Error fetching achievement definitions:", achievementsError.message);
      return NextResponse.json({ error: achievementsError.message }, { status: 500 });
    }

    // Fetch user's earned achievements
    const { data: userAchievements, error: userAchievementsError } = await supabase
      .from("user_achievements")
      .select(
        `
        id,
        user_id,
        achievement_id,
        earned_at,
        progress,
        achievement:achievement_id (
          id,
          name,
          title,
          description,
          icon,
          tier,
          criteria
        )
      `
      )
      .eq("user_id", authUserId);

    if (userAchievementsError) {
      console.error("Error fetching user achievements:", userAchievementsError.message);
      return NextResponse.json({ error: userAchievementsError.message }, { status: 500 });
    }

    // Calculate progress for all achievements
    const achievementDefinitions = (achievements ?? []) as Achievement[];
    let userAchievementRows = (userAchievements ??
      []) as unknown as UserAchievementWithDefinition[];
    const progressMap: Record<string, AchievementProgress> = {};
    const earnedAchievementIds = new Set(userAchievementRows.map((ua) => ua.achievement_id));
    const pendingAwards: Array<{ achievement: Achievement; progress: AchievementProgress }> = [];

    // Get user statistics for progress calculation
    const stats = await calculateUserStats(supabase, publicUserId, authUserId);

    for (const achievement of achievementDefinitions) {
      const isEarned = earnedAchievementIds.has(achievement.id);

      if (isEarned) continue;

      const progress = calculateProgress(achievement as Achievement, stats);

      if (hasMetCriteria(progress, achievement.criteria.type)) {
        pendingAwards.push({ achievement: achievement as Achievement, progress });
        continue;
      }

      progressMap[achievement.name] = progress;
    }

    if (pendingAwards.length > 0) {
      const insertPayload = pendingAwards.map(({ achievement, progress }) => ({
        user_id: authUserId,
        achievement_id: achievement.id,
        earned_at: new Date().toISOString(),
        progress: {
          final_value: progress.current,
          trigger: "auto_check",
          source: "GET /api/achievements",
        },
      }));

      const { error: insertError } = await supabaseServer
        .from("user_achievements")
        .insert(insertPayload);

      if (insertError) {
        console.error("Error auto-awarding achievements:", insertError.message);
        pendingAwards.forEach(({ achievement, progress }) => {
          progressMap[achievement.name] = progress;
        });
      } else {
        pendingAwards.forEach(({ achievement }) => earnedAchievementIds.add(achievement.id));

        const { data: refreshedAchievements, error: refreshedError } = await supabase
          .from("user_achievements")
          .select(
            `
            id,
            user_id,
            achievement_id,
            earned_at,
            progress,
            achievement:achievement_id (
              id,
              name,
              title,
              description,
              icon,
              tier,
              criteria
            )
          `
          )
          .eq("user_id", authUserId);

        if (refreshedError) {
          console.error("Error refreshing user achievements:", refreshedError.message);
        } else if (refreshedAchievements) {
          userAchievementRows = refreshedAchievements as unknown as UserAchievementWithDefinition[];
        }
      }
    }

    // Separate earned and available achievements
    const earned: UserAchievement[] = userAchievementRows.map((ua) => ({
      id: ua.id,
      user_id: ua.user_id,
      achievement_id: ua.achievement_id,
      earned_at: ua.earned_at,
      progress: ua.progress,
      achievement: ua.achievement
        ? {
            id: ua.achievement.id,
            name: ua.achievement.name,
            title: ua.achievement.title,
            description: ua.achievement.description,
            icon: ua.achievement.icon,
            tier: ua.achievement.tier,
            criteria: ua.achievement.criteria,
          }
        : undefined,
    }));

    const available: Achievement[] = achievementDefinitions
      .filter((a) => !earnedAchievementIds.has(a.id))
      .map((a) => ({
        id: a.id,
        name: a.name,
        title: a.title,
        description: a.description,
        icon: a.icon,
        tier: a.tier,
        criteria: a.criteria,
      }));

    const response: AchievementsResponse = {
      earned,
      available,
      progress: progressMap,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Calculate user statistics for achievement progress
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
    current_streak: 0,
    dashboard_views: 0,
    nutrient_aware_meals: 0,
    total_meals: 0,
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
      stats.total_meals = mealsCount;
    }

    // Count green recipes (recipes with sustainable tag)
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

    // Count days with at least one meal (days tracked)
    const { data: calendarDates, error: datesError } = await supabase
      .from("Calendar")
      .select("date")
      .eq("user_id", publicUserId)
      .eq("status", true);

    if (!datesError && calendarDates) {
      const calendarDatesTyped = calendarDates as CalendarDate[];
      const uniqueDates = new Set(calendarDatesTyped.map((c) => c.date));
      stats.days_tracked = uniqueDates.size;

      // Calculate current streak
      stats.current_streak = calculateStreak(Array.from(uniqueDates) as string[]);
    }

    // Count dashboard views (using nutrient_tracking as proxy)
    const { count: nutrientViewsCount, error: nutrientError } = await supabase
      .from("nutrient_tracking")
      .select("*", { count: "exact", head: true })
      .eq("user_id", authUserId);

    if (!nutrientError && nutrientViewsCount !== null) {
      stats.dashboard_views = nutrientViewsCount;
    }

    // Count nutrient-aware meals (meals with nutrient tracking)
    const { data: nutrientMeals, error: nutrientMealsError } = await supabase
      .from("nutrient_tracking")
      .select("date")
      .eq("user_id", authUserId);

    if (!nutrientMealsError && nutrientMeals) {
      const nutrientMealsTyped = nutrientMeals as CalendarDate[];
      stats.nutrient_aware_meals = nutrientMealsTyped.length;
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
 * Calculate progress for a specific achievement
 */
function calculateProgress(achievement: Achievement, stats: UserStats): AchievementProgress {
  const criteria = achievement.criteria;
  const target = criteria.target;

  let current = 0;

  // Map criteria metric to stats
  switch (criteria.metric) {
    case "meals_logged":
      current = stats.meals_logged;
      break;
    case "green_recipes":
      current = stats.green_recipes;
      break;
    case "days_tracked":
      current = stats.days_tracked;
      break;
    case "streak_days":
      current = stats.current_streak;
      break;
    case "dashboard_views":
      current = stats.dashboard_views;
      break;
    case "nutrient_aware_percentage":
      if (stats.total_meals > 0) {
        current = Math.round((stats.nutrient_aware_meals / stats.total_meals) * 100);
      }
      break;
    default:
      current = 0;
  }

  const percentage = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;

  return {
    current,
    target,
    percentage,
    last_updated: new Date().toISOString(),
  };
}

function hasMetCriteria(
  progress: AchievementProgress,
  criteriaType: Achievement["criteria"]["type"]
): boolean {
  if (criteriaType === "count" || criteriaType === "streak" || criteriaType === "threshold") {
    return progress.current >= progress.target;
  }

  return false;
}
