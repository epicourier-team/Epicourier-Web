import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// Get recommend receipt (simulation)
export async function GET() {
  const { data, error } = await supabaseServer
    .from("Recipe")
    .select("id, name, description, image_url, green_score, min_prep_time")
    .limit(5);

  if (error) {
    console.error("GET /api/recommendations error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // choose 3 randomly
  const shuffled = data.sort(() => 0.5 - Math.random());
  const sample = shuffled.slice(0, 3);
  return NextResponse.json(sample);
}
