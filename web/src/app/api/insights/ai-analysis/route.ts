import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

/**
 * GET /api/insights/ai-analysis
 * Get AI-powered insights from Gemini
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("user_id");
        const period = searchParams.get("period") || "30d";

        if (!userId) {
            return NextResponse.json(
                { error: "user_id is required" },
                { status: 400 }
            );
        }

        // Properly encode query parameters to prevent injection
        const params = new URLSearchParams({
            user_id: userId,
            period: period
        });

        // Proxy to FastAPI backend
        const response = await fetch(
            `${BACKEND_URL}/insights/ai-analysis?${params.toString()}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error("Backend error:", error);
            return NextResponse.json(
                { error: "Failed to fetch AI insights" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching AI insights:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
