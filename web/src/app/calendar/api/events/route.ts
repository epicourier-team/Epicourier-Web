import { NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabaseServer";

// 取得事件
export async function GET() {
  const { data, error } = await supabaseServer
    .from("events")
    .select("*")
    .order("start_time", { ascending: true });

  if (error) {
    console.error("GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// 新增事件
export async function POST(req: Request) {
  const body = await req.json();
  const { user_id, meal_type, start_time, food_ids } = body;

  const { data, error } = await supabaseServer
    .from("events")
    .insert([{ user_id, meal_type, start_time }])
    .select();

  if (error) {
    console.error("POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 這裡之後可接續插入 event_foods
  return NextResponse.json(data[0]);
}
