# Epicourier Database Design

**Document Version**: 1.4  
**Last Updated**: November 29, 2025  
**Status**: Phase 2 In Progress (v1.1.0 ✅ | v1.2.0 ✅ | v1.3.0 �)

---

## 📋 Document Overview

This document describes the complete database schema for Epicourier, hosted on **Supabase PostgreSQL**. It covers table structures, relationships, indexes, and Row Level Security (RLS) policies.

**Purpose**:
- Understand database schema and table relationships
- Reference column types and constraints
- Learn about data integrity rules
- Understand security policies (RLS)

---

## 🗄️ Database Platform

**Platform**: Supabase (Managed PostgreSQL)  
**Version**: PostgreSQL 15+  
**Features Used**:
- Row Level Security (RLS)
- Foreign Key Constraints
- Indexes for query optimization
- Built-in Auth system

---

## 📊 Database Schema Overview

### Entity Relationship Diagram

```
┌─────────────┐
│    User     │
│ (Supabase   │
│   Auth)     │
└──────┬──────┘
       │
       │ 1:N
       ├───────────────────────────────────────────────────┐
       │                                                   │
       ▼                                                   ▼
┌─────────────┐         ┌──────────────────┐    ┌──────────────────┐
│  Calendar   │────────▶│  Recipe          │    │ nutrient_tracking│
│             │  N:1    │                  │    │ (Phase 2)        │
└─────────────┘         └────────┬─────────┘    └──────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    │                         │
                    │ N:M                     │ N:M
                    ▼                         ▼
        ┌───────────────────┐    ┌──────────────────┐
        │ Recipe-Ingredient │    │  Recipe-Tag_Map  │
        │      _Map         │    │                  │
        └─────────┬─────────┘    └────────┬─────────┘
                  │                       │
                  │ N:1                   │ N:1
                  ▼                       ▼
        ┌─────────────────┐    ┌──────────────────┐
        │   Ingredient    │    │    RecipeTag     │
        └─────────────────┘    └──────────────────┘

       ┌──────────────────────────────────────────────────┐
       │               Gamification System (Phase 2)       │
       └──────────────────────────────────────────────────┘
       
┌─────────────────────┐         ┌────────────────────────┐
│achievement_definitions│◀───────│   user_achievements   │
│                      │   N:1   │                        │
└──────────────────────┘         └────────────────────────┘
                                          │
                                          │ N:1
                                          ▼
                                 ┌─────────────┐
                                 │ auth.users  │
                                 └─────────────┘

       ┌──────────────────────────────────────────────────┐
       │               Nutrient Goals (Phase 2)            │
       └──────────────────────────────────────────────────┘
       
                                 ┌─────────────────┐
                                 │  nutrient_goals │
                                 │  (per user)     │
                                 └─────────────────┘
                                          │
                                          │ 1:1
                                          ▼
                                 ┌─────────────┐
                                 │ auth.users  │
                                 └─────────────┘
```

---

## 📋 Core Tables

### Recipe Table

Stores all recipe information including nutritional data and sustainability metrics.

**Table Name**: `Recipe`

| Column         | Type      | Constraints           | Description                        |
|----------------|-----------|-----------------------|------------------------------------|
| id             | integer   | PRIMARY KEY           | Unique recipe identifier           |
| name           | text      | NOT NULL              | Recipe name                        |
| description    | text      |                       | Recipe preparation instructions    |
| min_prep_time  | integer   |                       | Minimum preparation time (minutes) |
| green_score    | numeric   |                       | Sustainability score (0-10)        |
| image_url      | text      |                       | Recipe image URL                   |

**Example Data**:
```sql
id: 52764
name: "Garides Saganaki"
description: "Place the prawns in a pot and add enough water to cover..."
min_prep_time: 25
green_score: 7.5
image_url: "https://..."
```

**Indexes**:
- Primary key index on `id`
- Index on `name` for text search
- Index on `green_score` for filtering

---

### Ingredient Table

Master list of all ingredients with nutritional information.

**Table Name**: `Ingredient`

| Column           | Type      | Constraints    | Description                         |
|------------------|-----------|----------------|-------------------------------------|
| id               | integer   | PRIMARY KEY    | Unique ingredient identifier        |
| name             | text      | NOT NULL       | Ingredient name                     |
| unit             | text      |                | Measurement unit (g, ml, whole)     |
| calories_kcal    | numeric   |                | Calories per unit                   |
| protein_g        | numeric   |                | Protein content (grams)             |
| carbs_g          | numeric   |                | Carbohydrates (grams)               |
| sugars_g         | numeric   |                | Sugar content (grams)               |
| agg_fats_g       | numeric   |                | Total fats (grams)                  |
| cholesterol_mg   | numeric   |                | Cholesterol (milligrams)            |
| agg_minerals_mg  | numeric   |                | Aggregate minerals (milligrams)     |
| vit_a_microg     | numeric   |                | Vitamin A (micrograms)              |
| agg_vit_b_mg     | numeric   |                | Aggregate B vitamins (milligrams)   |
| vit_c_mg         | numeric   |                | Vitamin C (milligrams)              |
| vit_d_microg     | numeric   |                | Vitamin D (micrograms)              |
| vit_e_mg         | numeric   |                | Vitamin E (milligrams)              |
| vit_k_microg     | numeric   |                | Vitamin K (micrograms)              |

**Example Data**:
```sql
id: 1
name: "Raw King Prawns"
unit: "100 g"
calories_kcal: 99
protein_g: 24
carbs_g: 0.2
sugars_g: 0
agg_fats_g: 0.3
```

**Indexes**:
- Primary key index on `id`
- Index on `name` for search
- Index on `calories_kcal` for filtering

---

### RecipeTag Table

Categories and dietary tags for recipes.

**Table Name**: `RecipeTag`

| Column      | Type      | Constraints    | Description                    |
|-------------|-----------|----------------|--------------------------------|
| id          | integer   | PRIMARY KEY    | Unique tag identifier          |
| name        | text      | NOT NULL       | Tag name (e.g., "Vegetarian")  |
| description | text      |                | Tag description                |

**Example Data**:
```sql
id: 1
name: "Seafood"
description: ""

id: 2
name: "Vegetarian"
description: "No meat or fish"
```

**Common Tags**:
- Vegetarian
- Vegan
- Gluten-Free
- Dairy-Free
- High Protein
- Low Carb
- Keto
- Paleo

**Indexes**:
- Primary key index on `id`
- Index on `name` for filtering

