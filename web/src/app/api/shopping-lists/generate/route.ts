import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/shopping-lists/generate
 * Generate a shopping list from calendar meals within a date range
 *
 * Request body:
 * {
 *   name?: string,           // Optional name for the new list
 *   startDate: string,       // YYYY-MM-DD
 *   endDate: string,         // YYYY-MM-DD
 *   mealTypes?: string[]     // Optional filter: ["breakfast", "lunch", "dinner"]
 * }
 */
export async function POST(req: Request) {
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
    const body = await req.json();
    const { name, startDate, endDate, mealTypes } = body;

    // Validate required fields
    if (!startDate || !endDate) {
      return NextResponse.json({ error: "startDate and endDate are required" }, { status: 400 });
    }

    // Fetch calendar entries within the date range
    let calendarQuery = supabase
      .from("Calendar")
      .select(
        `
        id,
        date,
        meal_type,
        Recipe (
          id,
          name
        )
      `
      )
      .eq("user_id", user.id)
      .gte("date", startDate)
      .lte("date", endDate)
      .not("recipe_id", "is", null);

    // Filter by meal types if provided
    if (mealTypes && Array.isArray(mealTypes) && mealTypes.length > 0) {
      calendarQuery = calendarQuery.in("meal_type", mealTypes);
    }

    const { data: calendarEntries, error: calendarError } = await calendarQuery;

    if (calendarError) {
      console.error("Error fetching calendar entries:", calendarError);
      return NextResponse.json({ error: "Failed to fetch calendar entries" }, { status: 500 });
    }

    if (!calendarEntries || calendarEntries.length === 0) {
      return NextResponse.json(
        { error: "No meals found in the specified date range" },
        { status: 404 }
      );
    }

    // Get unique recipe IDs - Recipe is a single object, not an array
    const recipeIds = [
      ...new Set(
        calendarEntries
          .map((e) => {
            const recipe = e.Recipe as unknown as { id: number; name: string } | null;
            return recipe?.id;
          })
          .filter((id): id is number => id !== undefined && id !== null)
      ),
    ];

    // Fetch ingredients for all recipes
    const { data: recipeIngredients, error: ingredientsError } = await supabase
      .from("Recipe-Ingredient_Map")
      .select(
        `
        recipe_id,
        relative_unit_100,
        Ingredient (
          id,
          name,
          unit
        )
      `
      )
      .in("recipe_id", recipeIds);

    if (ingredientsError) {
      console.error("Error fetching ingredients:", ingredientsError);
      return NextResponse.json({ error: "Failed to fetch ingredients" }, { status: 500 });
    }

    // Aggregate ingredients (combine duplicates)
    const ingredientMap = new Map<
      number,
      {
        id: number;
        name: string;
        unit: string | null;
        totalQuantity: number;
        recipeCount: number;
      }
    >();

    for (const ri of recipeIngredients || []) {
      // Ingredient is a single object from the join
      const ingredient = ri.Ingredient as unknown as {
        id: number;
        name: string | null;
        unit: string | null;
      } | null;
      if (!ingredient) continue;

      const existing = ingredientMap.get(ingredient.id);
      const quantity = (ri.relative_unit_100 || 100) / 100;

      if (existing) {
        existing.totalQuantity += quantity;
        existing.recipeCount += 1;
      } else {
        ingredientMap.set(ingredient.id, {
          id: ingredient.id,
          name: ingredient.name ?? "Unknown",
          unit: ingredient.unit,
          totalQuantity: quantity,
          recipeCount: 1,
        });
      }
    }

    // Create the shopping list
    const listName = name || `Shopping List (${startDate} to ${endDate})`;
    const recipeNames = calendarEntries
      .map((e) => {
        const recipe = e.Recipe as unknown as { id: number; name: string } | null;
        return recipe?.name;
      })
      .filter(Boolean)
      .slice(0, 5)
      .join(", ");
    const description = `Generated from ${calendarEntries.length} meal${calendarEntries.length > 1 ? "s" : ""}: ${recipeNames}${calendarEntries.length > 5 ? "..." : ""}`;

    const { data: newList, error: createError } = await supabase
      .from("shopping_lists")
      .insert({
        user_id: user.id,
        name: listName,
        description,
        is_archived: false,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating shopping list:", createError);
      return NextResponse.json({ error: "Failed to create shopping list" }, { status: 500 });
    }

    // Add items to the shopping list
    const items = Array.from(ingredientMap.values()).map((ing, index) => ({
      shopping_list_id: newList.id,
      ingredient_id: ing.id,
      item_name: ing.name,
      quantity: Math.round(ing.totalQuantity * 100) / 100, // Round to 2 decimals
      unit: ing.unit,
      category: "Other",
      is_checked: false,
      position: index,
    }));

    if (items.length > 0) {
      const { error: itemsError } = await supabase.from("shopping_list_items").insert(items);

      if (itemsError) {
        console.error("Error adding items:", itemsError);
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({
      id: newList.id,
      name: newList.name,
      description: newList.description,
      item_count: items.length,
      meals_count: calendarEntries.length,
      recipes_count: recipeIds.length,
    });
  } catch (error) {
    console.error("Error generating shopping list:", error);
    return NextResponse.json({ error: "Failed to generate shopping list" }, { status: 500 });
  }
}
