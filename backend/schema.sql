-- Create Recipe table
CREATE TABLE "Recipe" (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    min_prep_time INTEGER,
    green_score INTEGER,
    image_url TEXT
);

-- Create Ingredient table
CREATE TABLE "Ingredient" (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    unit TEXT,
    calories_kcal NUMERIC,
    protein_g NUMERIC,
    carbs_g NUMERIC,
    sugars_g NUMERIC,
    agg_fats_g NUMERIC,
    cholesterol_mg NUMERIC,
    agg_minerals_mg NUMERIC,
    vit_a_microg NUMERIC,
    agg_vit_b_mg NUMERIC,
    vit_c_mg NUMERIC,
    vit_d_microg NUMERIC,
    vit_e_mg NUMERIC,
    vit_k_microg NUMERIC
);

-- Create RecipeTag table
CREATE TABLE "RecipeTag" (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT
);

-- Create Recipe-Ingredient_Map table
CREATE TABLE "Recipe-Ingredient_Map" (
    id BIGINT PRIMARY KEY,
    recipe_id BIGINT REFERENCES "Recipe"(id),
    ingredient_id BIGINT REFERENCES "Ingredient"(id),
    relative_unit_100 NUMERIC
);

-- Create Recipe-Tag_Map table
CREATE TABLE "Recipe-Tag_Map" (
    id BIGINT PRIMARY KEY,
    recipe_id BIGINT REFERENCES "Recipe"(id),
    tag_id BIGINT REFERENCES "RecipeTag"(id)
);

-- User table is already created in Supabase with the following structure:
-- CREATE TABLE "User" (
--   id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
--   created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
--   fullname VARCHAR,
--   email VARCHAR,
--   username VARCHAR UNIQUE,
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   auth_id UUID REFERENCES auth.users(id)
-- );

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public."User" (auth_id, email, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NOW(), NOW());
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- If user already exists, just return
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create User record on auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
