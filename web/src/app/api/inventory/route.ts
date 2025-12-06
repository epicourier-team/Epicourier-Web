import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type {
  CreateInventoryItemRequest,
  InventoryLocation,
  ExpirationStatus,
  InventoryItemWithDetails,
  InventorySummary,
} from "@/types/data";

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

/**
 * GET /api/inventory
 * Get all inventory items for the authenticated user
 *
 * Query params:
 * - location: filter by location (pantry, fridge, freezer, other)
 * - expiring_within: filter items expiring within N days
 * - search: search by ingredient name
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse query parameters
  const { searchParams } = new URL(request.url);
  const location = searchParams.get("location") as InventoryLocation | null;
  const expiringWithin = searchParams.get("expiring_within");
  const search = searchParams.get("search");

  // Build query
  let query = supabase
    .from("user_inventory")
    .select(
      `
      *,
      ingredient:Ingredient (
        id,
        name
      )
    `
    )
    .eq("user_id", user.id)
    .order("expiration_date", { ascending: true, nullsFirst: false });

  // Apply filters
  if (location) {
    query = query.eq("location", location);
  }

  if (expiringWithin) {
    const days = parseInt(expiringWithin, 10);
    if (!isNaN(days)) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      query = query.lte("expiration_date", futureDate.toISOString().split("T")[0]);
      query = query.gte("expiration_date", new Date().toISOString().split("T")[0]);
    }
  }

  const { data: items, error } = await query;

  if (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }

  // Filter by search term (ingredient name)
  let filteredItems = items || [];
  if (search && search.trim()) {
    const searchLower = search.toLowerCase().trim();
    filteredItems = filteredItems.filter((item) =>
      item.ingredient?.name?.toLowerCase().includes(searchLower)
    );
  }

  // Transform items with computed properties
  const itemsWithDetails: InventoryItemWithDetails[] = filteredItems.map((item) => {
    const { status, daysUntil } = calculateExpirationStatus(item.expiration_date);
    return {
      id: item.id,
      user_id: item.user_id,
      ingredient_id: item.ingredient_id,
      quantity: item.quantity,
      unit: item.unit,
      location: item.location,
      expiration_date: item.expiration_date,
      min_quantity: item.min_quantity,
      notes: item.notes,
      created_at: item.created_at,
      updated_at: item.updated_at,
      ingredient: item.ingredient,
      expiration_status: status,
      days_until_expiration: daysUntil,
      is_low_stock: item.min_quantity !== null && item.quantity <= item.min_quantity,
    };
  });

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
 * Add a new item to inventory
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
      return NextResponse.json({ error: "ingredient_id is required" }, { status: 400 });
    }

    if (quantity === undefined || typeof quantity !== "number" || quantity < 0) {
      return NextResponse.json({ error: "Valid quantity is required" }, { status: 400 });
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

    // Check for existing entry with same ingredient and location
    const itemLocation = location || "pantry";
    const { data: existing } = await supabase
      .from("user_inventory")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("ingredient_id", ingredient_id)
      .eq("location", itemLocation)
      .single();

    if (existing) {
      // Update existing item quantity
      const { data: updated, error: updateError } = await supabase
        .from("user_inventory")
        .update({
          quantity: existing.quantity + quantity,
          unit: unit || null,
          expiration_date: expiration_date || null,
          min_quantity: min_quantity ?? null,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
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

      return NextResponse.json(updated, { status: 200 });
    }

    // Create new inventory item
    const { data: newItem, error: createError } = await supabase
      .from("user_inventory")
      .insert({
        user_id: user.id,
        ingredient_id,
        quantity,
        unit: unit || null,
        location: itemLocation,
        expiration_date: expiration_date || null,
        min_quantity: min_quantity ?? null,
        notes: notes || null,
      })
      .select(
        `
        *,
        ingredient:Ingredient (id, name)
      `
      )
      .single();

    if (createError) {
      console.error("Error creating inventory item:", createError);
      return NextResponse.json({ error: "Failed to create inventory item" }, { status: 500 });
    }

    return NextResponse.json(newItem, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
