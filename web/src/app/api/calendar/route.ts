import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");
    const start = searchParams.get("start"); // YYYY-MM-DD
    const end = searchParams.get("end"); // YYYY-MM-DD

    if (!userId) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    // Get user's calendar
    let query = supabaseServer
      .from("Calendar")
      .select(
        `
        id,
        user_id,
        recipe_id,
        date,
        meal_type,
        status,
        notes,
        Recipe:recipe_id (
          id,
          name,
          image_url,
          min_prep_time,
          green_score
        )
      `
      )
      .eq("user_id", userId)
      .order("date", { ascending: true })
      .order("meal_type", { ascending: true });

    // Choose date
    if (start) query = query.gte("date", start);
    if (end) query = query.lte("date", end);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch (err: unknown) {
    console.error("GET /api/calendar error:", err);
    let errorMessage = "Unknown error";
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, recipe_id, date, notes, meal_type } = body;

    if (!user_id || !recipe_id || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 插入資料並同時 select Recipe join
    const { data, error } = await supabaseServer
      .from("Calendar")
      .insert([
        {
          user_id,
          recipe_id,
          date,
          status: false,
          notes: notes || null,
          meal_type,
        },
      ])
      .select(
        `
        id,
        user_id,
        recipe_id,
        date,
        meal_type,
        status,
        notes,
        Recipe:recipe_id (
          id,
          name,
          image_url,
          min_prep_time,
          green_score
        )
        `
      )
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("POST /api/calendar error:", err);
    let errorMessage = "Unknown error";
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
