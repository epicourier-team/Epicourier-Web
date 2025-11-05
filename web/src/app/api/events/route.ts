import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * 輔助函數：
 * 獲取 public."User" 表中的數字 ID (bigint)。
 */
async function getPublicUserId(supabase: SupabaseClient<Database>): Promise<number> {
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
  return publicUser.id;
}

/**
 * GET /api/events
 */
export async function GET() {
  const supabase = await createClient();
  let publicUserId: number;

  try {
    publicUserId = await getPublicUserId(supabase);
  } catch (err: unknown) {
    let errorMessage = "Unauthorized";
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    console.warn("GET /api/events auth error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("Calendar")
    .select(
      `
      id,
      date,
      meal_type,
      status,
      Recipe ( id, name, image_url, description, min_prep_time, green_score )
    `
    )
    .eq("user_id", publicUserId);

  if (error) {
    console.error("Error fetching events:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

/**
 * POST /api/events
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  let publicUserId: number;

  try {
    publicUserId = await getPublicUserId(supabase);
  } catch (err: unknown) {
    let errorMessage = "Unauthorized";
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    console.warn("POST /api/events auth error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 401 });
  }

  const body = await request.json();
  const { recipe_id, date, meal_type, status } = body;

  if (!recipe_id || !date || !meal_type) {
    return NextResponse.json(
      { error: "Missing required fields (recipe_id, date, meal_type)" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("Calendar")
    .insert([
      {
        recipe_id: Number(recipe_id),
        date: String(date),
        meal_type: String(meal_type),
        status: typeof status === "boolean" ? status : false,
        user_id: publicUserId,
      },
    ])
    .select();

  if (error) {
    console.error("Error inserting event:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
