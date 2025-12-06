import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { UpdateInventoryItemRequest, ExpirationStatus } from "@/types/data";

/**
 * Calculate expiration status based on expiration date
 */
function calculateExpirationStatus(expirationDate: string | null): {
  status: ExpirationStatus;
  daysUntil: number | null;
} {
  if (!expirationDate) {
    return { status: "unknown", daysUntil: null };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(expirationDate);
  expDate.setHours(0, 0, 0, 0);

  const diffTime = expDate.getTime() - today.getTime();
  const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) {
    return { status: "expired", daysUntil };
  } else if (daysUntil <= 2) {
    return { status: "critical", daysUntil };
  } else if (daysUntil <= 7) {
    return { status: "warning", daysUntil };
  } else {
    return { status: "good", daysUntil };
  }
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/inventory/[id]
 * Get a single inventory item by ID
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

  const { data: item, error } = await supabase
    .from("user_inventory")
    .select(
      `
      *,
      ingredient:Ingredient (id, name)
    `
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !item) {
    return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
  }

  // Add computed properties
  const { status, daysUntil } = calculateExpirationStatus(item.expiration_date);
  const itemWithDetails = {
    ...item,
    expiration_status: status,
    days_until_expiration: daysUntil,
    is_low_stock: item.min_quantity !== null && item.quantity <= item.min_quantity,
  };

  return NextResponse.json(itemWithDetails);
}

/**
 * PUT /api/inventory/[id]
 * Update an inventory item
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
    const body: UpdateInventoryItemRequest = await request.json();
    const { quantity, unit, location, expiration_date, min_quantity, notes } = body;

    // Verify ownership
    const { data: existing, error: existingError } = await supabase
      .from("user_inventory")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
    }

    // Build update object (only include provided fields)
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (quantity !== undefined) {
      if (typeof quantity !== "number" || quantity < 0) {
        return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
      }
      updateData.quantity = quantity;
    }

    if (unit !== undefined) {
      updateData.unit = unit || null;
    }

    if (location !== undefined) {
      const validLocations = ["pantry", "fridge", "freezer", "other"];
      if (!validLocations.includes(location)) {
        return NextResponse.json({ error: "Invalid location" }, { status: 400 });
      }
      updateData.location = location;
    }

    if (expiration_date !== undefined) {
      updateData.expiration_date = expiration_date;
    }

    if (min_quantity !== undefined) {
      updateData.min_quantity = min_quantity;
    }

    if (notes !== undefined) {
      updateData.notes = notes || null;
    }

    const { data: updated, error: updateError } = await supabase
      .from("user_inventory")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        ingredient:Ingredient (id, name)
      `
      )
      .single();

    if (updateError) {
      console.error("Error updating inventory item:", updateError);
      return NextResponse.json({ error: "Failed to update inventory item" }, { status: 500 });
    }

    // Add computed properties
    const { status, daysUntil } = calculateExpirationStatus(updated.expiration_date);
    const itemWithDetails = {
      ...updated,
      expiration_status: status,
      days_until_expiration: daysUntil,
      is_low_stock: updated.min_quantity !== null && updated.quantity <= updated.min_quantity,
    };

    return NextResponse.json(itemWithDetails);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

/**
 * DELETE /api/inventory/[id]
 * Delete an inventory item
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

  // Verify ownership and delete
  const { error: deleteError } = await supabase
    .from("user_inventory")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (deleteError) {
    console.error("Error deleting inventory item:", deleteError);
    return NextResponse.json({ error: "Failed to delete inventory item" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
