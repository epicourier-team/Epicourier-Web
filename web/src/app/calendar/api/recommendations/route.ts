import { NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabaseServer";

// 取得推薦食譜
export async function GET() {
  const { data, error } = await supabaseServer
    .from("Recipe")
    .select("id, name, description, image_url, green_score, min_prep_time")
    .limit(5);

  if (error) {
    console.error("GET /api/recommendations error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 隨機取樣 3 筆
  const shuffled = data.sort(() => 0.5 - Math.random());
  const sample = shuffled.slice(0, 3);
  return NextResponse.json(sample);
}