---

## 🔗 Relationship Tables

### Recipe-Ingredient_Map

Many-to-many relationship between recipes and ingredients.

**Table Name**: `Recipe-Ingredient_Map`

| Column              | Type      | Constraints                      | Description                        |
|---------------------|-----------|----------------------------------|------------------------------------|
| id                  | integer   | PRIMARY KEY                      | Unique mapping identifier          |
| recipe_id           | integer   | FOREIGN KEY → Recipe(id)         | References Recipe table            |
| ingredient_id       | integer   | FOREIGN KEY → Ingredient(id)     | References Ingredient table        |
| relative_unit_100   | numeric   |                                  | Quantity relative to 100g base     |

**Example Data**:
```sql
id: 1
recipe_id: 52764  -- Garides Saganaki
ingredient_id: 1  -- Raw King Prawns
relative_unit_100: 500  -- 500g needed
```

**Constraints**:
- Foreign key to Recipe (ON DELETE CASCADE)
- Foreign key to Ingredient (ON DELETE CASCADE)
- Unique constraint on (recipe_id, ingredient_id)

**Indexes**:
- Index on `recipe_id` for recipe lookups
- Index on `ingredient_id` for ingredient search
- Composite index on (recipe_id, ingredient_id)

---

### Recipe-Tag_Map

Many-to-many relationship between recipes and tags.

**Table Name**: `Recipe-Tag_Map`

| Column     | Type      | Constraints                  | Description                  |
|------------|-----------|------------------------------|------------------------------|
| id         | integer   | PRIMARY KEY                  | Unique mapping identifier    |
| recipe_id  | integer   | FOREIGN KEY → Recipe(id)     | References Recipe table      |
| tag_id     | integer   | FOREIGN KEY → RecipeTag(id)  | References RecipeTag table   |

**Example Data**:
```sql
id: 1
recipe_id: 52764  -- Garides Saganaki
tag_id: 1         -- Seafood
```

**Constraints**:
- Foreign key to Recipe (ON DELETE CASCADE)
- Foreign key to RecipeTag (ON DELETE CASCADE)
- Unique constraint on (recipe_id, tag_id)

**Indexes**:
- Index on `recipe_id`
- Index on `tag_id`
- Composite index on (recipe_id, tag_id)

---

## 👤 User Tables

### User Table

User profile information (stored in public schema, separate from auth.users).

**Table Name**: `User`

| Column     | Type      | Constraints              | Description                    |
|------------|-----------|--------------------------|--------------------------------|
| id         | integer   | PRIMARY KEY              | User ID                        |
| email      | text      | UNIQUE, NOT NULL         | User email address             |
| created_at | timestamp | DEFAULT now()            | Account creation timestamp     |

**Note**: This table links to Supabase Auth's `auth.users` table via email.

**Indexes**:
- Primary key index on `id`
- Unique index on `email`

---

### Calendar Table

User's meal planning calendar.

**Table Name**: `Calendar`

| Column     | Type      | Constraints                  | Description                         |
|------------|-----------|------------------------------|-------------------------------------|
| id         | integer   | PRIMARY KEY                  | Unique calendar entry identifier    |
| user_id    | integer   | FOREIGN KEY → User(id)       | References User table               |
| recipe_id  | integer   | FOREIGN KEY → Recipe(id)     | References Recipe table             |
| date       | date      | NOT NULL                     | Meal date (YYYY-MM-DD)              |
| meal_type  | text      | NOT NULL                     | "breakfast", "lunch", or "dinner"   |
| status     | boolean   | DEFAULT false                | Meal completion status              |
| notes      | text      |                              | User notes for this meal            |

**Example Data**:
```sql
id: 123
user_id: 1
recipe_id: 52764
date: "2025-11-20"
meal_type: "dinner"
status: false
notes: "Try with extra feta cheese"
```

**Constraints**:
- Foreign key to User (ON DELETE CASCADE)
- Foreign key to Recipe (ON DELETE CASCADE)
- Check constraint: meal_type IN ('breakfast', 'lunch', 'dinner')

**Indexes**:
- Primary key index on `id`
- Index on `user_id` for user queries
- Index on `date` for date range queries
- Composite index on (user_id, date, meal_type) for calendar views

---

## � Phase 2: Nutrient Tracking Tables

### nutrient_tracking Table

Daily aggregated nutrient data for users, computed from Calendar meal logs.

**Table Name**: `nutrient_tracking`

| Column        | Type      | Constraints                        | Description                          |
|---------------|-----------|------------------------------------|--------------------------------------|
| id            | integer   | PRIMARY KEY (SERIAL)               | Unique tracking record identifier    |
| user_id       | uuid      | NOT NULL, FOREIGN KEY → auth.users | References Supabase auth.users       |
| date          | date      | NOT NULL                           | Tracking date (YYYY-MM-DD)           |
| calories_kcal | numeric   | DEFAULT 0                          | Total calories for the day           |
| protein_g     | numeric   | DEFAULT 0                          | Total protein (grams)                |
| carbs_g       | numeric   | DEFAULT 0                          | Total carbohydrates (grams)          |
| fats_g        | numeric   | DEFAULT 0                          | Total fats (grams)                   |
| fiber_g       | numeric   | DEFAULT 0                          | Total fiber (grams)                  |
| sugar_g       | numeric   | DEFAULT 0                          | Total sugar (grams)                  |
| sodium_mg     | numeric   | DEFAULT 0                          | Total sodium (milligrams)            |
| meal_count    | integer   | DEFAULT 0                          | Number of meals logged for the day   |
| month_start   | date      | GENERATED ALWAYS AS (IMMUTABLE)    | First day of month (for indexing)    |
| created_at    | timestamp | DEFAULT now()                      | Record creation timestamp            |
| updated_at    | timestamp | DEFAULT now()                      | Record last update timestamp         |

**Important**: The `month_start` column is a generated column using an IMMUTABLE function:

```sql
-- Required function for IMMUTABLE index
CREATE OR REPLACE FUNCTION date_trunc_month_immutable(d date)
RETURNS date
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT date_trunc('month', d)::date;
$$;

-- Column definition
month_start date GENERATED ALWAYS AS (date_trunc_month_immutable(date)) STORED
```

**Example Data**:
```sql
id: 1
user_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
date: "2025-11-28"
calories_kcal: 1850.5
protein_g: 95.2
carbs_g: 210.8
fats_g: 68.3
fiber_g: 28.5
sugar_g: 45.2
sodium_mg: 2100.0
meal_count: 3
month_start: "2025-11-01"
```

