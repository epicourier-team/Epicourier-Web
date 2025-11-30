import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/shopping-lists
 * Get all shopping lists for the authenticated user
 */
export async function GET() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch shopping lists with item counts
  const { data: lists, error } = await supabase
    .from("shopping_lists")
    .select(
      `
      *,
      shopping_list_items (
        id,
        is_checked
      )
    `
    )
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching shopping lists:", error);
    return NextResponse.json({ error: "Failed to fetch shopping lists" }, { status: 500 });
  }

  // Transform to include stats (matching ShoppingListWithStats type)
  const listsWithStats = lists.map((list) => {
    const items = list.shopping_list_items || [];
    const itemCount = items.length;
    const checkedCount = items.filter((item: { is_checked: boolean }) => item.is_checked).length;
    return {
      id: list.id,
      user_id: list.user_id,
      name: list.name,
      description: list.description,
      is_archived: list.is_archived,
      created_at: list.created_at,
      updated_at: list.updated_at,
      item_count: itemCount,
      checked_count: checkedCount,
      progress_percentage: itemCount > 0 ? Math.round((checkedCount / itemCount) * 100) : 0,
    };
  });

  return NextResponse.json(listsWithStats);
}

/**
 * POST /api/shopping-lists
 * Create a new shopping list
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
    const { name, description } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Create the shopping list
    const { data: newList, error } = await supabase
      .from("shopping_lists")
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating shopping list:", error);
      return NextResponse.json({ error: "Failed to create shopping list" }, { status: 500 });
    }

    return NextResponse.json(newList, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
