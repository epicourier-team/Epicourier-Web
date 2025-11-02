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
  const { title, mealType, startTime, endTime, food_ids } = body;

  const { data: eventData, error: eventError } = await supabaseServer
    .from("events")
    .insert([{ title, meal_type: mealType, start_time: startTime, end_time: endTime }])
    .select("id")
    .single();

  if (eventError) {
    console.error("POST error:", eventError);
    return NextResponse.json({ error: eventError.message }, { status: 500 });
  }

  // 🔗 建立關聯
  if (food_ids?.length > 0) {
    const linkData = food_ids.map((fid: number) => ({
      event_id: eventData.id,
      food_id: fid,
    }));

    const { error: linkError } = await supabaseServer.from("event_foods").insert(linkData);

    if (linkError) {
      console.error("Link error:", linkError);
    }
  }

  return NextResponse.json(eventData);
}
