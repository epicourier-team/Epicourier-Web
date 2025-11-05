import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { goal, numMeals } = await req.json();

        // Call FastAPI backend directly
        const res = await fetch("http://localhost:8000/recommender", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ goal, numMeals }),
        });

        if (!res.ok) {
            const text = await res.text();
            return NextResponse.json({ error: `FastAPI error: ${text}` }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}