**Constraints**:
- Foreign key to auth.users (ON DELETE CASCADE)
- Unique constraint on (user_id, date)

**Indexes**:
- Primary key index on `id`
- Index on `user_id` for user queries
- Index on `date` for date range queries
- Index on `month_start` for monthly aggregations
- Composite unique index on `(user_id, date)`

---

### nutrient_goals Table

User-defined daily nutrient intake goals.

**Table Name**: `nutrient_goals`

| Column        | Type      | Constraints                         | Description                      |
|---------------|-----------|-------------------------------------|----------------------------------|
| user_id       | uuid      | PRIMARY KEY, FOREIGN KEY → auth.users | User's auth UUID (1:1)         |
| calories_kcal | numeric   | DEFAULT 2000                        | Daily calorie goal               |
| protein_g     | numeric   | DEFAULT 50                          | Daily protein goal (grams)       |
| carbs_g       | numeric   | DEFAULT 250                         | Daily carbohydrate goal (grams)  |
| fats_g        | numeric   | DEFAULT 65                          | Daily fat goal (grams)           |
| fiber_g       | numeric   | DEFAULT 25                          | Daily fiber goal (grams)         |
| sodium_mg     | numeric   | DEFAULT 2300                        | Daily sodium goal (milligrams)   |
| created_at    | timestamp | DEFAULT now()                       | Record creation timestamp        |
| updated_at    | timestamp | DEFAULT now()                       | Record last update timestamp     |

**Example Data**:
```sql
user_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
calories_kcal: 2200
protein_g: 120
carbs_g: 200
fats_g: 70
fiber_g: 30
sodium_mg: 2000
```

**Constraints**:
- Primary key on `user_id` (ensures 1:1 relationship)
- Foreign key to auth.users (ON DELETE CASCADE)

**Indexes**:
- Primary key index on `user_id`

---

## 🏆 Phase 2: Gamification Tables

### achievement_definitions Table

Master list of all achievements/badges available in the system.

**Table Name**: `achievement_definitions`

| Column      | Type      | Constraints     | Description                           |
|-------------|-----------|-----------------|---------------------------------------|
| id          | integer   | PRIMARY KEY     | Unique achievement identifier         |
| name        | text      | NOT NULL, UNIQUE| Internal name (e.g., "first_meal")   |
| title       | text      | NOT NULL        | Display title (e.g., "First Steps")  |
| description | text      |                 | User-facing achievement description   |
| icon        | text      |                 | Icon name (lucide-react icon)         |
| tier        | enum      | DEFAULT 'bronze'| "bronze", "silver", "gold", "platinum"|
| criteria    | jsonb     | NOT NULL        | Criteria for earning achievement      |
| created_at  | timestamp | DEFAULT now()   | Record creation timestamp             |

**Criteria JSON Structure**:
```typescript
interface AchievementCriteria {
  type: "count" | "streak" | "threshold";
  metric: "meals_logged" | "green_recipes" | "days_tracked" | 
          "current_streak" | "dashboard_views" | "nutrient_aware_meals";
  target: number;
}
```

**Example Data**:
```sql
id: 1
name: "first_meal"
title: "First Steps"
description: "Log your first meal"
icon: "Utensils"
tier: "bronze"
criteria: {"type": "count", "metric": "meals_logged", "target": 1}

id: 2
name: "meal_planner_10"
title: "Meal Planner"
description: "Log 10 meals"
icon: "Calendar"
tier: "silver"
criteria: {"type": "count", "metric": "meals_logged", "target": 10}

id: 3
name: "eco_warrior"
title: "Eco Warrior"
description: "Choose 5 sustainable green recipes"
icon: "Leaf"
tier: "gold"
criteria: {"type": "count", "metric": "green_recipes", "target": 5}

id: 4
name: "streak_7"
title: "Week Warrior"
description: "Maintain a 7-day logging streak"
icon: "Flame"
tier: "silver"
criteria: {"type": "streak", "metric": "current_streak", "target": 7}
```

**Tier Progression**:
| Tier     | Difficulty | Icon Color (UI) |
|----------|------------|-----------------|
| bronze   | Easy       | #CD7F32         |
| silver   | Medium     | #C0C0C0         |
| gold     | Hard       | #FFD700         |
| platinum | Expert     | #E5E4E2         |

**Indexes**:
- Primary key index on `id`
- Unique index on `name`
- Index on `tier` for filtering

---

### user_achievements Table

Tracks which achievements each user has earned.

**Table Name**: `user_achievements`

| Column         | Type      | Constraints                                    | Description                        |
|----------------|-----------|------------------------------------------------|------------------------------------|
| id             | integer   | PRIMARY KEY (SERIAL)                           | Unique record identifier           |
| user_id        | uuid      | NOT NULL, FOREIGN KEY → auth.users             | User who earned the achievement    |
| achievement_id | integer   | NOT NULL, FOREIGN KEY → achievement_definitions| Achievement that was earned        |
| earned_at      | timestamp | DEFAULT now()                                  | When the achievement was earned    |
| progress       | jsonb     |                                                | Progress data at time of earning   |

**Progress JSON Structure**:
```typescript
interface AchievementProgress {
  final_value: number;     // Value that triggered the award
  trigger: string;         // What triggered the check ("meal_logged", "auto_check", etc.)
  source?: string;         // API endpoint that awarded it
}
```

**Example Data**:
```sql
id: 1
user_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
achievement_id: 1  -- First Steps
earned_at: "2025-11-25T10:30:00Z"
progress: {"final_value": 1, "trigger": "meal_logged"}

id: 2
user_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
achievement_id: 4  -- Week Warrior
earned_at: "2025-11-28T18:45:00Z"
progress: {"final_value": 7, "trigger": "auto_check", "source": "GET /api/achievements"}
```

**Constraints**:
- Foreign key to auth.users (ON DELETE CASCADE)
- Foreign key to achievement_definitions (ON DELETE CASCADE)
- Unique constraint on (user_id, achievement_id) - each user can earn each achievement only once

**Indexes**:
- Primary key index on `id`
- Index on `user_id` for user queries
- Index on `achievement_id` for achievement lookups
- Composite unique index on `(user_id, achievement_id)`

---

### streak_history Table

Tracks user streaks for various activities like daily logging, meeting nutrient goals, and using green recipes.

