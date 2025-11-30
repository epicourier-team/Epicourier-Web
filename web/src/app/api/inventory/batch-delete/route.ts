import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/inventory/batch-delete
 * Delete multiple inventory items at once
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Invalid or empty ids array" }, { status: 400 });
    }

    // Validate all IDs are strings (UUIDs)
    if (!ids.every((id) => typeof id === "string")) {
      return NextResponse.json({ error: "All ids must be strings" }, { status: 400 });
    }

    // Delete items that belong to the current user
    const { error: deleteError, count } = await supabase
      .from("user_inventory")
      .delete()
      .eq("user_id", user.id)
      .in("id", ids);

    if (deleteError) {
      console.error("Error batch deleting inventory items:", deleteError);
      return NextResponse.json({ error: "Failed to delete inventory items" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deleted_count: count || ids.length,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
