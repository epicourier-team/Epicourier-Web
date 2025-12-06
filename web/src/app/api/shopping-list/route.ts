import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// ----------------------------------------------------------------------------
// Imports
// ----------------------------------------------------------------------------
import { isIngredientInPantry, PantryItem, MissingItem } from "@/utils/shoppingListAlgorithm";

// ----------------------------------------------------------------------------
// Types (Local)
// ----------------------------------------------------------------------------
interface Ingredient {
    name: string;
}

interface RecipeIngredientMap {
    Ingredient: Ingredient | null;
}

interface CalendarEvent {
    recipe_id: number;
}


// ----------------------------------------------------------------------------
// API Route
// ----------------------------------------------------------------------------
export async function GET() {
    const supabase = await createClient();

    try {
        // 1. Authentication & User Resolution
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser || !authUser.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: userData, error: userError } = await supabase
            .from("User")
            .select("id")
            .eq("email", authUser.email)
            .single();

        if (userError || !userData) {
            return NextResponse.json({ error: "User profile not found" }, { status: 404 });
        }

        const userId = userData.id;

        // 2. Determine Date Range (Next 7 Days)
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        const todayStr = today.toISOString().split('T')[0];
        const nextWeekStr = nextWeek.toISOString().split('T')[0];

        // 3. Fetch Calendar Events
        const { data: events, error: calendarError } = await supabase
            .from("Calendar")
            .select("recipe_id")
            .eq("user_id", userId)
            .gte("date", todayStr)
            .lte("date", nextWeekStr);

        if (calendarError) throw new Error(calendarError.message);

        const recipeIds = Array.from(new Set(events?.map(e => e.recipe_id).filter(Boolean)));

        if (recipeIds.length === 0) {
            return NextResponse.json({ missing_items: [], message: "No meals planned for the week." });
        }

        // 4. Fetch Ingredients for Recipes
        // Note: We need to manually join via the Map table
        const { data: recipeIngredients, error: mapError } = await supabase
            .from("Recipe_Ingredient_Map")
            .select(`
        ingredient_id,
        Ingredient (
          name
        )
      `)
            .in("recipe_id", recipeIds);

        if (mapError) throw new Error(mapError.message);

        // Flatten logic
        const requiredIngredients: string[] = [];
        recipeIngredients?.forEach((row: any) => { // Type assertion needed due to join complexity
            if (row.Ingredient && row.Ingredient.name) {
                requiredIngredients.push(row.Ingredient.name);
            }
        });

        // 5. Fetch Pantry Items
        const { data: pantryItems, error: pantryError } = await supabase
            .from("PantryItem")
            .select("id, name, quantity")
            .eq("user_id", userId);

        if (pantryError) throw new Error(pantryError.message);

        // 6. Matching Algorithm
        const missingItemsMap = new Map<string, number>();

        requiredIngredients.forEach(reqName => {
            const pItems = pantryItems || [];
            if (!isIngredientInPantry(reqName, pItems)) {
                // Normalize for grouping (Capitalize first letter)
                const displayKey = reqName.charAt(0).toUpperCase() + reqName.slice(1).toLowerCase();
                missingItemsMap.set(displayKey, (missingItemsMap.get(displayKey) || 0) + 1);
            }
        });

        // 7. Format Response with Monetization Links
        const missing_items: MissingItem[] = Array.from(missingItemsMap.entries()).map(([name, count]) => {
            // Construct Uber Eats deep link (Search query)
            const encodedName = encodeURIComponent(name);
            const uberLink = `https://www.ubereats.com/search?q=${encodedName}&utm_source=epicourier`; // UTM for hypothetical tracking

            return {
                name,
                count,
                uber_eats_link: uberLink
            };
        });

        return NextResponse.json({
            missing_items,
            meta: {
                planned_meals_count: events?.length || 0,
                date_range: { start: todayStr, end: nextWeekStr }
            }
        });

    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error("Shopping List API Error:", msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
