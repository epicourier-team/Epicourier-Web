/**
 * POST /api/streaks/update - Update a user's streak
 *
 * Called when user completes an activity that contributes to a streak.
 * The database function handles streak calculation logic.
 *
 * @body {StreakUpdateRequest} streak_type - The type of streak to update
 * @returns {StreakUpdateResponse} Updated streak data
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";
import type { StreakUpdateRequest, StreakUpdateResponse, StreakType } from "@/types/data";

const VALID_STREAK_TYPES: StreakType[] = ["daily_log", "nutrient_goal", "green_recipe"];

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: StreakUpdateRequest = await request.json();

    // Validate streak_type
    if (!body.streak_type || !VALID_STREAK_TYPES.includes(body.streak_type)) {
      return NextResponse.json(
        {
          error: `Invalid streak_type. Must be one of: ${VALID_STREAK_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

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

    // Call the database function to update streak
    const { data, error } = await supabase.rpc("update_streak", {
      p_user_id: user.id,
      p_streak_type: body.streak_type,
    });

    if (error) {
      console.error("Error updating streak:", error);
      return NextResponse.json({ error: "Failed to update streak" }, { status: 500 });
    }

    // Fetch the updated streak record
    const { data: updatedStreak, error: fetchError } = await supabase
      .from("streak_history")
      .select("*")
      .eq("user_id", user.id)
      .eq("streak_type", body.streak_type)
      .single();

    if (fetchError || !updatedStreak) {
      console.error("Error fetching updated streak:", fetchError);
      return NextResponse.json({ error: "Failed to fetch updated streak" }, { status: 500 });
    }

    const response: StreakUpdateResponse = {
      success: true,
      streak: {
        id: updatedStreak.id,
        user_id: updatedStreak.user_id,
        streak_type: updatedStreak.streak_type as StreakType,
        current_streak: updatedStreak.current_streak ?? 0,
        longest_streak: updatedStreak.longest_streak ?? 0,
        last_activity_date: updatedStreak.last_activity_date,
        created_at: updatedStreak.created_at ?? new Date().toISOString(),
        updated_at: updatedStreak.updated_at ?? new Date().toISOString(),
      },
      message: `Streak updated! Current: ${updatedStreak.current_streak ?? 0} days`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Unexpected error in POST /api/streaks/update:", error);

    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
