import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type {
  InventoryItemWithDetails,
  InventorySummary,
  CreateInventoryItemRequest,
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

/**
 * GET /api/inventory
 * Get all inventory items for the authenticated user
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

  // Fetch inventory items with ingredient details
  const { data: items, error } = await supabase
    .from("user_inventory")
    .select(
      `
      *,
      Ingredient (
        id,
        name,
        unit,
        calories_kcal,
        protein_g,
        carbs_g,
        sugars_g,
        agg_fats_g,
        cholesterol_mg,
        agg_minerals_mg,
        vit_a_microg,
        agg_vit_b_mg,
        vit_c_mg,
        vit_d_microg,
        vit_e_mg,
        vit_k_microg
      )
    `
    )
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }

  // Transform items with computed properties
  const itemsWithDetails: InventoryItemWithDetails[] = (items || []).map((item) => ({
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
  }));

  // Calculate summary
  const summary: InventorySummary = {
    total_items: itemsWithDetails.length,
    expiring_soon: itemsWithDetails.filter(
      (i) => i.expiration_status === "warning" || i.expiration_status === "critical"
    ).length,
    expired: itemsWithDetails.filter((i) => i.expiration_status === "expired").length,
    low_stock: itemsWithDetails.filter((i) => i.is_low_stock).length,
    by_location: {
      pantry: itemsWithDetails.filter((i) => i.location === "pantry").length,
      fridge: itemsWithDetails.filter((i) => i.location === "fridge").length,
      freezer: itemsWithDetails.filter((i) => i.location === "freezer").length,
      other: itemsWithDetails.filter((i) => i.location === "other").length,
    },
  };

  return NextResponse.json({ items: itemsWithDetails, summary });
}

/**
 * POST /api/inventory
 * Create a new inventory item
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
    const body: CreateInventoryItemRequest = await request.json();
    const { ingredient_id, quantity, unit, location, expiration_date, min_quantity, notes } = body;

    // Validate required fields
    if (!ingredient_id || typeof ingredient_id !== "number") {
      return NextResponse.json({ error: "Valid ingredient_id is required" }, { status: 400 });
    }

    if (!quantity || quantity <= 0) {
      return NextResponse.json({ error: "Quantity must be greater than 0" }, { status: 400 });
    }

    // Check if ingredient exists
    const { data: ingredient, error: ingredientError } = await supabase
      .from("Ingredient")
      .select("id, name")
      .eq("id", ingredient_id)
      .single();

    if (ingredientError || !ingredient) {
      return NextResponse.json({ error: "Ingredient not found" }, { status: 404 });
    }

    // Create the inventory item (uses UPSERT via unique constraint)
    const { data: newItem, error } = await supabase
      .from("user_inventory")
      .insert({
        user_id: user.id,
        ingredient_id,
        quantity,
        unit: unit || null,
        location: location || "pantry",
        expiration_date: expiration_date || null,
        min_quantity: min_quantity || null,
        notes: notes || null,
      })
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
      // Handle duplicate constraint error
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "This ingredient already exists in this location. Use update instead." },
          { status: 409 }
        );
      }
      console.error("Error creating inventory item:", error);
      return NextResponse.json({ error: "Failed to create inventory item" }, { status: 500 });
    }

    // Transform with computed properties
    const itemWithDetails: InventoryItemWithDetails = {
      id: newItem.id,
      user_id: newItem.user_id,
      ingredient_id: newItem.ingredient_id,
      quantity: Number(newItem.quantity),
      unit: newItem.unit,
      location: newItem.location as InventoryLocation,
      expiration_date: newItem.expiration_date,
      min_quantity: newItem.min_quantity ? Number(newItem.min_quantity) : null,
      notes: newItem.notes,
      created_at: newItem.created_at,
      updated_at: newItem.updated_at,
      ingredient: newItem.Ingredient,
      expiration_status: getExpirationStatus(newItem.expiration_date),
      days_until_expiration: getDaysUntilExpiration(newItem.expiration_date),
      is_low_stock: isLowStock(
        Number(newItem.quantity),
        newItem.min_quantity ? Number(newItem.min_quantity) : null
      ),
    };

    return NextResponse.json(itemWithDetails, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