**Table Name**: `streak_history`

| Column             | Type        | Constraints                        | Description                              |
|--------------------|-------------|------------------------------------|-----------------------------------------|
| id                 | integer     | PRIMARY KEY (SERIAL)               | Unique record identifier                 |
| user_id            | uuid        | NOT NULL, FOREIGN KEY → auth.users | User who owns the streak                 |
| streak_type        | text        | NOT NULL                           | Type of streak (daily_log, etc.)         |
| current_streak     | integer     | DEFAULT 0                          | Current consecutive days                 |
| longest_streak     | integer     | DEFAULT 0                          | Best streak ever achieved                |
| last_activity_date | date        |                                    | Last date the streak was updated         |
| updated_at         | timestamp   | DEFAULT now()                      | Last update timestamp                    |

**Streak Types**:
- `daily_log` - Consecutive days with at least one meal logged
- `nutrient_goal` - Consecutive days meeting nutrient goals
- `green_recipe` - Consecutive days using eco-friendly recipes

**Example Data**:
```sql
id: 1
user_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
streak_type: "daily_log"
current_streak: 35
longest_streak: 42
last_activity_date: "2025-11-28"
updated_at: "2025-11-28T10:30:00Z"

id: 2
user_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
streak_type: "nutrient_goal"
current_streak: 14
longest_streak: 21
last_activity_date: "2025-11-27"
updated_at: "2025-11-27T18:00:00Z"
```

**Constraints**:
- Foreign key to auth.users (ON DELETE CASCADE)
- Unique constraint on (user_id, streak_type) - one streak per type per user

**Indexes**:
- Primary key index on `id`
- Composite unique index on `(user_id, streak_type)`

---

### update_streak() Function

PostgreSQL function for atomic streak updates with automatic logic.

