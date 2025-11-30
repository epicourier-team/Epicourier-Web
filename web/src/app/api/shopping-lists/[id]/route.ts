import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/shopping-lists/[id]
 * Get a single shopping list with all items
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { id } = await params;

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch the shopping list with items
  const { data: list, error } = await supabase
    .from("shopping_lists")
    .select(
      `
      *,
      shopping_list_items (
        *,
        Ingredient:ingredient_id (
          id,
          name,
          unit
        )
      )
    `
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Shopping list not found" }, { status: 404 });
    }
    console.error("Error fetching shopping list:", error);
    return NextResponse.json({ error: "Failed to fetch shopping list" }, { status: 500 });
  }

  // Sort items by position
  if (list.shopping_list_items) {
    list.shopping_list_items.sort(
      (a: { position: number }, b: { position: number }) => a.position - b.position
    );
  }

  return NextResponse.json(list);
}

/**
 * PUT /api/shopping-lists/[id]
 * Update a shopping list (name, description, is_archived)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { id } = await params;

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
    const { name, description, is_archived } = body;

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (is_archived !== undefined) {
      updateData.is_archived = Boolean(is_archived);
    }

    // Update the shopping list
    const { data: updatedList, error } = await supabase
      .from("shopping_lists")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Shopping list not found" }, { status: 404 });
      }
      console.error("Error updating shopping list:", error);
      return NextResponse.json({ error: "Failed to update shopping list" }, { status: 500 });
    }

    return NextResponse.json(updatedList);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

/**
 * DELETE /api/shopping-lists/[id]
 * Delete a shopping list and all its items (cascade)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { id } = await params;

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delete the shopping list (items cascade automatically)
  const { error } = await supabase
    .from("shopping_lists")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting shopping list:", error);
    return NextResponse.json({ error: "Failed to delete shopping list" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
