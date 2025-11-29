import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/shopping-lists/[id]/items
 * Add an item to a shopping list
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { id: listId } = await params;

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership of the list
  const { data: list, error: listError } = await supabase
    .from("shopping_lists")
    .select("id")
    .eq("id", listId)
    .eq("user_id", user.id)
    .single();

  if (listError || !list) {
    return NextResponse.json({ error: "Shopping list not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { item_name, ingredient_id, quantity, unit, category, notes } = body;

    if (!item_name || typeof item_name !== "string" || item_name.trim().length === 0) {
      return NextResponse.json({ error: "Item name is required" }, { status: 400 });
    }

    // Get the current max position
    const { data: maxPositionResult } = await supabase
      .from("shopping_list_items")
      .select("position")
      .eq("shopping_list_id", listId)
      .order("position", { ascending: false })
      .limit(1)
      .single();

    const newPosition = (maxPositionResult?.position ?? -1) + 1;

    // Create the item
    const { data: newItem, error } = await supabase
      .from("shopping_list_items")
      .insert({
        shopping_list_id: listId,
        item_name: item_name.trim(),
        ingredient_id: ingredient_id || null,
        quantity: quantity || 1,
        unit: unit?.trim() || null,
        category: category?.trim() || "Other",
        notes: notes?.trim() || null,
        position: newPosition,
        is_checked: false,
      })
      .select(`
        *,
        Ingredient:ingredient_id (
          id,
          name,
          aisle,
          unit
        )
      `)
      .single();

    if (error) {
      console.error("Error creating shopping list item:", error);
      return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
    }

    // Update the list's updated_at timestamp
    await supabase
      .from("shopping_lists")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", listId);

    return NextResponse.json(newItem, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
