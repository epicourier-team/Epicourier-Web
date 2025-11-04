import { NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, recipe_id, date, notes } = body;

    if (!user_id || !recipe_id || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from("Calendar")
      .insert([
        {
          user_id,
          recipe_id,
          date,
          status: false, // 未完成
          notes: notes || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("POST /api/calendar error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
