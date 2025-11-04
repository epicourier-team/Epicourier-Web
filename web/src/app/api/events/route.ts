import { createClient } from "@/utils/supabase/server"; // 確保您使用的是 server client
import { NextResponse } from "next/server";

// 1. 獲取該使用者自己的日曆事件
export async function GET(request: Request) {
  const supabase = await createClient(); // 建立伺服器端 client

  // 獲取當前登入的使用者
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 在查詢中加入 .eq('user_id', user.id)
  // 這樣就只會抓取到符合當前使用者 ID 的資料
  const { data, error } = await supabase.from("Calendar").select("*").eq("user_id", user.id); // <--- 關鍵的過濾步驟

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// 2. 新增事件到該使用者的日曆
export async function POST(request: Request) {
  const supabase = await createClient(); // 建立伺服器端 client

  // 獲取當前登入的使用者
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 從 request body 中解析出日曆事件資料
  const eventData = await request.json();

  // 在插入資料時，強制寫入當前使用者的 user_id
  // 這樣可以防止使用者為別人建立事件
  const { data, error } = await supabase
    .from("Calendar")
    .insert([
      {
        ...eventData,
        user_id: user.id, // <--- 關鍵的寫入步驟
      },
    ])
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
