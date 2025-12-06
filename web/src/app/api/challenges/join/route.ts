import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getUserIdentity } from "@/lib/auth";

import type { ChallengeJoinRequest, ChallengeJoinResponse, UserChallenge } from "@/types/data";

/**
 * POST /api/challenges/join
 *
 * Join a challenge. Creates a user_challenges record.
 *
 * Request body:
 * - challenge_id: number - The ID of the challenge to join
 *
 * Returns:
 * - success: boolean
 * - user_challenge: UserChallenge record
 * - message: string
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  let authUserId: string;

  try {
    ({ authUserId } = await getUserIdentity(supabase));
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unauthorized";
    console.warn("POST /api/challenges/join auth error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 401 });
  }

  try {
    // Parse request body
    const body = (await request.json()) as ChallengeJoinRequest;
    const { challenge_id } = body;

    if (!challenge_id || typeof challenge_id !== "number") {
      return NextResponse.json(
        { error: "challenge_id is required and must be a number" },
        { status: 400 }
      );
    }

    // Check if challenge exists and is active
    const { data: challenge, error: challengeError } = await supabase
      .from("challenges")
      .select("*")
      .eq("id", challenge_id)
      .eq("is_active", true)
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json({ error: "Challenge not found or not active" }, { status: 404 });
    }

    // Check if user already joined this challenge
    const { data: existingJoin, error: existingError } = await supabase
      .from("user_challenges")
      .select("*")
      .eq("user_id", authUserId)
      .eq("challenge_id", challenge_id)
      .order("joined_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error("Error checking existing join:", existingError.message);
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    if (existingJoin) {
      // Check if the existing join is stale
      const joinedAt = new Date(existingJoin.joined_at);
      const now = new Date();
      let isStale = false;

      if (challenge.type === "weekly") {
        const startOfWeek = getStartOfWeek(now);
        if (joinedAt < startOfWeek) {
          isStale = true;
        }
      } else if (challenge.type === "monthly") {
        const startOfMonth = getStartOfMonth(now);
        if (joinedAt < startOfMonth) {
          isStale = true;
        }
      }

      if (isStale) {
        // Stale record exists (history), but we allow joining again for the new period.
        // We do NOT delete the old record.
        // Proceed to insert new record below.
      } else {
        // User has already joined in the current period
        return NextResponse.json(
          { error: "You have already joined this challenge" },
          { status: 409 }
        );
      }
    }

    // Insert user_challenges record
    const { data: newJoin, error: insertError } = await supabase
      .from("user_challenges")
      .insert({
        user_id: authUserId,
        challenge_id,
        joined_at: new Date().toISOString(),
        progress: { current: 0, target: challenge.criteria?.target || 0 },
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error joining challenge:", insertError.message);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const response: ChallengeJoinResponse = {
      success: true,
      user_challenge: newJoin as UserChallenge,
      message: `Successfully joined challenge: ${challenge.title}`,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("POST /api/challenges/join error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Date utility functions (duplicated from challenges/route.ts for independence)
function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
