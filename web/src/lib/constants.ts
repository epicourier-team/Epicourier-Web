export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

export const NUTRIENT_NAME: Record<
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
  | string,
  string
> = {
  agg_fats_g: "Aggregate fats (g)",
  agg_minerals_mg: "Aggregate minerals (mg)",
  agg_vit_b_mg: "Aggregate B vitamins (mg)",
  calories_kcal: "Calories (kcal)",
  carbs_g: "Carbohydrates (g)",
  cholesterol_mg: "Cholesterol (mg)",
  protein_g: "Protein (g)",
  sugars_g: "Sugars (g)",
  vit_a_microg: "Vitamin A (µg)",
  vit_c_mg: "Vitamin C (mg)",
  vit_d_microg: "Vitamin D (µg)",
  vit_e_mg: "Vitamin E (mg)",
  vit_k_microg: "Vitamin K (µg)",
};
