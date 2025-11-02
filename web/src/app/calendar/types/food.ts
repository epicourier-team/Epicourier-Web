export interface Food {
  id: number;
  name: string;
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  image?: string;
  category?: string;
  created_at?: string;
}
