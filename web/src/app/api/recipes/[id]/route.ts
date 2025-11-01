import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const recipeId = id;

  const { data: recipe, error: recipeError } = await supabase
    .from("Recipe")
    .select("*")
    .eq("id", +recipeId)
    .single();

  if (recipeError || !recipe)
    return NextResponse.json({ error: "Recipe not found", id: +recipeId }, { status: 404 });

  const { data: rawIngredients } = await supabase
    .from("Recipe-Ingredient_Map")
    .select(
      `
      relative_unit_100,
      ingredient:ingredient_id (id, name, unit, agg_fats_g, agg_minerals_mg, agg_vit_b_mg, calories_kcal, carbs_g, cholesterol_mg, protein_g, sugars_g, vit_a_microg, vit_c_mg, vit_d_microg, vit_e_mg, vit_k_microg)
    `
    )
    .eq("recipe_id", recipeId);

  const ingredients = rawIngredients?.map((row) => ({
    relative_unit_100: row.relative_unit_100,
    ingredient: Array.isArray(row.ingredient) ? row.ingredient[0] : row.ingredient,
  }));

  const { data: tags } = await supabase
    .from("Recipe-Tag_Map")
    .select(
      `
      tag:tag_id (id, name, description)
    `
    )
    .eq("recipe_id", recipeId);

  const sumNutrients = ingredients?.reduce(
    (acc, curr) => {
      const factor = (curr.relative_unit_100 ?? 0) / 100;
      acc.agg_fats_g += (curr.ingredient.agg_fats_g ?? 0) * factor;
      acc.agg_minerals_mg += (curr.ingredient.agg_minerals_mg ?? 0) * factor;
      acc.agg_vit_b_mg += (curr.ingredient.agg_vit_b_mg ?? 0) * factor;
      acc.calories_kcal += (curr.ingredient.calories_kcal ?? 0) * factor;
      acc.carbs_g += (curr.ingredient.carbs_g ?? 0) * factor;
      acc.cholesterol_mg += (curr.ingredient.cholesterol_mg ?? 0) * factor;
      acc.protein_g += (curr.ingredient.protein_g ?? 0) * factor;
      acc.sugars_g += (curr.ingredient.sugars_g ?? 0) * factor;
      acc.vit_a_microg += (curr.ingredient.vit_a_microg ?? 0) * factor;
      acc.vit_c_mg += (curr.ingredient.vit_c_mg ?? 0) * factor;
      acc.vit_d_microg += (curr.ingredient.vit_d_microg ?? 0) * factor;
      return acc;
    },
    {
      agg_fats_g: 0,
      agg_minerals_mg: 0,
      agg_vit_b_mg: 0,
      calories_kcal: 0,
      carbs_g: 0,
      cholesterol_mg: 0,
      protein_g: 0,
      sugars_g: 0,
      vit_a_microg: 0,
      vit_c_mg: 0,
      vit_d_microg: 0,
      vit_e_mg: 0,
      vit_k_microg: 0,
    }
  );

  return NextResponse.json({
    recipe,
    ingredients,
    tags,
    sumNutrients,
  });
}
