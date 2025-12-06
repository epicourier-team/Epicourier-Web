import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string; itemId: string }>;
}

/**
 * PUT /api/shopping-lists/[id]/items/[itemId]
 * Update a shopping list item
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { id: listId, itemId } = await params;

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
    const { item_name, quantity, unit, category, is_checked, position, notes } = body;

    // Build update object
    const updateData: Record<string, unknown> = {};

    if (item_name !== undefined) {
      if (typeof item_name !== "string" || item_name.trim().length === 0) {
        return NextResponse.json({ error: "Item name cannot be empty" }, { status: 400 });
      }
      updateData.item_name = item_name.trim();
    }

    if (quantity !== undefined) {
      updateData.quantity = Number(quantity) || 1;
    }

    if (unit !== undefined) {
      updateData.unit = unit?.trim() || null;
    }

    if (category !== undefined) {
      updateData.category = category?.trim() || "Other";
    }

    if (is_checked !== undefined) {
      updateData.is_checked = Boolean(is_checked);
    }

    if (position !== undefined) {
      updateData.position = Number(position) || 0;
    }

    if (notes !== undefined) {
      updateData.notes = notes?.trim() || null;
    }

    // Update the item
    const { data: updatedItem, error } = await supabase
      .from("shopping_list_items")
      .update(updateData)
      .eq("id", itemId)
      .eq("shopping_list_id", listId)
      .select(
        `
        *,
        Ingredient:ingredient_id (
          id,
          name,
          unit
        )
      `
      )
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }
      console.error("Error updating shopping list item:", error);
      return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
    }

    // Update the list's updated_at timestamp
    await supabase
      .from("shopping_lists")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", listId);

    return NextResponse.json(updatedItem);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

/**
 * DELETE /api/shopping-lists/[id]/items/[itemId]
 * Remove an item from a shopping list
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { id: listId, itemId } = await params;

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

  // Delete the item
  const { error } = await supabase
    .from("shopping_list_items")
    .delete()
    .eq("id", itemId)
    .eq("shopping_list_id", listId);

  if (error) {
    console.error("Error deleting shopping list item:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }

  // Update the list's updated_at timestamp
  await supabase
    .from("shopping_lists")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", listId);

  return NextResponse.json({ success: true });
}
