import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function POST(req: Request) {
  try {
    const { goal, numMeals, userId } = await req.json();

    // Call FastAPI backend directly
    const res = await fetch(`${BACKEND_URL}/recommender`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal, numMeals, userId }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `FastAPI error: ${text}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as { message: string }).message }, { status: 500 });
  }
}