```sql
CREATE OR REPLACE FUNCTION update_streak(
  p_user_id UUID,
  p_streak_type TEXT
) RETURNS TABLE(
  streak_type TEXT,
  current_streak INTEGER,
  longest_streak INTEGER,
  last_activity_date DATE
) AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_record streak_history%ROWTYPE;
BEGIN
  -- Get existing record or create new one
  SELECT * INTO v_record 
  FROM streak_history sh 
  WHERE sh.user_id = p_user_id AND sh.streak_type = p_streak_type;
  
  IF NOT FOUND THEN
    -- Create new streak record
    INSERT INTO streak_history (user_id, streak_type, current_streak, longest_streak, last_activity_date)
    VALUES (p_user_id, p_streak_type, 1, 1, v_today)
    RETURNING * INTO v_record;
  ELSIF v_record.last_activity_date = v_today THEN
    -- Already logged today, no change needed
    NULL;
  ELSIF v_record.last_activity_date = v_today - INTERVAL '1 day' THEN
    -- Consecutive day - increment streak
    UPDATE streak_history sh
    SET current_streak = v_record.current_streak + 1,
        longest_streak = GREATEST(v_record.longest_streak, v_record.current_streak + 1),
        last_activity_date = v_today,
        updated_at = NOW()
    WHERE sh.user_id = p_user_id AND sh.streak_type = p_streak_type
    RETURNING * INTO v_record;
  ELSE
    -- Streak broken - reset to 1
    UPDATE streak_history sh
    SET current_streak = 1,
        last_activity_date = v_today,
        updated_at = NOW()
    WHERE sh.user_id = p_user_id AND sh.streak_type = p_streak_type
    RETURNING * INTO v_record;
  END IF;
  
  RETURN QUERY SELECT v_record.streak_type, v_record.current_streak, 
                      v_record.longest_streak, v_record.last_activity_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Logic**:
1. If no record exists → Create with streak = 1
2. If last_activity_date is today → No change (already logged)
3. If last_activity_date is yesterday → Increment streak
4. If last_activity_date is older → Reset streak to 1

---

## � Smart Cart Tables (v1.3.0)

### shopping_lists Table

Stores user's shopping list metadata for organizing grocery shopping.

**Table Name**: `shopping_lists`

| Column       | Type         | Constraints                        | Description                              |
|--------------|--------------|------------------------------------|-----------------------------------------|
| id           | uuid         | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique list identifier               |
| user_id      | uuid         | NOT NULL, FOREIGN KEY → auth.users | User who owns this list                  |
| name         | varchar(255) | NOT NULL                           | Display name of the shopping list        |
| description  | text         |                                    | Optional description or notes            |
| is_archived  | boolean      | NOT NULL, DEFAULT FALSE            | Soft delete flag                         |
| created_at   | timestamptz  | NOT NULL, DEFAULT NOW()            | Timestamp when list was created          |
| updated_at   | timestamptz  | NOT NULL, DEFAULT NOW()            | Timestamp when list was last modified    |

**Example Data**:
```sql
id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
user_id: "user-uuid-here"
name: "Weekly Groceries"
description: "Regular shopping for the week"
is_archived: false
created_at: "2025-11-29T10:00:00Z"
updated_at: "2025-11-29T10:00:00Z"
```

**Indexes**:
- Primary key index on `id`
- Index on `user_id` for querying user's lists
- Composite index on `(user_id, is_archived)` for filtering active lists
- Index on `updated_at DESC` for sorting by most recent

**Trigger**:
- Auto-update `updated_at` on row modification

---

### shopping_list_items Table

Stores individual items within a shopping list.

**Table Name**: `shopping_list_items`

| Column           | Type           | Constraints                              | Description                          |
|------------------|----------------|------------------------------------------|--------------------------------------|
| id               | uuid           | PRIMARY KEY, DEFAULT gen_random_uuid()   | Unique item identifier               |
| shopping_list_id | uuid           | NOT NULL, FOREIGN KEY → shopping_lists   | Parent shopping list                 |
| ingredient_id    | integer        | FOREIGN KEY → Ingredient (ON DELETE SET NULL) | Optional link to ingredient DB  |
| item_name        | varchar(255)   | NOT NULL                                 | Display name (can be custom text)    |
| quantity         | decimal(10,2)  | DEFAULT 1                                | Amount needed                        |
| unit             | varchar(50)    |                                          | Unit of measurement                  |
| category         | varchar(100)   | DEFAULT 'Other'                          | Category for grouping                |
| is_checked       | boolean        | NOT NULL, DEFAULT FALSE                  | Whether item is purchased            |
| position         | integer        | NOT NULL, DEFAULT 0                      | Order for drag-and-drop sorting      |
| notes            | text           |                                          | Optional notes                       |
| created_at       | timestamptz    | NOT NULL, DEFAULT NOW()                  | Timestamp when item was added        |

**Categories**:
- Produce, Dairy, Meat, Seafood, Bakery, Frozen, Pantry, Beverages, Snacks, Condiments, Other

**Example Data**:
```sql
id: "item-uuid-here"
shopping_list_id: "list-uuid-here"
ingredient_id: 123
item_name: "Milk"
quantity: 2
unit: "liters"
category: "Dairy"
is_checked: false
position: 0
notes: "Prefer organic"
created_at: "2025-11-29T10:05:00Z"
```

**Indexes**:
- Primary key index on `id`
- Index on `shopping_list_id` for querying items by list
- Composite index on `(shopping_list_id, position)` for ordered retrieval
- Composite index on `(shopping_list_id, is_checked)` for filtering
- Composite index on `(shopping_list_id, category)` for grouping
- Index on `ingredient_id` (WHERE NOT NULL) for ingredient lookup

---

### user_inventory Table

Tracks user's available ingredients at home (pantry, fridge, freezer).

**Table Name**: `user_inventory`

| Column          | Type           | Constraints                              | Description                          |
|-----------------|----------------|------------------------------------------|--------------------------------------|
| id              | uuid           | PRIMARY KEY, DEFAULT gen_random_uuid()   | Unique inventory entry identifier    |
| user_id         | uuid           | NOT NULL, FOREIGN KEY → auth.users       | User who owns this inventory         |
| ingredient_id   | integer        | NOT NULL, FOREIGN KEY → Ingredient       | Reference to ingredient database     |
| quantity        | decimal(10,2)  | NOT NULL, DEFAULT 1                      | Current quantity available           |
| unit            | varchar(50)    |                                          | Unit of measurement                  |
| location        | varchar(50)    | NOT NULL, DEFAULT 'pantry', CHECK constraint | Storage location               |
| expiration_date | date           |                                          | Expected expiration date             |
| min_quantity    | decimal(10,2)  |                                          | Threshold for low stock alerts       |
| notes           | text           |                                          | Optional notes                       |
| created_at      | timestamptz    | NOT NULL, DEFAULT NOW()                  | Timestamp when item was added        |
| updated_at      | timestamptz    | NOT NULL, DEFAULT NOW()                  | Timestamp when item was modified     |

**Location Values**:
- `pantry` - Dry storage
- `fridge` - Refrigerator
- `freezer` - Freezer
- `other` - Other storage

**Constraints**:
- UNIQUE constraint on `(user_id, ingredient_id, location)` - one entry per ingredient per location per user
- CHECK constraint on `location IN ('pantry', 'fridge', 'freezer', 'other')`

**Example Data**:
```sql
id: "inventory-uuid-here"
user_id: "user-uuid-here"
ingredient_id: 456
quantity: 500
unit: "g"
location: "fridge"
expiration_date: "2025-12-05"
min_quantity: 100
notes: "Organic chicken breast"
created_at: "2025-11-29T09:00:00Z"
updated_at: "2025-11-29T09:00:00Z"
```

**Indexes**:
- Primary key index on `id`
- Index on `user_id` for querying user's inventory
- Composite index on `(user_id, location)` for filtering by storage location
- Composite index on `(user_id, expiration_date)` for expiring items query
- Index for low stock items (WHERE min_quantity IS NOT NULL AND quantity <= min_quantity)
- Index on `ingredient_id` for recipe matching

**Trigger**:
- Auto-update `updated_at` on row modification

**Helper Views**:
- `expiring_inventory` - Items expiring within 7 days
- `low_stock_inventory` - Items at or below minimum threshold

---

## �🔒 Row Level Security (RLS)

### Enabled Tables

RLS is enabled on user-specific tables:
- `Calendar` - Users can only access their own calendar entries
- `User` - Users can only read their own profile
- `nutrient_tracking` - Users can only access their own nutrient data
- `nutrient_goals` - Users can only access their own goals
- `user_achievements` - Users can only access their own achievements
- `streak_history` - Users can only access their own streaks
- `shopping_lists` - Users can only access their own shopping lists
- `shopping_list_items` - Users can only access items in their own lists
- `user_inventory` - Users can only access their own inventory

### Calendar Table Policies

**SELECT Policy**:
```sql
CREATE POLICY "Users can view own calendar"
ON Calendar
FOR SELECT
USING (auth.uid() = user_id);
```

**INSERT Policy**:
```sql
CREATE POLICY "Users can insert own calendar entries"
ON Calendar
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**UPDATE Policy**:
```sql
CREATE POLICY "Users can update own calendar entries"
ON Calendar
FOR UPDATE
USING (auth.uid() = user_id);
```

**DELETE Policy**:
```sql
CREATE POLICY "Users can delete own calendar entries"
ON Calendar
FOR DELETE
USING (auth.uid() = user_id);
```

### Public Tables (No RLS)

These tables are publicly readable:
- `Recipe`
- `Ingredient`
- `RecipeTag`
- `Recipe-Ingredient_Map`
- `Recipe-Tag_Map`
- `achievement_definitions` (read-only, definitions are public)

### nutrient_tracking Table Policies

**SELECT Policy**:
```sql
CREATE POLICY "Users can view own nutrient tracking"
ON nutrient_tracking
FOR SELECT
USING (auth.uid() = user_id);
```

**INSERT Policy**:
```sql
CREATE POLICY "Users can insert own nutrient tracking"
ON nutrient_tracking
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**UPDATE Policy**:
```sql
CREATE POLICY "Users can update own nutrient tracking"
ON nutrient_tracking
FOR UPDATE
USING (auth.uid() = user_id);
```

### nutrient_goals Table Policies

**SELECT Policy**:
```sql
CREATE POLICY "Users can view own nutrient goals"
ON nutrient_goals
FOR SELECT
USING (auth.uid() = user_id);
```

**UPSERT Policy** (INSERT/UPDATE):
```sql
CREATE POLICY "Users can upsert own nutrient goals"
ON nutrient_goals
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### user_achievements Table Policies

**SELECT Policy**:
```sql
CREATE POLICY "Users can view own achievements"
ON user_achievements
FOR SELECT
USING (auth.uid() = user_id);
```

