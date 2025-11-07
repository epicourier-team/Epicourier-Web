import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";
import { Recipe } from "../../../types/data";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // ✅ parse query parameters
  const query = searchParams.get("query") || "";
  const ingredientIds = searchParams.getAll("ingredientIds").map(Number).filter(Boolean);
  const tagIds = searchParams.getAll("tagIds").map(Number).filter(Boolean);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  let recipes: Recipe[] = [];
  let total = 0;

  // 🟩 Case 1: ingredient filter
  if (ingredientIds.length > 0) {
    const { data, error } = await supabase
      .from("Recipe-Ingredient_Map")
      .select("recipe_id")
      .in("ingredient_id", ingredientIds);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const recipeIds = Array.from(new Set(data.map((d) => d.recipe_id)));

    const { data: filteredRecipes, error: recipeError } = await supabase
      .from("Recipe")
      .select("*")
      .in("id", recipeIds);

    if (recipeError) return NextResponse.json({ error: recipeError.message }, { status: 500 });
    recipes = filteredRecipes || [];
    total = recipes.length;
  }

  // 🟦 Case 2: tag filter
  else if (tagIds.length > 0) {
    const { data, error } = await supabase
      .from("Recipe-Tag_Map")
      .select("recipe_id")
      .in("tag_id", tagIds);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const recipeIds = Array.from(new Set(data.map((d) => d.recipe_id)));

    const { data: filteredRecipes, error: recipeError } = await supabase
      .from("Recipe")
      .select("*")
      .in("id", recipeIds);

    if (recipeError) return NextResponse.json({ error: recipeError.message }, { status: 500 });
    recipes = filteredRecipes || [];
    total = recipes.length;
  }

  // 🟨 Case 3: default or search
  else {
    let queryBuilder = supabase.from("Recipe").select("*", { count: "exact" });

    if (query.trim()) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    }

    const { data, error, count } = await queryBuilder
      .order("id", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    recipes = data || [];
    total = count || 0;
  }

  return NextResponse.json({
    recipes,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
