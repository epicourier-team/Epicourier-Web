import { Database } from "./supabase";

export type Recipe = Database["public"]["Tables"]["Recipe"]["Row"];
export type Ingredient = Database["public"]["Tables"]["Ingredient"]["Row"];
export type RecipeIngredientMap = Database["public"]["Tables"]["Recipe-Ingredient_Map"]["Row"];
export type Tag = Database["public"]["Tables"]["RecipeTag"]["Row"];
export type RecipeTagMap = Database["public"]["Tables"]["Recipe-Tag_Map"]["Row"];

export type RecipeDetail = {
  recipe: Recipe;
  ingredients: (Pick<RecipeIngredientMap, "relative_unit_100"> & { ingredient: Ingredient })[];
  tags: { tag: Tag }[];
  sumNutrients: Pick<
    Ingredient,
    | "agg_fats_g"
    | "agg_minerals_mg"
    | "agg_vit_b_mg"
    | "calories_kcal"
    | "carbs_g"
    | "cholesterol_mg"
    | "protein_g"
    | "sugars_g"
    | "vit_a_microg"
    | "vit_c_mg"
    | "vit_d_microg"
    | "vit_e_mg"
    | "vit_k_microg"
  >;
};
