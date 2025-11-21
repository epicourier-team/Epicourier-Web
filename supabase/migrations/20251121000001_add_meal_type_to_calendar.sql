-- Migration: Add meal_type to Calendar table

ALTER TABLE "Calendar"
ADD COLUMN "meal_type" text NOT NULL DEFAULT 'dinner';

COMMENT ON COLUMN "Calendar"."meal_type" IS 'Meal type: breakfast, lunch, or dinner';

-- Remove default after backfill (if needed, but for new rows we want it required)
-- ALTER TABLE "Calendar" ALTER COLUMN "meal_type" DROP DEFAULT;
