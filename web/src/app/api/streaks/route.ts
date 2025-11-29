/**
 * GET /api/streaks - Get user's streak data
 *
 * Returns all streak types with current and longest streaks.
 *
 * @returns {StreaksResponse} User's streak data
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";
import type { StreakData, StreaksResponse, StreakType } from "@/types/data";

// Streak type labels for display
const STREAK_LABELS: Record<StreakType, string> = {
  daily_log: "Daily Logging",
  nutrient_goal: "Nutrient Goals",
  green_recipe: "Green Recipes",
};

export async function GET() {
  try {
    // Create Supabase client with user session
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's streak data
    const { data: streakRecords, error: streakError } = await supabase
      .from("streak_history")
      .select("*")
      .eq("user_id", user.id);

    if (streakError) {
      console.error("Error fetching streaks:", streakError);
      return NextResponse.json({ error: "Failed to fetch streaks" }, { status: 500 });
    }

    // Get today's date for comparison
    const today = new Date().toISOString().split("T")[0];

    // Build streak data for all types
    const allStreakTypes: StreakType[] = ["daily_log", "nutrient_goal", "green_recipe"];
    const streaks: StreakData[] = allStreakTypes.map((type) => {
      const record = streakRecords?.find((r) => r.streak_type === type);
      const isActiveToday = record?.last_activity_date === today;

      return {
        type,
        label: STREAK_LABELS[type],
        current: record?.current_streak ?? 0,
        longest: record?.longest_streak ?? 0,
        lastActivity: record?.last_activity_date ?? null,
        isActiveToday,
      };
    });

    // Calculate total current streak (sum of all active streaks)
    const totalCurrentStreak = streaks.reduce((sum, s) => sum + s.current, 0);

    const response: StreaksResponse = {
      streaks,
      totalCurrentStreak,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Unexpected error in GET /api/streaks:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
