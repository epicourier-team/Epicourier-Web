import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

import { syncDailyNutrientTracking } from "@/app/api/nutrients/tracking";
import type { Database } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 輔助函數：(與 route.ts 中的版本相同)
 */
async function getUserContext(
  supabase: SupabaseClient<Database>
): Promise<{ publicUserId: number; authUserId: string }> {
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    throw new Error("User not authenticated");
  }

  if (!authUser.email) {
    throw new Error("Authenticated user does not have an email.");
  }

  // 【修正】: 不使用 .single()，改用 .limit(1)
  const { data: publicUsers, error: profileError } = await supabase
    .from("User")
    .select("id")
    .eq("email", authUser.email)
    .limit(1);

  if (profileError) {
    console.error("Error fetching public user profile:", profileError.message);
    throw new Error("Error fetching user profile.");
  }

  if (!publicUsers || publicUsers.length === 0) {
    throw new Error("Public user profile not found.");
  }

  const publicUser = publicUsers[0];
  return { publicUserId: publicUser.id, authUserId: authUser.id };
}

/**
 * PATCH /api/events/[id]
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const _params = await params;
  const entryId = _params.id;
  let userContext: { publicUserId: number; authUserId: string };

  try {
    userContext = await getUserContext(supabase);
  } catch (err: unknown) {
    let errorMessage = "Unauthorized";
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 401 });
  }

  const { status } = await request.json();

  if (typeof status !== "boolean") {
    return NextResponse.json(
      { error: "Invalid 'status' field; expected boolean" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("Calendar")
    .update({ status: status })
    .eq("id", entryId)
    .eq("user_id", userContext.publicUserId)
    .select();

  if (error) {
    console.error("Error updating event:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Entry not found or user unauthorized" }, { status: 404 });
  }

  const updatedEntry = data[0];

  if (updatedEntry?.date) {
    try {
      await syncDailyNutrientTracking({
        supabase,
        publicUserId: userContext.publicUserId,
        authUserId: userContext.authUserId,
        date: updatedEntry.date,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to sync nutrient tracking for the day.";
      console.error("Error syncing nutrient tracking:", message);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  return NextResponse.json(data);
}
