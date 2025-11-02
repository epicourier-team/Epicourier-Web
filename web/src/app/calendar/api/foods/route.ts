// src/app/api/foods/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabaseServer";

// ✅ 取得所有食物或單一食物
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const category = searchParams.get("category");

  try {
    let query = supabaseServer.from("foods").select("*");

    if (id) query = query.eq("id", id);
    if (category) query = query.ilike("category", `%${category}%`);

    const { data, error } = await query.order("id", { ascending: true });

    if (error) {
      console.error("GET /api/foods error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (err: any) {
    console.error("Server error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, calories, protein, fat, carbs, category } = body;

  const { data, error } = await supabaseServer
    .from("foods")
    .insert([{ name, calories, protein, fat, carbs, category }])
    .select();

  if (error) {
    console.error("POST /api/foods error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data[0]);
}