**INSERT Policy** (via Service Role):
```sql
-- Note: Inserts are done via service-role client to bypass RLS
-- This prevents users from manually awarding themselves achievements
-- The API validates criteria before inserting
CREATE POLICY "Service role can insert achievements"
ON user_achievements
FOR INSERT
WITH CHECK (true);  -- Service role bypasses RLS
```

---

### streak_history Table Policies

**SELECT Policy**:
```sql
CREATE POLICY "Users can view own streaks"
ON streak_history
FOR SELECT
USING (auth.uid() = user_id);
```

**INSERT Policy**:
```sql
CREATE POLICY "Users can insert own streaks"
ON streak_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**UPDATE Policy**:
```sql
CREATE POLICY "Users can update own streaks"
ON streak_history
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

---

### shopping_lists Table Policies

**SELECT Policy**:
```sql
CREATE POLICY "Users can view own shopping lists"
ON shopping_lists
FOR SELECT
USING (auth.uid() = user_id);
```

**INSERT Policy**:
```sql
CREATE POLICY "Users can create own shopping lists"
ON shopping_lists
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**UPDATE Policy**:
```sql
CREATE POLICY "Users can update own shopping lists"
ON shopping_lists
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

**DELETE Policy**:
```sql
CREATE POLICY "Users can delete own shopping lists"
ON shopping_lists
FOR DELETE
USING (auth.uid() = user_id);
```

---

### shopping_list_items Table Policies

**SELECT Policy** (via parent list ownership):
```sql
CREATE POLICY "Users can view items in own shopping lists"
ON shopping_list_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM shopping_lists sl
    WHERE sl.id = shopping_list_items.shopping_list_id
    AND sl.user_id = auth.uid()
  )
);
```

**INSERT Policy**:
```sql
CREATE POLICY "Users can add items to own shopping lists"
ON shopping_list_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM shopping_lists sl
    WHERE sl.id = shopping_list_items.shopping_list_id
    AND sl.user_id = auth.uid()
  )
);
```

**UPDATE Policy**:
```sql
CREATE POLICY "Users can update items in own shopping lists"
ON shopping_list_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM shopping_lists sl
    WHERE sl.id = shopping_list_items.shopping_list_id
    AND sl.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM shopping_lists sl
    WHERE sl.id = shopping_list_items.shopping_list_id
    AND sl.user_id = auth.uid()
  )
);
```

**DELETE Policy**:
```sql
CREATE POLICY "Users can delete items from own shopping lists"
ON shopping_list_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM shopping_lists sl
    WHERE sl.id = shopping_list_items.shopping_list_id
    AND sl.user_id = auth.uid()
  )
);
```

---

### user_inventory Table Policies

**SELECT Policy**:
```sql
CREATE POLICY "Users can view own inventory"
ON user_inventory
FOR SELECT
USING (auth.uid() = user_id);
```

**INSERT Policy**:
```sql
CREATE POLICY "Users can add to own inventory"
ON user_inventory
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**UPDATE Policy**:
```sql
CREATE POLICY "Users can update own inventory"
ON user_inventory
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

**DELETE Policy**:
```sql
CREATE POLICY "Users can delete from own inventory"
ON user_inventory
FOR DELETE
USING (auth.uid() = user_id);
```

---

## 🔍 Common Queries

### Get Recipe with Ingredients

```sql
SELECT 
  r.id,
  r.name,
  r.description,
  r.min_prep_time,
  r.green_score,
  json_agg(
    json_build_object(
      'ingredient_id', i.id,
      'ingredient_name', i.name,
      'unit', i.unit,
      'quantity', rim.relative_unit_100
    )
  ) as ingredients
FROM Recipe r
LEFT JOIN "Recipe-Ingredient_Map" rim ON r.id = rim.recipe_id
LEFT JOIN Ingredient i ON rim.ingredient_id = i.id
WHERE r.id = 52764
GROUP BY r.id;
```

### Get Recipe with Tags

```sql
SELECT 
  r.id,
  r.name,
  array_agg(rt.name) as tags
FROM Recipe r
LEFT JOIN "Recipe-Tag_Map" rtm ON r.id = rtm.recipe_id
LEFT JOIN RecipeTag rt ON rtm.tag_id = rt.id
WHERE r.id = 52764
GROUP BY r.id;
```

### Get User's Calendar with Recipes

```sql
SELECT 
  c.id,
  c.date,
  c.meal_type,
  c.status,
  c.notes,
  r.id as recipe_id,
  r.name as recipe_name,
  r.image_url,
  r.min_prep_time,
  r.green_score
FROM Calendar c
JOIN Recipe r ON c.recipe_id = r.id
WHERE c.user_id = 1
  AND c.date >= '2025-11-01'
  AND c.date <= '2025-11-30'
ORDER BY c.date, c.meal_type;
```

### Search Recipes by Ingredient

```sql
SELECT DISTINCT r.*
FROM Recipe r
JOIN "Recipe-Ingredient_Map" rim ON r.id = rim.recipe_id
JOIN Ingredient i ON rim.ingredient_id = i.id
WHERE i.name ILIKE '%prawn%';
```

### Filter Recipes by Tag

```sql
SELECT DISTINCT r.*
FROM Recipe r
JOIN "Recipe-Tag_Map" rtm ON r.id = rtm.recipe_id
JOIN RecipeTag rt ON rtm.tag_id = rt.id
WHERE rt.name = 'Vegetarian';
```

### Get User's Weekly Nutrient Summary (Phase 2)

```sql
SELECT 
  date,
  calories_kcal,
  protein_g,
  carbs_g,
  fats_g,
  fiber_g,
  sugar_g,
  sodium_mg,
  meal_count
FROM nutrient_tracking
WHERE user_id = 'auth-user-uuid'
  AND date >= '2025-11-22'
  AND date <= '2025-11-28'
ORDER BY date;
```

### Get User's Nutrient Goals with Progress (Phase 2)

```sql
SELECT 
  g.calories_kcal AS goal_calories,
  g.protein_g AS goal_protein,
  g.carbs_g AS goal_carbs,
  g.fats_g AS goal_fats,
  t.calories_kcal AS actual_calories,
  t.protein_g AS actual_protein,
  t.carbs_g AS actual_carbs,
  t.fats_g AS actual_fats,
  ROUND((t.calories_kcal / g.calories_kcal) * 100, 1) AS calories_pct
FROM nutrient_goals g
LEFT JOIN nutrient_tracking t ON g.user_id = t.user_id AND t.date = CURRENT_DATE
WHERE g.user_id = 'auth-user-uuid';
```

