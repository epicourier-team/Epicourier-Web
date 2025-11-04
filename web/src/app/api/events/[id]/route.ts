import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// 匯入 Supabase 相關類型
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * 輔助函數：(與 route.ts 中的版本相同)
 */
async function getPublicUserId(supabase: SupabaseClient<Database>): Promise<number> {
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    throw new Error("User not authenticated");
  }

  // 檢查 2: 【修正】確保 email 欄位存在
  if (!authUser.email) {
    throw new Error("Authenticated user does not have an email.");
  }

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
 * PATCH /api/events/[id]
 * 更新指定 ID 的日曆事件狀態
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const entryId = params.id;
  let publicUserId: number;

  try {
    publicUserId = await getPublicUserId(supabase);
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

  // ... (此處的 PATCH 邏輯與之前相同，是正確的)
  const { data, error } = await supabase
    .from("Calendar")
    .update({ status: status })
    .eq("id", entryId)
    .eq("user_id", publicUserId)
    .select();

  if (error) {
    console.error("Error updating event:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Entry not found or user unauthorized" }, { status: 404 });
  }

  return NextResponse.json(data);
}
