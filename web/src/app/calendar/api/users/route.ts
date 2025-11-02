import { NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabaseServer";

// 取得所有使用者
export async function GET() {
  const { data, error } = await supabaseServer.from("users").select("*");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// 新增使用者
export async function POST(req: Request) {
  const body = await req.json();
  const { name, email } = body;

  const { data, error } = await supabaseServer
    .from("users")
    .insert([{ name, email }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
