import { Database } from "./supabase";

export type Recipe = Database["public"]["Tables"]["Recipe"]["Row"];
export type Ingredient = Database["public"]["Tables"]["Ingredient"]["Row"];
export type RecipeIngredientMap = Database["public"]["Tables"]["Recipe-Ingredient_Map"]["Row"];
export type Tag = Database["public"]["Tables"]["RecipeTag"]["Row"];
export type RecipeTagMap = Database["public"]["Tables"]["Recipe-Tag_Map"]["Row"];

export type RecipeDetail = {
  recipe: Recipe;
  ingredients: (RecipeIngredientMap & { ingredient: Ingredient })[];
  tags: (RecipeTagMap & { tag: Tag })[];
};
