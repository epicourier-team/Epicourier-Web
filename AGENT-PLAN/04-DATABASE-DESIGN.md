# Epicourier Database Design

**Document Version**: 1.0  
**Last Updated**: November 17, 2025  
**Status**: Phase 1 Complete

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
       ▼
┌─────────────┐         ┌──────────────────┐
│  Calendar   │────────▶│  Recipe          │
│             │  N:1    │                  │
└─────────────┘         └────────┬─────────┘
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

## 🔒 Row Level Security (RLS)

### Enabled Tables

RLS is enabled on user-specific tables:
- `Calendar` - Users can only access their own calendar entries
- `User` - Users can only read their own profile

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

---

## 📈 Database Statistics

### Current Data Volume (Phase 1)

| Table                  | Estimated Rows |
|------------------------|----------------|
| Recipe                 | ~50,000        |
| Ingredient             | ~2,000         |
| RecipeTag              | ~50            |
| Recipe-Ingredient_Map  | ~200,000       |
| Recipe-Tag_Map         | ~100,000       |
| User                   | Growing        |
| Calendar               | Growing        |

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

## 🔮 Future Enhancements (Phase 2)

### Planned Tables

1. **NutrientTracking**
   - Track daily nutrient intake
   - Historical nutrition data

2. **Achievement**
   - Gamification badges
   - User achievements

3. **Challenge**
   - Weekly/monthly challenges
   - Challenge participation tracking

4. **ShoppingList**
   - Generated from meal plans
   - Inventory tracking

5. **Inventory**
   - User's pantry items
   - Expiration date tracking

### Planned Features

- **Full-text search**: PostgreSQL full-text search on recipe descriptions
- **Materialized views**: Pre-computed aggregations for analytics
- **Partitioning**: Date-based partitioning for Calendar table
- **Replication**: Read replicas for scaling

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

**Last Review**: November 17, 2025  
**Next Review**: December 1, 2025
