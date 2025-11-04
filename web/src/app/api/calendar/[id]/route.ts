import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const { data: calendarEntry, error: calendarError } = await supabaseServer
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
          description,
          min_prep_time,
          green_score
        )
      `
      )
      .eq("id", id)
      .single();

    if (calendarError) throw calendarError;
    if (!calendarEntry) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(calendarEntry);
  } catch (err: unknown) {
    console.error("GET /api/calendar/[id] error:", err);
    let errorMessage = "Unknown error";
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, notes } = body;

    // create an object to save
    const updateData: { status?: boolean; notes?: string } = {};
    if (status !== undefined) {
      updateData.status = status;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from("Calendar")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("PATCH /api/calendar/[id] error:", err);
    let errorMessage = "Unknown error";
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
