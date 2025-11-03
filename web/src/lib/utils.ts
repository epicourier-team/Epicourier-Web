import { SupabaseClient } from "@supabase/supabase-js";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { RecipeDetail } from "../types/data";
import { supabase } from "./supabaseClient";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function getRecipeDetail(
  recipeId: string,
  client: SupabaseClient = supabase
): Promise<RecipeDetail | null> {
  const { data: recipe, error: recipeError } = await client
    .from("Recipe")
    .select("*")
    .eq("id", +recipeId)
    .single();

  if (recipeError || !recipe) return null;

  const { data: rawIngredients } = await client
    .from("Recipe-Ingredient_Map")
    .select(
      `
        relative_unit_100,
        ingredient:ingredient_id (id, name, created_at, unit, agg_fats_g, agg_minerals_mg, agg_vit_b_mg, calories_kcal, carbs_g, cholesterol_mg, protein_g, sugars_g, vit_a_microg, vit_c_mg, vit_d_microg, vit_e_mg, vit_k_microg)
      `
    )
    .eq("recipe_id", recipeId);

  const ingredients = rawIngredients?.map((row) => {
    return {
      relative_unit_100: row.relative_unit_100,
      ingredient: Array.isArray(row.ingredient) ? row.ingredient[0] : row.ingredient,
    };
  });

  const { data: rawTags } = await client
    .from("Recipe-Tag_Map")
    .select(
      `
        tag:tag_id (id, name, description, created_at)
      `
    )
    .eq("recipe_id", recipeId);
  const tags = rawTags?.map((row) => {
    return {
      tag: Array.isArray(row.tag) ? row.tag[0] : row.tag,
    };
  });

  const initialNutrients = {
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
  };
  const sumNutrients = ingredients?.reduce((acc, curr) => {
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
  }, initialNutrients);

  if (!ingredients || !tags) return null;

  return {
    recipe,
    ingredients: ingredients ?? [],
    tags: tags ?? [],
    sumNutrients: sumNutrients ?? initialNutrients,
  };
}
