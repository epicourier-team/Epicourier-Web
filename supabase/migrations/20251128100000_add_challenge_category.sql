-- Add category column to challenges table for content-based grouping
-- Categories: nutrition, sustainability, habits, recipes, milestones

ALTER TABLE challenges ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'habits';

-- Update existing challenges with appropriate categories
UPDATE challenges SET category = 'nutrition' 
WHERE name IN ('monthly_nutrition_master', 'weekly_protein_boost', 'weekly_low_sugar', 'monthly_iron_focus', 'monthly_balanced_diet');

UPDATE challenges SET category = 'sustainability' 
WHERE name IN ('weekly_green_5', 'monthly_eco_champion', 'special_green_pioneer');

UPDATE challenges SET category = 'habits' 
WHERE name IN ('weekly_meals_14', 'weekly_streak_7', 'weekly_breakfast_hero', 'monthly_hydration_hero', 'monthly_meals_60', 'special_30_day_streak');

UPDATE challenges SET category = 'recipes' 
WHERE name IN ('weekly_variety_seeker', 'weekly_veggie_lover', 'monthly_recipe_explorer', 'special_100_recipes');

UPDATE challenges SET category = 'milestones' 
WHERE name IN ('special_first_week', 'special_perfect_day');

-- Add comment for documentation
COMMENT ON COLUMN challenges.category IS 'Content-based category: nutrition, sustainability, habits, recipes, milestones';
