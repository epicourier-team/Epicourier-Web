import { NUTRIENT_NAME } from "@/lib/constants";

describe("NUTRIENT_NAME", () => {
  it("has all expected nutrient keys", () => {
    expect(NUTRIENT_NAME).toHaveProperty("agg_fats_g");
    expect(NUTRIENT_NAME).toHaveProperty("agg_minerals_mg");
    expect(NUTRIENT_NAME).toHaveProperty("agg_vit_b_mg");
    expect(NUTRIENT_NAME).toHaveProperty("calories_kcal");
    expect(NUTRIENT_NAME).toHaveProperty("carbs_g");
    expect(NUTRIENT_NAME).toHaveProperty("cholesterol_mg");
    expect(NUTRIENT_NAME).toHaveProperty("protein_g");
    expect(NUTRIENT_NAME).toHaveProperty("sugars_g");
    expect(NUTRIENT_NAME).toHaveProperty("vit_a_microg");
    expect(NUTRIENT_NAME).toHaveProperty("vit_c_mg");
    expect(NUTRIENT_NAME).toHaveProperty("vit_d_microg");
    expect(NUTRIENT_NAME).toHaveProperty("vit_e_mg");
    expect(NUTRIENT_NAME).toHaveProperty("vit_k_microg");
  });

  it("has human-readable labels for all nutrients", () => {
    expect(NUTRIENT_NAME.agg_fats_g).toBe("Aggregate fats (g)");
    expect(NUTRIENT_NAME.agg_minerals_mg).toBe("Aggregate minerals (mg)");
    expect(NUTRIENT_NAME.agg_vit_b_mg).toBe("Aggregate B vitamins (mg)");
    expect(NUTRIENT_NAME.calories_kcal).toBe("Calories (kcal)");
    expect(NUTRIENT_NAME.carbs_g).toBe("Carbohydrates (g)");
    expect(NUTRIENT_NAME.cholesterol_mg).toBe("Cholesterol (mg)");
    expect(NUTRIENT_NAME.protein_g).toBe("Protein (g)");
    expect(NUTRIENT_NAME.sugars_g).toBe("Sugars (g)");
    expect(NUTRIENT_NAME.vit_a_microg).toBe("Vitamin A (µg)");
    expect(NUTRIENT_NAME.vit_c_mg).toBe("Vitamin C (mg)");
    expect(NUTRIENT_NAME.vit_d_microg).toBe("Vitamin D (µg)");
    expect(NUTRIENT_NAME.vit_e_mg).toBe("Vitamin E (mg)");
    expect(NUTRIENT_NAME.vit_k_microg).toBe("Vitamin K (µg)");
  });

  it("returns value for string index access", () => {
    const key: string = "calories_kcal";
    expect(NUTRIENT_NAME[key]).toBe("Calories (kcal)");
  });
});
