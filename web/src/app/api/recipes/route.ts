import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";
import { Recipe } from "../../../types/data";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // ✅ parse query parameters
  const query = searchParams.get("query") || "";
  const ingredientIds = searchParams.getAll("ingredientIds").map(Number).filter(Boolean);
  const tagIds = searchParams.getAll("tagIds").map(Number).filter(Boolean);
  const userIngredientIds = searchParams.getAll("userIngredientIds").map(Number).filter(Boolean);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  const sortBy = searchParams.get("sortBy") || "default";
  const matchFilter = searchParams.get("matchFilter") || "all";

  let recipes: Recipe[] = [];
  let total = 0;

  // Helper to calculate match percentage
  const calculateMatch = (recipe: Recipe) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recipeIngredients = (recipe as any)["Recipe-Ingredient_Map"] || [];
    if (recipeIngredients.length === 0) return 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const matchedCount = recipeIngredients.filter((ri: any) =>
      userIngredientIds.includes(ri.ingredient_id)
    ).length;
    return (matchedCount / recipeIngredients.length) * 100;
  };

  // Check if we need "Match Mode" (in-memory processing)
  const isMatchMode =
    sortBy === "match-high" || sortBy === "match-low" || (matchFilter && matchFilter !== "all");

  // 1. Build base query
  let queryBuilder = supabase.from("Recipe").select(
    `
    *,
    "Recipe-Ingredient_Map" (
      ingredient_id,
      relative_unit_100
    )
  `,
    { count: "exact" }
  );

  // Apply filters to the query builder
  if (ingredientIds.length > 0) {
    // Note: This is a simplified approach. For exact ingredient matching, we'd need a different query.
    // Here we just filter recipes that contain *any* of the ingredients, or we can use the previous logic.
    // Re-using the previous logic of fetching IDs first is better for "contains all" or "contains any".
    // But for simplicity and consistency with the previous code, let's stick to the previous logic structure
    // but adapted for the single query builder if possible.
    // However, Supabase doesn't support complex "where exists" easily in one go without foreign keys filtering.
    // So let's stick to the previous "fetch IDs first" approach if ingredientIds are present.
    const { data: ingData } = await supabase
      .from("Recipe-Ingredient_Map")
      .select("recipe_id")
      .in("ingredient_id", ingredientIds);
    const recipeIds = Array.from(new Set((ingData || []).map((d) => d.recipe_id)));
    queryBuilder = queryBuilder.in("id", recipeIds);
  }

  if (tagIds.length > 0) {
    const { data: tagData } = await supabase
      .from("Recipe-Tag_Map")
      .select("recipe_id")
      .in("tag_id", tagIds);
    const recipeIds = Array.from(new Set((tagData || []).map((d) => d.recipe_id)));
    queryBuilder = queryBuilder.in("id", recipeIds);
  }

  if (query.trim()) {
    queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
  }

  // 2. Execute Query
  // If Match Mode, we fetch ALL matching recipes (no range) to process in memory.
  // Otherwise, we use DB pagination.
  if (isMatchMode) {
    const { data, error } = await queryBuilder.order("id", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    let processedRecipes = data || [];

    // Calculate match % and attach it (optional, but good for sorting)
    const recipesWithMatch = processedRecipes.map((r) => ({
      ...r,
      matchPercentage: calculateMatch(r),
    }));

    // Filter by Match
    if (matchFilter === "can-make") {
      processedRecipes = recipesWithMatch.filter((r) => r.matchPercentage >= 80);
    } else if (matchFilter === "partial") {
      processedRecipes = recipesWithMatch.filter(
        (r) => r.matchPercentage >= 50 && r.matchPercentage < 80
      );
    } else if (matchFilter === "need-shopping") {
      processedRecipes = recipesWithMatch.filter((r) => r.matchPercentage < 50);
    } else {
      processedRecipes = recipesWithMatch;
    }

    // Sort by Match
    if (sortBy === "match-high") {
      processedRecipes.sort((a, b) => b.matchPercentage - a.matchPercentage);
    } else if (sortBy === "match-low") {
      processedRecipes.sort((a, b) => a.matchPercentage - b.matchPercentage);
    }

    // Pagination in memory
    total = processedRecipes.length;
    recipes = processedRecipes.slice(offset, offset + limit);
  } else {
    // Standard DB Pagination
    // Default sort
    queryBuilder = queryBuilder.order("id", { ascending: false });

    const { data, error, count } = await queryBuilder.range(offset, offset + limit - 1);
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
