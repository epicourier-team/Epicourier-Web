import { NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabaseServer";

/**
 * GET /api/users
 * 取得所有使用者清單
 */
export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from("User")
      .select("id, fullname, email")
      .order("created_at", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err: any) {
    console.error("GET /api/users error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/users
 * 新增一位使用者
 * body: { fullname: string, email: string }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullname, email } = body;

    if (!fullname || !email) {
      return NextResponse.json({ error: "Missing fullname or email" }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from("User")
      .insert([{ fullname, email }])
      .select("id, fullname, email")
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("POST /api/users error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
