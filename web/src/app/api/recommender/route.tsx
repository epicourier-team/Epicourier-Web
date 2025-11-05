import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { goal, numMeals } = await req.json();

    // forward request to your Python backend
    const res = await fetch("http://localhost:8000/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, numMeals }),
    });

    const data = await res.json();
    return NextResponse.json(data);
}