import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

import type { InventoryLocation, TransferToInventoryRequest } from "@/types/data";

/**
 * POST /api/inventory/transfer
 * Transfer shopping list items to inventory
 *
 * Accepts an array of items to transfer:
 * - Adds new items to inventory
 * - Updates existing inventory quantities if item exists
 * - Marks shopping items as checked
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
    const { items } = body as { items: TransferToInventoryRequest[] };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items array is required" }, { status: 400 });
    }

    // Validate each item
    for (const item of items) {
      if (!item.shopping_item_id || !item.ingredient_id) {
        return NextResponse.json(
          { error: "Each item must have shopping_item_id and ingredient_id" },
          { status: 400 }
        );
      }
    }

    const transferredItems: TransferToInventoryRequest[] = [];
    const errors: string[] = [];

    for (const item of items) {
      try {
        // Check if inventory item already exists for this ingredient
        const { data: existingItem } = await supabase
          .from("user_inventory")
          .select("*")
          .eq("user_id", user.id)
          .eq("ingredient_id", item.ingredient_id)
          .eq("location", item.location || "pantry")
          .single();

        if (existingItem) {
          // Update existing inventory item (add quantity)
          const { error: updateError } = await supabase
            .from("user_inventory")
            .update({
              quantity: existingItem.quantity + (item.quantity || 1),
              expiration_date: item.expiration_date || existingItem.expiration_date,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingItem.id);

          if (updateError) {
            errors.push(`Failed to update inventory for item ${item.shopping_item_id}`);
            continue;
          }
        } else {
          // Create new inventory item
          const { error: insertError } = await supabase.from("user_inventory").insert({
            user_id: user.id,
            ingredient_id: item.ingredient_id,
            quantity: item.quantity || 1,
            unit: item.unit || null,
            location: (item.location as InventoryLocation) || "pantry",
            expiration_date: item.expiration_date || null,
          });

          if (insertError) {
            errors.push(`Failed to add inventory item for ${item.shopping_item_id}`);
            continue;
          }
        }

        // Mark shopping item as checked
        const { error: checkError } = await supabase
          .from("shopping_list_items")
          .update({ is_checked: true })
          .eq("id", item.shopping_item_id);

        if (checkError) {
          errors.push(`Failed to mark shopping item ${item.shopping_item_id} as checked`);
          continue;
        }

        transferredItems.push(item);
      } catch {
        errors.push(`Error processing item ${item.shopping_item_id}`);
      }
    }

    return NextResponse.json({
      success: true,
      transferred_count: transferredItems.length,
      transferred_items: transferredItems,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

/**
 * DELETE /api/inventory/transfer
 * Undo a transfer - remove items from inventory and uncheck shopping items
 */
export async function DELETE(request: NextRequest) {
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
    const { items } = body as { items: TransferToInventoryRequest[] };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items array is required" }, { status: 400 });
    }

    for (const item of items) {
      // Uncheck shopping item
      await supabase
        .from("shopping_list_items")
        .update({ is_checked: false })
        .eq("id", item.shopping_item_id);

      // Delete or reduce inventory item quantity
      const { data: existingItem } = await supabase
        .from("user_inventory")
        .select("*")
        .eq("user_id", user.id)
        .eq("ingredient_id", item.ingredient_id)
        .eq("location", item.location || "pantry")
        .single();

      if (existingItem) {
        const newQuantity = existingItem.quantity - (item.quantity || 1);
        if (newQuantity <= 0) {
          // Delete the inventory item
          await supabase.from("user_inventory").delete().eq("id", existingItem.id);
        } else {
          // Reduce the quantity
          await supabase
            .from("user_inventory")
            .update({
              quantity: newQuantity,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingItem.id);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