### Get User's Achievements with Details (Phase 2)

```sql
SELECT 
  ad.name,
  ad.title,
  ad.description,
  ad.icon,
  ad.tier,
  ua.earned_at,
  ua.progress
FROM user_achievements ua
JOIN achievement_definitions ad ON ua.achievement_id = ad.id
WHERE ua.user_id = 'auth-user-uuid'
ORDER BY ua.earned_at DESC;
```

### Calculate User Stats for Achievement Progress (Phase 2)

```sql
-- Count meals logged
SELECT COUNT(*) AS meals_logged
FROM Calendar
WHERE user_id = 1 AND status = true;

-- Count green recipes (sustainability score >= 7)
SELECT COUNT(DISTINCT c.recipe_id) AS green_recipes
FROM Calendar c
JOIN Recipe r ON c.recipe_id = r.id
WHERE c.user_id = 1 
  AND c.status = true 
  AND r.green_score >= 7;

-- Calculate current streak
SELECT COUNT(DISTINCT date) AS streak_days
FROM Calendar
WHERE user_id = 1 
  AND status = true
  AND date >= (
    SELECT MAX(date) - INTERVAL '30 days' FROM Calendar WHERE user_id = 1
  );
```

### Get User's Shopping List with Items (Phase 3)

```sql
SELECT 
  sl.id,
  sl.name,
  sl.description,
  sl.is_archived,
  sl.created_at,
  json_agg(
    json_build_object(
      'id', sli.id,
      'item_name', sli.item_name,
      'quantity', sli.quantity,
      'unit', sli.unit,
      'category', sli.category,
      'is_checked', sli.is_checked,
      'position', sli.position,
      'ingredient', json_build_object(
        'id', i.id,
        'name', i.name
      )
    ) ORDER BY sli.position
  ) FILTER (WHERE sli.id IS NOT NULL) AS items
FROM shopping_lists sl
LEFT JOIN shopping_list_items sli ON sl.id = sli.shopping_list_id
LEFT JOIN Ingredient i ON sli.ingredient_id = i.id
WHERE sl.user_id = auth.uid()
  AND sl.is_archived = false
GROUP BY sl.id
ORDER BY sl.updated_at DESC;
```

### Generate Shopping List from Calendar Recipes (Phase 3)

```sql
-- Get all ingredients needed for meals in a date range
SELECT 
  i.id AS ingredient_id,
  i.name AS item_name,
  i.aisle AS category,
  SUM(rim.relative_unit_100 * 4) AS total_quantity,  -- scaled for 4 servings
  i.unit
FROM Calendar c
JOIN "Recipe-Ingredient_Map" rim ON c.recipe_id = rim.recipe_id
JOIN Ingredient i ON rim.ingredient_id = i.id
WHERE c.user_id = auth.uid()
  AND c.date >= '2025-12-01'
  AND c.date <= '2025-12-07'
  AND c.status = false  -- Not yet completed
GROUP BY i.id, i.name, i.aisle, i.unit
ORDER BY i.aisle, i.name;
```

### Get User's Inventory with Expiring Items (Phase 3)

```sql
SELECT 
  ui.id,
  ui.quantity,
  ui.unit,
  ui.location,
  ui.expiration_date,
  ui.min_quantity,
  ui.notes,
  i.name AS ingredient_name,
  i.aisle AS category,
  CASE 
    WHEN ui.expiration_date <= CURRENT_DATE THEN 'expired'
    WHEN ui.expiration_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'expiring_soon'
    ELSE 'fresh'
  END AS status
FROM user_inventory ui
JOIN Ingredient i ON ui.ingredient_id = i.id
WHERE ui.user_id = auth.uid()
ORDER BY ui.expiration_date ASC NULLS LAST;
```

### Check Missing Ingredients for Recipe (Phase 3)

```sql
-- Compare recipe ingredients with user's inventory
SELECT 
  i.id,
  i.name,
  rim.relative_unit_100 * 4 AS needed_quantity,
  i.unit,
  COALESCE(ui.quantity, 0) AS in_stock,
  CASE 
    WHEN ui.id IS NULL THEN true
    WHEN ui.quantity < (rim.relative_unit_100 * 4) THEN true
    ELSE false
  END AS needs_to_buy
FROM "Recipe-Ingredient_Map" rim
JOIN Ingredient i ON rim.ingredient_id = i.id
LEFT JOIN user_inventory ui ON ui.ingredient_id = i.id AND ui.user_id = auth.uid()
WHERE rim.recipe_id = 52764
ORDER BY needs_to_buy DESC, i.name;
```

### Get Low Stock Items (Phase 3)

```sql
SELECT 
  ui.id,
  i.name,
  ui.quantity,
  ui.min_quantity,
  ui.unit,
  ui.location
FROM user_inventory ui
JOIN Ingredient i ON ui.ingredient_id = i.id
WHERE ui.user_id = auth.uid()
  AND ui.quantity <= ui.min_quantity
ORDER BY i.name;
```

---

## 📈 Database Statistics

### Current Data Volume (Phase 3)

| Table                    | Estimated Rows | Notes                           |
|--------------------------|----------------|---------------------------------|
| Recipe                   | ~50,000        | Static recipe database          |
| Ingredient               | ~2,000         | Nutritional data per ingredient |
| RecipeTag                | ~50            | Dietary/cuisine tags            |
| Recipe-Ingredient_Map    | ~200,000       | Recipe composition              |
| Recipe-Tag_Map           | ~100,000       | Recipe categorization           |
| User                     | Growing        | Public user profiles            |
| Calendar                 | Growing        | Meal planning entries           |
| nutrient_tracking        | Growing        | Daily per-user (Phase 2)        |
| nutrient_goals           | Growing        | 1 per user (Phase 2)            |
| achievement_definitions  | 8              | Seed data (Phase 2)             |
| user_achievements        | Growing        | Earned badges (Phase 2)         |
| streak_history           | Growing        | Streak tracking (Phase 2)       |
| shopping_lists           | Growing        | Per-user lists (Phase 3)        |
| shopping_list_items      | Growing        | Items per list (Phase 3)        |
| user_inventory           | Growing        | Per-user inventory (Phase 3)    |

### Seed Achievement Data

The system ships with 8 pre-defined achievements:

