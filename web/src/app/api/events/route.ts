import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// 匯入 Supabase 相關類型以確保類型安全
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * 輔助函數：
 * 1. 獲取當前的 Supabase Auth 使用者 (帶有 UUID)。
 * 2. 使用該使用者的 email 去您的 public."User" 表中查找對應的數字 ID (bigint)。
 */
async function getPublicUserId(supabase: SupabaseClient<Database>): Promise<number> {
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  // 檢查 1: 使用者物件是否存在
  if (authError || !authUser) {
    throw new Error("User not authenticated");
  }

  // 檢查 2: 【修正】確保 email 欄位存在
  if (!authUser.email) {
    throw new Error("Authenticated user does not have an email.");
  }

  // 經過檢查，authUser.email 在這裡必定是 string
  const { data: publicUser, error: profileError } = await supabase
    .from("User")
    .select("id")
    .eq("email", authUser.email) // <--- 現在這裡是類型安全的
    .single();

  if (profileError || !publicUser) {
    console.error("Error fetching public user profile:", profileError?.message);
    throw new Error("Public user profile not found.");
  }

  return publicUser.id;
}

/**
 * GET /api/events
 * 獲取當前登入使用者的所有日曆事件
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

  // ... (此處的 GET 邏輯與之前相同，是正確的)
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
 * 為當前登入的使用者建立一個新的日曆事件
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

  // ... (此處的 POST 邏輯與之前相同，是正確的)
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
