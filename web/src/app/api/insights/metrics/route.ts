import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

/**
 * POST /api/insights/metrics
 * Log weight/height measurement to UserMetricsHistory
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Proxy to FastAPI backend
        const response = await fetch(`${BACKEND_URL}/insights/metrics`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("Backend error:", error);
            return NextResponse.json(
                { error: "Failed to log metrics" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error logging metrics:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