| Name              | Title           | Tier     | Target                      |
|-------------------|-----------------|----------|-----------------------------|
| first_meal        | First Steps     | bronze   | Log 1 meal                  |
| meal_planner_10   | Meal Planner    | silver   | Log 10 meals                |
| meal_master_50    | Meal Master     | gold     | Log 50 meals                |
| eco_warrior       | Eco Warrior     | gold     | 5 sustainable recipes       |
| streak_7          | Week Warrior    | silver   | 7-day streak                |
| streak_30         | Month Champion  | platinum | 30-day streak               |
| nutrient_tracker  | Nutrient Ninja  | silver   | View dashboard 10 times     |
| balanced_eater    | Balanced Eater  | gold     | 70% nutrient-aware meals    |

---

## 🚀 Performance Optimizations

### Indexes Created

1. **Recipe Table**:
   - Primary key on `id`
   - B-tree index on `name` for text search
   - B-tree index on `green_score` for filtering

2. **Ingredient Table**:
   - Primary key on `id`
   - B-tree index on `name`
   - B-tree index on `calories_kcal`

3. **Calendar Table**:
   - Primary key on `id`
   - B-tree index on `user_id`
   - B-tree index on `date`
   - Composite index on `(user_id, date, meal_type)`

4. **Mapping Tables**:
   - Composite indexes on foreign key pairs
   - Individual indexes on each foreign key

5. **nutrient_tracking Table** (Phase 2):
   - Primary key on `id`
   - B-tree index on `user_id`
   - B-tree index on `date`
   - B-tree index on `month_start` (IMMUTABLE generated column)
   - Unique composite index on `(user_id, date)`

6. **user_achievements Table** (Phase 2):
   - Primary key on `id`
   - B-tree index on `user_id`
   - B-tree index on `achievement_id`
   - Unique composite index on `(user_id, achievement_id)`

7. **shopping_lists Table** (Phase 3):
   - Primary key on `id`
   - B-tree index on `user_id`
   - B-tree index on `is_archived`
   - Composite index on `(user_id, is_archived)` for active lists

8. **shopping_list_items Table** (Phase 3):
   - Primary key on `id`
   - B-tree index on `shopping_list_id`
   - B-tree index on `ingredient_id`
   - B-tree index on `category` for grouping
   - B-tree index on `is_checked` for filtering
   - Composite index on `(shopping_list_id, position)` for ordering

9. **user_inventory Table** (Phase 3):
   - Primary key on `id`
   - B-tree index on `user_id`
   - B-tree index on `ingredient_id`
   - B-tree index on `location` for grouping
   - B-tree index on `expiration_date` for expiring items
   - Unique composite index on `(user_id, ingredient_id, location)`
   - Partial index on expiring items: `WHERE expiration_date IS NOT NULL`

### Query Optimization Tips

1. **Use indexes**: Always filter on indexed columns
2. **Limit results**: Use pagination with `LIMIT` and `OFFSET`
3. **Avoid N+1 queries**: Use JOINs instead of multiple queries
4. **Use materialized views**: For complex aggregations (future)

---

## 🔄 Data Migrations

### Migration Strategy

**Tool**: Supabase Migration System (SQL-based)

**Process**:
1. Create migration SQL file
2. Test in development environment
3. Review with team
4. Apply to production via Supabase dashboard

### Example Migration: Add Column

```sql
-- Migration: 20251117000001_add_serving_size_to_recipe.sql

ALTER TABLE Recipe
ADD COLUMN serving_size integer;

COMMENT ON COLUMN Recipe.serving_size 
IS 'Number of servings this recipe produces';

-- Backfill with default value
UPDATE Recipe
SET serving_size = 2
WHERE serving_size IS NULL;
```

### Example Migration: Create Index

```sql
-- Migration: 20251117000002_add_recipe_name_index.sql

CREATE INDEX idx_recipe_name_trgm 
ON Recipe 
USING gin (name gin_trgm_ops);

-- Enable trigram extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

---

## 🔮 Future Enhancements (Phase 3+)

### ✅ Completed Tables (Phase 2)

1. **nutrient_tracking** ✅
   - Daily aggregated nutrient intake
   - Historical nutrition data with IMMUTABLE indexing
   - Implemented: November 2025

2. **nutrient_goals** ✅
   - User-defined daily nutrient targets
   - 1:1 relationship with auth.users
   - Implemented: November 2025

3. **achievement_definitions** ✅
   - Gamification badge definitions
   - Tier system (bronze/silver/gold/platinum)
   - Implemented: November 2025

4. **user_achievements** ✅
   - Tracks earned achievements per user
   - Auto-award system via API
   - Implemented: November 2025

5. **shopping_lists** ✅ (v1.3.0)
   - User shopping list metadata
   - Supports multiple lists per user
   - Soft delete via is_archived flag
   - Implemented: November 2025

6. **shopping_list_items** ✅ (v1.3.0)
   - Individual items in shopping lists
   - Links to ingredients database
   - Category grouping and position ordering
   - Implemented: November 2025

7. **user_inventory** ✅ (v1.3.0)
   - User's pantry/fridge/freezer items
   - Expiration date tracking
   - Low stock alerts via min_quantity
   - Implemented: November 2025

### Planned Tables (Phase 3)

1. **list_shares** (v1.3.0 - future)
   - Shopping list sharing between users
   - Permission levels (view/edit)
   - Real-time collaboration

2. **Challenge**
   - Weekly/monthly nutrition challenges
   - Challenge participation tracking
   - Leaderboards and rankings

3. **UserPreferences**
   - Dietary restrictions
   - Allergen information
   - Cuisine preferences

### Planned Features

- **Full-text search**: PostgreSQL full-text search on recipe descriptions
- **Materialized views**: Pre-computed aggregations for analytics
- **Partitioning**: Date-based partitioning for Calendar table
- **Replication**: Read replicas for scaling
- **Real-time subscriptions**: Supabase Realtime for live updates

---

## 📚 Related Documentation

| Document                                      | Purpose                        |
|-----------------------------------------------|--------------------------------|
| [02-ARCHITECTURE.md](./02-ARCHITECTURE.md)   | System architecture overview   |
| [03-API-SPECIFICATIONS.md](./03-API-SPECIFICATIONS.md) | API endpoints using this schema |
| [06-BACKEND-PATTERNS.md](./06-BACKEND-PATTERNS.md) | Database access patterns |

---

## 🔄 Document Updates

This document should be updated when:
- ✅ New tables are added
- ✅ Schema changes are made
- ✅ Indexes are modified
- ✅ RLS policies are updated

**Last Review**: November 29, 2025  
**Next Review**: December 15, 2025
