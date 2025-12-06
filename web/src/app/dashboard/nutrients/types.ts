export type GoalField =
  | "calories_kcal"
  | "protein_g"
  | "carbs_g"
  | "fats_g"
  | "sodium_mg"
  | "fiber_g";

export type GoalFormValues = {
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  sodium_mg: number;
  fiber_g: number;
};

export type TrendPoint = {
  label: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  daysTracked?: number;
  rangeLabel?: string;
};
