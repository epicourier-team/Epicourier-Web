export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      achievement_definitions: {
        Row: {
          created_at: string | null;
          criteria: Json;
          description: string | null;
          icon: string | null;
          id: number;
          name: string;
          tier: "bronze" | "silver" | "gold" | "platinum" | null;
          title: string;
        };
        Insert: {
          created_at?: string | null;
          criteria: Json;
          description?: string | null;
          icon?: string | null;
          id?: number;
          name: string;
          tier?: "bronze" | "silver" | "gold" | "platinum" | null;
          title: string;
        };
        Update: {
          created_at?: string | null;
          criteria?: Json;
          description?: string | null;
          icon?: string | null;
          id?: number;
          name?: string;
          tier?: "bronze" | "silver" | "gold" | "platinum" | null;
          title?: string;
        };
        Relationships: [];
      };
      Calendar: {
        Row: {
          created_at: string;
          date: string | null;
          id: number;
          meal_type: string;
          notes: string | null;
          recipe_id: number | null;
          status: boolean | null;
          updated_at: string | null;
          user_id: number | null;
        };
        Insert: {
          created_at?: string;
          date?: string | null;
          id?: number;
          meal_type: string;
          notes?: string | null;
          recipe_id?: number | null;
          status?: boolean | null;
          updated_at?: string | null;
          user_id?: number | null;
        };
        Update: {
          created_at?: string;
          date?: string | null;
          id?: number;
          meal_type?: string;
          notes?: string | null;
          recipe_id?: number | null;
          status?: boolean | null;
          updated_at?: string | null;
          user_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "Calendar_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "Recipe";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Calendar_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "User";
            referencedColumns: ["id"];
          },
        ];
      };
      nutrient_tracking: {
        Row: {
          calories_kcal: number | null;
          carbs_g: number | null;
          created_at: string | null;
          date: string;
          fats_g: number | null;
          fiber_g: number | null;
          id: number;
          meal_count: number | null;
          month_start: string;
          protein_g: number | null;
          sodium_mg: number | null;
          sugar_g: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          calories_kcal?: number | null;
          carbs_g?: number | null;
          created_at?: string | null;
          date: string;
          fats_g?: number | null;
          fiber_g?: number | null;
          id?: number;
          meal_count?: number | null;
          month_start?: string;
          protein_g?: number | null;
          sodium_mg?: number | null;
          sugar_g?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          calories_kcal?: number | null;
          carbs_g?: number | null;
          created_at?: string | null;
          date?: string;
          fats_g?: number | null;
          fiber_g?: number | null;
          id?: number;
          meal_count?: number | null;
          month_start?: string;
          protein_g?: number | null;
          sodium_mg?: number | null;
          sugar_g?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      Ingredient: {
        Row: {
          agg_fats_g: number | null;
          agg_minerals_mg: number | null;
          agg_vit_b_mg: number | null;
          calories_kcal: number | null;
          carbs_g: number | null;
          cholesterol_mg: number | null;
          created_at: string;
          id: number;
          name: string | null;
          protein_g: number | null;
          sugars_g: number | null;
          unit: string;
          vit_a_microg: number | null;
          vit_c_mg: number | null;
          vit_d_microg: number | null;
          vit_e_mg: number | null;
          vit_k_microg: number | null;
        };
        Insert: {
          agg_fats_g?: number | null;
          agg_minerals_mg?: number | null;
          agg_vit_b_mg?: number | null;
          calories_kcal?: number | null;
          carbs_g?: number | null;
          cholesterol_mg?: number | null;
          created_at?: string;
          id?: number;
          name?: string | null;
          protein_g?: number | null;
          sugars_g?: number | null;
          unit: string;
          vit_a_microg?: number | null;
          vit_c_mg?: number | null;
          vit_d_microg?: number | null;
          vit_e_mg?: number | null;
          vit_k_microg?: number | null;
        };
        Update: {
          agg_fats_g?: number | null;
          agg_minerals_mg?: number | null;
          agg_vit_b_mg?: number | null;
          calories_kcal?: number | null;
          carbs_g?: number | null;
          cholesterol_mg?: number | null;
          created_at?: string;
          id?: number;
          name?: string | null;
          protein_g?: number | null;
          sugars_g?: number | null;
          unit?: string;
          vit_a_microg?: number | null;
          vit_c_mg?: number | null;
          vit_d_microg?: number | null;
          vit_e_mg?: number | null;
          vit_k_microg?: number | null;
        };
        Relationships: [];
      };
      Recipe: {
        Row: {
          created_at: string;
          description: string | null;
          green_score: number | null;
          id: number;
          image_url: string | null;
          min_prep_time: number | null;
          name: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          green_score?: number | null;
          id?: number;
          image_url?: string | null;
          min_prep_time?: number | null;
          name?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          green_score?: number | null;
          id?: number;
          image_url?: string | null;
          min_prep_time?: number | null;
          name?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      "Recipe-Calendar_Map": {
        Row: {
          calendar_id: number | null;
          id: number;
          recipe_id: number | null;
        };
        Insert: {
          calendar_id?: number | null;
          id: number;
          recipe_id?: number | null;
        };
        Update: {
          calendar_id?: number | null;
          id?: number;
          recipe_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "Recipe-Calendar_Map_calendar_id_fkey";
            columns: ["calendar_id"];
            isOneToOne: false;
            referencedRelation: "Calendar";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Recipe-Calendar_Map_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "Recipe";
            referencedColumns: ["id"];
          },
        ];
      };
      "Recipe-Ingredient_Map": {
        Row: {
          id: number;
          ingredient_id: number | null;
          recipe_id: number | null;
          relative_unit_100: number | null;
        };
        Insert: {
          id?: number;
          ingredient_id?: number | null;
          recipe_id?: number | null;
          relative_unit_100?: number | null;
        };
        Update: {
          id?: number;
          ingredient_id?: number | null;
          recipe_id?: number | null;
          relative_unit_100?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "Recipe-Ingredient_Map_ingredient_id_fkey";
            columns: ["ingredient_id"];
            isOneToOne: false;
            referencedRelation: "Ingredient";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Recipe-Ingredient_Map_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "Recipe";
            referencedColumns: ["id"];
          },
        ];
      };
      "Recipe-Tag_Map": {
        Row: {
          id: number;
          recipe_id: number | null;
          tag_id: number | null;
        };
        Insert: {
          id?: number;
          recipe_id?: number | null;
          tag_id?: number | null;
        };
        Update: {
          id?: number;
          recipe_id?: number | null;
          tag_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "Recipe-Tag_Map_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "Recipe";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Recipe-Tag_Map_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "RecipeTag";
            referencedColumns: ["id"];
          },
        ];
      };
      RecipeTag: {
        Row: {
          created_at: string;
          description: string | null;
          id: number;
          name: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: number;
          name?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: number;
          name?: string | null;
        };
        Relationships: [];
      };
      user_achievements: {
        Row: {
          achievement_id: number;
          earned_at: string | null;
          id: number;
          progress: Json | null;
          user_id: string;
        };
        Insert: {
          achievement_id: number;
          earned_at?: string | null;
          id?: number;
          progress?: Json | null;
          user_id: string;
        };
        Update: {
          achievement_id?: number;
          earned_at?: string | null;
          id?: number;
          progress?: Json | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey";
            columns: ["achievement_id"];
            isOneToOne: false;
            referencedRelation: "achievement_definitions";
            referencedColumns: ["id"];
          },
        ];
      };
      User: {
        Row: {
          created_at: string;
          email: string | null;
          fullname: string | null;
          id: number;
          password_hash: string;
          updated_at: string | null;
          username: string | null;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          fullname?: string | null;
          id?: number;
          password_hash: string;
          updated_at?: string | null;
          username?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          fullname?: string | null;
          id?: number;
          password_hash?: string;
          updated_at?: string | null;
          username?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
