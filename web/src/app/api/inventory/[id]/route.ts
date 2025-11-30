import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type {
  InventoryItemWithDetails,
  UpdateInventoryItemRequest,
  ExpirationStatus,
  InventoryLocation,
} from "@/types/data";

/**
 * Calculate expiration status based on days until expiration
 */
function getExpirationStatus(expirationDate: string | null): ExpirationStatus {
  if (!expirationDate) return "unknown";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(expirationDate);
  expDate.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "expired";
  if (diffDays <= 2) return "critical";
  if (diffDays <= 7) return "warning";
  return "good";
}

/**
 * Calculate days until expiration
 */
function getDaysUntilExpiration(expirationDate: string | null): number | null {
  if (!expirationDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(expirationDate);
  expDate.setHours(0, 0, 0, 0);

  return Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Check if item is low stock
 */
function isLowStock(quantity: number, minQuantity: number | null): boolean {
  if (minQuantity === null) return false;
  return quantity <= minQuantity;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/inventory/[id]
 * Get a specific inventory item
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
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

  // Fetch the item
  const { data: item, error } = await supabase
    .from("user_inventory")
    .select(
      `
      *,
      Ingredient (
        id,
        name,
        unit
      )
    `
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !item) {
    return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
  }

  // Transform with computed properties
  const itemWithDetails: InventoryItemWithDetails = {
    id: item.id,
    user_id: item.user_id,
    ingredient_id: item.ingredient_id,
    quantity: Number(item.quantity),
    unit: item.unit,
    location: item.location as InventoryLocation,
    expiration_date: item.expiration_date,
    min_quantity: item.min_quantity ? Number(item.min_quantity) : null,
    notes: item.notes,
    created_at: item.created_at,
    updated_at: item.updated_at,
    ingredient: item.Ingredient,
    expiration_status: getExpirationStatus(item.expiration_date),
    days_until_expiration: getDaysUntilExpiration(item.expiration_date),
    is_low_stock: isLowStock(
      Number(item.quantity),
      item.min_quantity ? Number(item.min_quantity) : null
    ),
  };

  return NextResponse.json(itemWithDetails);
}

/**
 * PATCH /api/inventory/[id]
 * Update an inventory item
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    // Build update object
    const updates: Record<string, unknown> = {};

    if (quantity !== undefined) {
      if (quantity <= 0) {
        return NextResponse.json({ error: "Quantity must be greater than 0" }, { status: 400 });
      }
      updates.quantity = quantity;
    }

    if (unit !== undefined) updates.unit = unit;
    if (location !== undefined) updates.location = location;
    if (expiration_date !== undefined) updates.expiration_date = expiration_date;
    if (min_quantity !== undefined) updates.min_quantity = min_quantity;
    if (notes !== undefined) updates.notes = notes;

    // Check if there's anything to update
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    // Update the item
    const { data: updatedItem, error } = await supabase
      .from("user_inventory")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select(
        `
        *,
        Ingredient (
          id,
          name,
          unit
        )
      `
      )
      .single();

    if (error) {
      console.error("Error updating inventory item:", error);
      return NextResponse.json({ error: "Failed to update inventory item" }, { status: 500 });
    }

    if (!updatedItem) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
    }

    // Transform with computed properties
    const itemWithDetails: InventoryItemWithDetails = {
      id: updatedItem.id,
      user_id: updatedItem.user_id,
      ingredient_id: updatedItem.ingredient_id,
      quantity: Number(updatedItem.quantity),
      unit: updatedItem.unit,
      location: updatedItem.location as InventoryLocation,
      expiration_date: updatedItem.expiration_date,
      min_quantity: updatedItem.min_quantity ? Number(updatedItem.min_quantity) : null,
      notes: updatedItem.notes,
      created_at: updatedItem.created_at,
      updated_at: updatedItem.updated_at,
      ingredient: updatedItem.Ingredient,
      expiration_status: getExpirationStatus(updatedItem.expiration_date),
      days_until_expiration: getDaysUntilExpiration(updatedItem.expiration_date),
      is_low_stock: isLowStock(
        Number(updatedItem.quantity),
        updatedItem.min_quantity ? Number(updatedItem.min_quantity) : null
      ),
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
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
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

  // Delete the item
  const { error } = await supabase
    .from("user_inventory")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting inventory item:", error);
    return NextResponse.json({ error: "Failed to delete inventory item" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
