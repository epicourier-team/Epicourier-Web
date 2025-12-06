# Epicourier API Specifications

**Document Version**: 1.4  
**Last Updated**: November 29, 2025  
**Status**: Phase 2 In Progress (v1.1.0 ✅ | v1.2.0 ✅ | v1.3.0 📝)

---

## 📋 Document Overview

This document provides complete API specifications for both **Next.js API Routes** (frontend) and **FastAPI Backend** endpoints in the Epicourier meal planning platform.

**Purpose**:
- Reference all available API endpoints
- Understand request/response formats
- Learn authentication requirements
- Reference error handling patterns

---

## 🌐 Base URLs

### Development

| Service    | URL                      | Purpose                   |
|------------|--------------------------|---------------------------|
| Frontend   | `http://localhost:3000`  | Next.js development server|
| API Routes | `http://localhost:3000/api` | Next.js API endpoints  |
| Backend    | `http://localhost:8000`  | FastAPI server            |
| Backend (Public) | `https://xxx.ngrok.io` | ngrok tunnel (testing)  |

### Production

| Service    | URL                          | Purpose                    |
|------------|------------------------------|----------------------------|
| Frontend   | `https://epicourier.vercel.app` | Vercel deployment       |
| API Routes | `https://epicourier.vercel.app/api` | Next.js API routes |
| Backend    | TBD                          | FastAPI production server  |

---

## �� Authentication

All protected API routes use **Supabase Auth** with JWT tokens.

### Authentication Flow

```
1. User signs in → Supabase Auth returns JWT
2. JWT stored in HTTP-only cookie
3. Middleware validates session on protected routes
4. API routes use createClient() from @/utils/supabase/server
```

### Protected Routes

Routes under `/dashboard/*` require authentication. Unauthenticated users are redirected to `/signin`.

---

## 📡 Next.js API Routes

### Recipe Endpoints

#### `GET /api/recipes`

Get list of recipes with optional filtering.

**Query Parameters**:
```typescript
{
  query?: string           // Search in name/description
  ingredientIds?: number[] // Filter by ingredient IDs
  tagIds?: number[]        // Filter by tag IDs
  page?: number            // Page number (default: 1)
  limit?: number           // Items per page (default: 20)
}
```

**Response** (200 OK):
```json
{
  "recipes": [
    {
      "id": 1,
      "name": "Avocado Toast",
      "description": "Healthy breakfast...",
      "image_url": "https://...",
      "min_prep_time": 10,
      "green_score": 8.5,
      "calories_kcal": 250
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Errors**:
- `500` - Database error

**Example**:
```bash
GET /api/recipes?query=avocado&page=1&limit=10
GET /api/recipes?ingredientIds=5&ingredientIds=12
GET /api/recipes?tagIds=3
```

---

#### `GET /api/recipes/[id]`

Get detailed information about a specific recipe.

**Path Parameters**:
- `id` (number) - Recipe ID

**Response** (200 OK):
```json
{
  "id": 1,
  "name": "Avocado Toast",
  "description": "Healthy breakfast with whole grain bread...",
  "image_url": "https://...",
  "min_prep_time": 10,
  "green_score": 8.5,
  "calories_kcal": 250,
  "protein_g": 8,
  "carbs_g": 30,
  "fats_g": 12
}
```

**Errors**:
- `404` - Recipe not found
- `500` - Database error

---

### Ingredient Endpoints

#### `GET /api/ingredients`

Get list of ingredients with search functionality.

**Query Parameters**:
```typescript
{
  query?: string   // Search by name
  page?: number    // Page number (default: 1)
  limit?: number   // Items per page (default: 20)
}
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "name": "Avocado",
      "unit": "whole"
    },
    {
      "id": 2,
      "name": "Whole Wheat Bread",
      "unit": "slice"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 500,
    "totalPages": 25
  }
}
```

---

### Tag Endpoints

#### `GET /api/tags`

Get list of recipe tags (vegetarian, vegan, gluten-free, etc.).

**Query Parameters**:
```typescript
{
  query?: string   // Search by tag name
  page?: number    // Page number (default: 1)
  limit?: number   // Items per page (default: 20)
}
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "name": "Vegetarian",
      "description": "No meat or fish"
    },
    {
      "id": 2,
      "name": "Vegan",
      "description": "No animal products"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

---

### Calendar Endpoints

#### `GET /api/calendar`

Get user's meal calendar within a date range.

**Authentication**: Required

**Query Parameters**:
```typescript
{
  user_id: number     // User ID (required)
  start?: string      // Start date YYYY-MM-DD
  end?: string        // End date YYYY-MM-DD
}
```

**Response** (200 OK):
```json
[
  {
    "id": 123,
    "user_id": 1,
    "recipe_id": 5,
    "date": "2025-11-20",
    "meal_type": "breakfast",
    "status": false,
    "notes": "Try with almond milk",
    "Recipe": {
      "id": 5,
      "name": "Oatmeal Bowl",
      "image_url": "https://...",
      "min_prep_time": 5,
      "green_score": 9.0
    }
  }
]
```

**Errors**:
- `400` - Missing user_id
- `401` - Unauthorized
- `500` - Database error

---

#### `POST /api/calendar`

Add a recipe to user's meal calendar.

**Authentication**: Required

**Request Body**:
```json
{
  "user_id": 1,
  "recipe_id": 5,
  "date": "2025-11-20",
  "meal_type": "breakfast",
  "notes": "Optional notes"
}
```

**Response** (200 OK):
```json
{
  "id": 123,
  "user_id": 1,
  "recipe_id": 5,
  "date": "2025-11-20",
  "meal_type": "breakfast",
  "status": false,
  "notes": "Optional notes",
  "Recipe": {
    "id": 5,
    "name": "Oatmeal Bowl",
    "image_url": "https://...",
    "min_prep_time": 5,
    "green_score": 9.0
  }
}
```

**Errors**:
- `400` - Missing required fields
- `401` - Unauthorized
- `500` - Database error

---

### Event Endpoints

#### `PATCH /api/events/[id]`

Update meal completion status.

**Authentication**: Required

**Path Parameters**:
- `id` (number) - Calendar entry ID

**Request Body**:
```json
{
  "status": true
}
```

**Response** (200 OK):
```json
[
  {
    "id": 123,
    "user_id": 1,
    "recipe_id": 5,
    "date": "2025-11-20",
    "meal_type": "breakfast",
    "status": true,
    "notes": "Completed"
  }
]
```

**Errors**:
- `400` - Invalid status field
- `401` - Unauthorized
- `404` - Entry not found or user unauthorized
- `500` - Database error

---

### Recommendation Endpoints

#### `GET /api/recommendations`

Get sample recipe recommendations (temporary, will be replaced by AI endpoint).

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "name": "Avocado Toast",
    "description": "Healthy breakfast...",
    "image_url": "https://...",
    "green_score": 8.5,
    "min_prep_time": 10
  },
  {
    "id": 2,
    "name": "Quinoa Salad",
    "description": "Protein-rich lunch...",
    "image_url": "https://...",
    "green_score": 9.2,
    "min_prep_time": 15
  }
]
```

---

## 📊 Nutrient Tracking Endpoints (Phase 2)

### Daily Nutrient Summary

#### `GET /api/nutrients/daily`

Get aggregated nutrient data for a specified time period. Calculates nutrients from user's Calendar meal logs.

**Authentication**: Required

**Query Parameters**:
```typescript
{
  period?: "day" | "week" | "month"  // Default: "day"
  date?: string                       // Target date YYYY-MM-DD (default: today)
}
```

**Response** (200 OK):
```json
{
  "daily": {
    "date": "2025-11-28",
    "calories_kcal": 1850.5,
    "protein_g": 95.2,
    "carbs_g": 210.8,
    "fats_g": 68.3,
    "fiber_g": 28.5,
    "sugar_g": 45.2,
    "sodium_mg": 2100.0,
    "meal_count": 3,
    "user_id": "1"
  },
  "weekly": [],
  "monthly": []
}
```

**Response for period=week** (200 OK):
```json
{
  "daily": null,
  "weekly": [
    {
      "week_start": "2025-11-22",
      "week_end": "2025-11-28",
      "calories_kcal": 12500,
      "protein_g": 650,
      "carbs_g": 1450,
      "fats_g": 480,
      "fiber_g": 175,
      "sugar_g": 320,
      "sodium_mg": 15000,
      "days_tracked": 7
    }
  ],
  "monthly": []
}
```

**Response for period=month** (200 OK):
```json
{
  "daily": null,
  "weekly": [],
  "monthly": [
    {
      "month": "2025-11",
      "calories_kcal": 55000,
      "protein_g": 2800,
      "carbs_g": 6200,
      "fats_g": 2100,
      "fiber_g": 750,
      "sugar_g": 1400,
      "sodium_mg": 65000,
      "days_tracked": 30
    }
  ]
}
```

**Errors**:
- `400` - Invalid date format or period parameter
- `401` - Unauthorized
- `500` - Database error

**Example**:
```bash
GET /api/nutrients/daily?period=week&date=2025-11-28
GET /api/nutrients/daily?period=month
GET /api/nutrients/daily  # Today's nutrients
```

---

### Nutrient Data Export

#### `GET /api/nutrients/export`

Export nutrient data in CSV or text report format.

**Authentication**: Required

**Query Parameters**:
```typescript
{
  startDate: string    // Start date YYYY-MM-DD (required)
  endDate: string      // End date YYYY-MM-DD (required)
  format?: "csv" | "text"  // Export format (default: "csv")
}
```

**Response** (200 OK) - CSV Format:
```
Content-Type: text/csv
Content-Disposition: attachment; filename="nutrients_2025-11-22_2025-11-28.csv"

Date,Calories (kcal),Protein (g),Carbs (g),Fats (g),Fiber (g),Sugar (g),Sodium (mg),Meal Count
2025-11-22,1850.50,95.20,210.80,68.30,28.50,45.20,2100.00,3
2025-11-23,1720.00,88.50,195.40,62.10,25.00,42.80,1980.00,3
...
```

**Response** (200 OK) - Text Format:
```
Content-Type: text/plain
Content-Disposition: attachment; filename="nutrients_2025-11-22_2025-11-28.txt"

Epicourier Nutrition Report
===========================
Period: 2025-11-22 to 2025-11-28
Generated: 2025-11-28T10:30:00Z

Daily Summary
-------------
Nov 22, 2025:
  Calories: 1850.50 kcal | Protein: 95.20g | Carbs: 210.80g | Fats: 68.30g
  Meals logged: 3

Nov 23, 2025:
  Calories: 1720.00 kcal | Protein: 88.50g | Carbs: 195.40g | Fats: 62.10g
  Meals logged: 3
...

Weekly Totals
-------------
Total Calories: 12,500 kcal
Average Daily Calories: 1,785.71 kcal
Total Meals: 21
```

**Errors**:
- `400` - Missing or invalid date parameters
- `401` - Unauthorized
- `500` - Database error

---

### Nutrient Goals

#### `GET /api/nutrients/goals`

Get user's daily nutrient intake goals.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "goal": {
    "user_id": "uuid-string",
    "calories_kcal": 2200,
    "protein_g": 120,
    "carbs_g": 200,
    "fats_g": 70,
    "fiber_g": 30,
    "sodium_mg": 2000,
    "created_at": "2025-11-20T10:00:00Z",
    "updated_at": "2025-11-25T15:30:00Z"
  }
}
```

**Response** (200 OK) - No goals set:
```json
{
  "goal": null
}
```

**Errors**:
- `401` - Unauthorized
- `500` - Database error

---

#### `PUT /api/nutrients/goals`

Create or update user's daily nutrient goals. Uses upsert logic - creates if not exists, updates if exists.

**Authentication**: Required

**Request Body**:
```json
{
  "calories_kcal": 2200,
  "protein_g": 120,
  "carbs_g": 200,
  "fats_g": 70,
  "fiber_g": 30,
  "sodium_mg": 2000
}
```

**Note**: At least one goal field must be provided. Partial updates are supported - only provided fields will be updated.

**Response** (200 OK):
```json
{
  "goal": {
    "user_id": "uuid-string",
    "calories_kcal": 2200,
    "protein_g": 120,
    "carbs_g": 200,
    "fats_g": 70,
    "fiber_g": 30,
    "sodium_mg": 2000,
    "created_at": "2025-11-20T10:00:00Z",
    "updated_at": "2025-11-28T18:45:00Z"
  }
}
```

**Errors**:
- `400` - Invalid payload or missing required fields
- `401` - Unauthorized
- `500` - Database error

---

## 🏆 Achievement Endpoints (Phase 2)

### Get User Achievements

#### `GET /api/achievements`

Get all achievements for the current user, including earned and available achievements with progress.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "earned": [
    {
      "id": 1,
      "user_id": "uuid-string",
      "achievement_id": 1,
      "earned_at": "2025-11-25T10:30:00Z",
      "progress": {
        "final_value": 1,
        "trigger": "meal_logged"
      },
      "achievement": {
        "id": 1,
        "name": "first_meal",
        "title": "First Steps",
        "description": "Log your first meal",
        "icon": "Utensils",
        "tier": "bronze",
        "criteria": {
          "type": "count",
          "metric": "meals_logged",
          "target": 1
        }
      }
    }
  ],
  "available": [
    {
      "id": 2,
      "name": "meal_planner_10",
      "title": "Meal Planner",
      "description": "Log 10 meals",
      "icon": "Calendar",
      "tier": "silver",
      "criteria": {
        "type": "count",
        "metric": "meals_logged",
        "target": 10
      }
    }
  ],
  "progress": {
    "meal_planner_10": {
      "current": 5,
      "target": 10,
      "percentage": 50
    },
    "streak_7": {
      "current": 3,
      "target": 7,
      "percentage": 42.86
    }
  }
}
```

**Note**: This endpoint automatically awards achievements if criteria are met during the request (auto-check feature).

**Errors**:
- `401` - Unauthorized
- `500` - Database error

---

### Check & Award Achievements

#### `POST /api/achievements/check`

Manually trigger achievement check and award new achievements based on current progress.

**Authentication**: Required

**Request Body**:
```json
{
  "trigger": "meal_logged" | "nutrient_viewed" | "manual"
}
```

**Response** (200 OK):
```json
{
  "newly_earned": [
    {
      "id": 2,
      "name": "meal_planner_10",
      "title": "Meal Planner",
      "description": "Log 10 meals",
      "icon": "Calendar",
      "tier": "silver",
      "criteria": {
        "type": "count",
        "metric": "meals_logged",
        "target": 10
      }
    }
  ],
  "message": "Congratulations! You earned 1 new achievement(s)!"
}
```

**Response** (200 OK) - No new achievements:
```json
{
  "newly_earned": [],
  "message": "No new achievements earned."
}
```

**When to Call**:
- After user logs a meal → `trigger: "meal_logged"`
- When user views nutrient dashboard → `trigger: "nutrient_viewed"`
- Manual refresh → `trigger: "manual"`

**Errors**:
- `400` - Missing trigger field or invalid JSON
- `401` - Unauthorized
- `500` - Database error

---

## 🔥 Streak Endpoints (Phase 2)

### Get User Streaks

#### `GET /api/streaks`

Get all streak data for the current user, including current streak, longest streak, and activity status.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "streaks": [
    {
      "id": 1,
      "user_id": "uuid-string",
      "streak_type": "daily_log",
      "current_streak": 35,
      "longest_streak": 42,
      "last_activity_date": "2025-11-28",
      "updated_at": "2025-11-28T10:30:00Z",
      "label": "Daily Logging",
      "isActiveToday": true
    },
    {
      "id": 2,
      "user_id": "uuid-string",
      "streak_type": "nutrient_goal",
      "current_streak": 14,
      "longest_streak": 21,
      "last_activity_date": "2025-11-27",
      "updated_at": "2025-11-27T18:00:00Z",
      "label": "Nutrient Goals",
      "isActiveToday": false
    },
    {
      "id": 3,
      "user_id": "uuid-string",
      "streak_type": "green_recipe",
      "current_streak": 7,
      "longest_streak": 10,
      "last_activity_date": "2025-11-28",
      "updated_at": "2025-11-28T12:00:00Z",
      "label": "Green Recipes",
      "isActiveToday": true
    }
  ]
}
```

**Streak Types**:
- `daily_log` - Consecutive days with at least one meal logged
- `nutrient_goal` - Consecutive days meeting nutrient goals
- `green_recipe` - Consecutive days using green (eco-friendly) recipes

**Errors**:
- `401` - Unauthorized
- `500` - Database error

---

### Update Streak Progress

#### `POST /api/streaks/update`

Update a specific streak type for the current user. Uses atomic database function to handle streak logic.

**Authentication**: Required

**Request Body**:
```json
{
  "streak_type": "daily_log"
}
```

**Valid streak_type values**:
- `daily_log`
- `nutrient_goal`
- `green_recipe`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Streak updated successfully",
  "streak": {
    "streak_type": "daily_log",
    "current_streak": 36,
    "longest_streak": 42,
    "last_activity_date": "2025-11-28"
  }
}
```

**Streak Update Logic** (handled by `update_streak()` database function):
1. If `last_activity_date` is today → No change (already logged today)
2. If `last_activity_date` is yesterday → Increment `current_streak`
3. If `last_activity_date` is older → Reset `current_streak` to 1
4. Update `longest_streak` if `current_streak` exceeds it

**When to Call**:
- After user logs a meal → `streak_type: "daily_log"`
- When user meets daily nutrient goals → `streak_type: "nutrient_goal"`
- When user logs a green recipe → `streak_type: "green_recipe"`

**Errors**:
- `400` - Invalid streak_type or missing field
- `401` - Unauthorized
- `500` - Database error

---

## 🏆 Challenge Endpoints (Phase 2)

### List All Challenges

#### `GET /api/challenges`

Get all active challenges with user participation status. Challenges are categorized as active (available to join), joined (in progress), or completed.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "active": [
    {
      "id": 1,
      "name": "7-Day Green Recipe Challenge",
      "description": "Log 7 meals with green recipes this week",
      "type": "weekly",
      "start_date": "2025-11-25",
      "end_date": "2025-12-01",
      "target_count": 7,
      "target_metric": "green_recipes",
      "is_active": true,
      "reward_achievement_id": 5,
      "is_joined": false,
      "progress": {
        "current": 0,
        "target": 7,
        "percentage": 0
      },
      "days_remaining": 3
    }
  ],
  "joined": [
    {
      "id": 2,
      "name": "Monthly Logging Challenge",
      "description": "Log at least one meal every day for 30 days",
      "type": "monthly",
      "start_date": "2025-11-01",
      "end_date": "2025-11-30",
      "target_count": 30,
      "target_metric": "daily_logs",
      "is_active": true,
      "reward_achievement_id": 8,
      "is_joined": true,
      "progress": {
        "current": 25,
        "target": 30,
        "percentage": 83.3
      },
      "days_remaining": 2,
      "reward_achievement": {
        "id": 8,
        "name": "Monthly Warrior",
        "description": "Completed the monthly logging challenge",
        "category": "challenges",
        "tier": "gold",
        "icon_name": "trophy",
        "points": 500
      }
    }
  ],
  "completed": [
    {
      "id": 3,
      "name": "First Week Challenge",
      "description": "Log 5 meals in your first week",
      "type": "weekly",
      "is_active": true,
      "is_joined": true,
      "progress": {
        "current": 5,
        "target": 5,
        "percentage": 100
      },
      "days_remaining": 0,
      "completed_at": "2025-11-15T10:30:00Z"
    }
  ]
}
```

**Challenge Types**:
- `weekly` - Weekly challenges (7-day duration)
- `monthly` - Monthly challenges (30-day duration)
- `special` - Limited-time or event challenges

**Target Metrics**:
- `daily_logs` - Number of days with at least one meal logged
- `green_recipes` - Number of meals with green tag recipes
- `total_meals` - Total number of meals logged
- `nutrient_goals` - Days meeting nutrient targets

**Errors**:
- `401` - Unauthorized
- `500` - Database error

---

### Get Challenge Detail

#### `GET /api/challenges/[id]`

Get detailed information about a specific challenge including user progress.

**Authentication**: Required

**URL Parameters**:
- `id` (number, required) - Challenge ID

**Response** (200 OK):
```json
{
  "id": 2,
  "name": "Monthly Logging Challenge",
  "description": "Log at least one meal every day for 30 days",
  "type": "monthly",
  "start_date": "2025-11-01",
  "end_date": "2025-11-30",
  "target_count": 30,
  "target_metric": "daily_logs",
  "is_active": true,
  "reward_achievement_id": 8,
  "is_joined": true,
  "progress": {
    "current": 25,
    "target": 30,
    "percentage": 83.3
  },
  "days_remaining": 2,
  "reward_achievement": {
    "id": 8,
    "name": "Monthly Warrior",
    "description": "Completed the monthly logging challenge",
    "category": "challenges",
    "tier": "gold",
    "icon_name": "trophy",
    "points": 500
  }
}
```

**Errors**:
- `400` - Invalid challenge ID format
- `401` - Unauthorized
- `404` - Challenge not found
- `500` - Database error

---

### Join a Challenge

#### `POST /api/challenges/join`

Join a challenge. Creates a participation record for the user.

**Authentication**: Required

**Request Body**:
```json
{
  "challenge_id": 2
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Successfully joined the challenge",
  "user_challenge": {
    "id": 123,
    "user_id": "uuid-string",
    "challenge_id": 2,
    "joined_at": "2025-11-28T15:00:00Z",
    "progress": null,
    "completed_at": null
  }
}
```

**Errors**:
- `400` - Invalid or missing challenge_id
- `401` - Unauthorized
- `404` - Challenge not found or not active
- `409` - User already joined this challenge
- `500` - Database error

---

## 🔔 Notification Endpoints (Phase 2)

### Get VAPID Public Key

#### `GET /api/notifications/vapid-key`

Get the VAPID public key for push notification subscription.

**Authentication**: Not required

**Response** (200 OK):
```json
{
  "publicKey": "BLxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

**Errors**:
- `500` - VAPID key not configured

---

### Subscribe to Push Notifications

#### `POST /api/notifications/subscribe`

Subscribe user's device to push notifications.

**Authentication**: Required

**Request Body**:
```json
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/xxx...",
    "keys": {
      "p256dh": "BNxxxxx...",
      "auth": "xxxxx..."
    }
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Push subscription saved"
}
```

**Errors**:
- `400` - Invalid subscription data
- `401` - Unauthorized
- `500` - Database error

---

## 🤖 FastAPI Backend Endpoints

Base URL: `http://localhost:8000` (dev) or deployed URL (prod)

### Test Endpoint

#### `GET /test`

Test Supabase connection and backend health.

**Response** (200 OK):
```json
{
  "message": [
    {
      "id": 1,
      "name": "Recipe 1",
      "description": "..."
    }
  ]
}
```

---

### AI Recommendation Endpoint

#### `POST /recommender`

Generate AI-powered meal recommendations based on dietary goals.

**Request Body**:
```json
{
  "goal": "I want to lose weight while maintaining muscle mass",
  "numMeals": 3
}
```

**Field Validation**:
- `goal` (string, required): Cannot be empty
- `numMeals` (integer, required): Must be 3, 5, or 7

**Response** (200 OK):
```json
{
  "recipes": [
    {
      "meal_number": 1,
      "name": "Grilled Chicken Salad",
      "tags": ["High Protein", "Low Carb"],
      "key_ingredients": ["chicken breast", "mixed greens", "olive oil"],
      "reason": "High protein content (35g) with low calories (280 kcal) supports muscle maintenance during weight loss",
      "similarity_score": 0.87,
      "recipe": "Grilled Chicken Salad. Description: ... Ingredients: ... Tags: ..."
    },
    {
      "meal_number": 2,
      "name": "Quinoa Buddha Bowl",
      "tags": ["High Fiber", "Balanced"],
      "key_ingredients": ["quinoa", "chickpeas", "avocado"],
      "reason": "Balanced macros with high fiber (12g) keeps you full longer",
      "similarity_score": 0.82,
      "recipe": "Quinoa Buddha Bowl. Description: ..."
    },
    {
      "meal_number": 3,
      "name": "Baked Salmon with Vegetables",
      "tags": ["Omega-3", "Low Carb"],
      "key_ingredients": ["salmon", "broccoli", "asparagus"],
      "reason": "Rich in omega-3 fatty acids and complete protein (40g)",
      "similarity_score": 0.79,
      "recipe": "Baked Salmon with Vegetables. Description: ..."
    }
  ],
  "goal_expanded": "Nutrition Target: calories_kcal: 1800, protein_g: 130, carbs_g: 150, fats_g: 60, fiber_g: 30. Goal focuses on caloric deficit while maintaining high protein for muscle preservation."
}
```

**Errors**:
- `400` - Invalid request body
  ```json
  {
    "detail": "Goal cannot be empty"
  }
  ```
- `400` - Invalid numMeals value
  ```json
  {
    "detail": "numMeals must be one of 3, 5, or 7"
  }
  ```
- `500` - AI/ML processing error

**AI Pipeline**:
1. User goal → Gemini API (nutrition goal expansion)
2. Expanded goal → SentenceTransformer embeddings
3. Recipe database → Pre-computed embeddings
4. Cosine similarity → Rank top 20 recipes
5. KMeans clustering → Select diverse meals
6. Return formatted meal plan with reasons

---

## 🔄 Common Response Patterns

### Success Responses

All successful responses return appropriate HTTP status codes:
- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully

### Error Responses

Error responses follow this structure:

```json
{
  "error": "Error message description"
}
```

**Common HTTP Status Codes**:
- `400 Bad Request` - Invalid input or missing required fields
- `401 Unauthorized` - Authentication required or failed
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server-side error

---

## 📊 Data Models

### Recipe Model

```typescript
interface Recipe {
  id: number;
  name: string;
  description: string;
  image_url: string | null;
  min_prep_time: number;        // minutes
  green_score: number;          // 0-10
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
}
```

### Calendar Entry Model

```typescript
interface CalendarEntry {
  id: number;
  user_id: number;
  recipe_id: number;
  date: string;               // YYYY-MM-DD
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  status: boolean;            // completed or not
  notes: string | null;
  Recipe?: Recipe;            // Joined recipe data
}
```

### Ingredient Model

```typescript
interface Ingredient {
  id: number;
  name: string;
  unit: string;               // "g", "ml", "whole", etc.
}
```

### Tag Model

```typescript
interface RecipeTag {
  id: number;
  name: string;
  description: string | null;
}
```

### Nutrient Data Model (Phase 2)

```typescript
interface NutrientData {
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
}

interface DailyNutrient extends NutrientData {
  date: string;           // YYYY-MM-DD format
  meal_count: number;
  user_id: string;
}

interface WeeklyNutrient extends NutrientData {
  week_start: string;     // YYYY-MM-DD format
  week_end: string;       // YYYY-MM-DD format
  days_tracked: number;
}

interface MonthlyNutrient extends NutrientData {
  month: string;          // YYYY-MM format (e.g., "2025-11")
  days_tracked: number;
}

interface NutrientSummaryResponse {
  daily: DailyNutrient | null;
  weekly: WeeklyNutrient[];
  monthly: MonthlyNutrient[];
}
```

### Nutrient Goals Model (Phase 2)

```typescript
interface NutrientGoals {
  user_id: string;
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  fiber_g: number;
  sodium_mg: number;
  created_at: string;
  updated_at: string;
}
```

### Achievement Models (Phase 2)

```typescript
type BadgeTier = "bronze" | "silver" | "gold" | "platinum";

interface AchievementCriteria {
  type: "count" | "streak" | "threshold";
  metric: "meals_logged" | "green_recipes" | "days_tracked" | 
          "current_streak" | "dashboard_views" | "nutrient_aware_meals";
  target: number;
}

interface Achievement {
  id: number;
  name: string;               // Internal identifier (e.g., "first_meal")
  title: string;              // Display title (e.g., "First Steps")
  description: string | null;
  icon: string;               // Lucide icon name (e.g., "Utensils")
  tier: BadgeTier;
  criteria: AchievementCriteria;
}

interface UserAchievement {
  id: number;
  user_id: string;
  achievement_id: number;
  earned_at: string;
  progress: {
    final_value: number;
    trigger: string;
    source?: string;
  };
  achievement?: Achievement;  // Joined achievement definition
}

interface AchievementProgress {
  current: number;
  target: number;
  percentage: number;
  last_updated: string;  // ISO timestamp
}

interface AchievementsResponse {
  earned: UserAchievement[];
  available: Achievement[];
  progress: Record<string, AchievementProgress>;
}

interface AchievementCheckRequest {
  trigger: "meal_logged" | "nutrient_viewed" | "manual";
}

interface AchievementCheckResponse {
  newly_earned: Achievement[];
  message: string;
}
```

---

## 🛡️ Rate Limiting

**Current Status**: Not implemented

**Planned**:
- API Routes: 100 requests/minute per user
- FastAPI: 200 requests/minute per IP
- Recommendation endpoint: 10 requests/minute per user (AI processing heavy)

---

## 🔍 Example Use Cases

### Use Case 1: Browse Recipes by Ingredient

```typescript
// User searches for recipes with "avocado"
const response = await fetch('/api/recipes?query=avocado&page=1&limit=20');
const { recipes, pagination } = await response.json();

console.log(`Found ${pagination.total} recipes`);
console.log(recipes);
```

### Use Case 2: Get Personalized Meal Plan

```typescript
// User wants AI recommendations
const response = await fetch(`${BACKEND_URL}/recommender`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    goal: 'I want high protein meals for muscle building',
    numMeals: 5
  })
});

const { recipes, goal_expanded } = await response.json();
console.log('AI Expanded Goal:', goal_expanded);
console.log('Recommended Meals:', recipes);
```

### Use Case 3: Add Meal to Calendar

```typescript
// User adds breakfast for tomorrow
const response = await fetch('/api/calendar', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 1,
    recipe_id: 5,
    date: '2025-11-21',
    meal_type: 'breakfast',
    notes: 'Prepare ingredients tonight'
  })
});

const calendarEntry = await response.json();
console.log('Meal added:', calendarEntry);
```

### Use Case 4: Mark Meal as Completed

```typescript
// User marks breakfast as eaten
const entryId = 123;
const response = await fetch(`/api/events/${entryId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: true })
});

const updated = await response.json();
console.log('Meal completed:', updated);
```

### Use Case 5: Get Weekly Nutrient Summary (Phase 2)

```typescript
// User views their weekly nutrient summary
const response = await fetch('/api/nutrients/daily?period=week&date=2025-11-28');
const { summary, dailyBreakdown } = await response.json();

console.log('Weekly totals:', summary);
console.log('Daily breakdown:', dailyBreakdown);

// Calculate average daily intake
const avgCalories = summary.calories_kcal / dailyBreakdown.length;
console.log('Average daily calories:', avgCalories);
```

### Use Case 6: Set Nutrient Goals (Phase 2)

```typescript
// User sets their daily nutrient goals
const response = await fetch('/api/nutrients/goals', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    calories_kcal: 2200,
    protein_g: 120,
    carbs_g: 200,
    fats_g: 70
  })
});

const { goal } = await response.json();
console.log('Goals updated:', goal);
```

### Use Case 7: Export Nutrient Data (Phase 2)

```typescript
// User exports nutrient data as CSV
const startDate = '2025-11-01';
const endDate = '2025-11-30';
const response = await fetch(
  `/api/nutrients/export?startDate=${startDate}&endDate=${endDate}&format=csv`
);

// Download the CSV file
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `nutrients_${startDate}_${endDate}.csv`;
a.click();
```

### Use Case 8: Check Achievements After Logging Meal (Phase 2)

```typescript
// After user logs a meal, check for new achievements
const checkResponse = await fetch('/api/achievements/check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ trigger: 'meal_logged' })
});

const { newly_earned, message } = await checkResponse.json();

if (newly_earned.length > 0) {
  // Show achievement unlocked notification
  newly_earned.forEach(achievement => {
    showNotification({
      title: '🏆 Achievement Unlocked!',
      body: `${achievement.title}: ${achievement.description}`,
      icon: achievement.icon
    });
  });
}
```

### Use Case 9: Display Achievement Progress (Phase 2)

```typescript
// Get all achievements with progress
const response = await fetch('/api/achievements');
const { earned, available, progress } = await response.json();

console.log('Earned badges:', earned.length);
console.log('Available badges:', available.length);

// Display progress bars for available achievements
available.forEach(achievement => {
  const progressData = progress[achievement.name];
  if (progressData) {
    console.log(`${achievement.title}: ${progressData.current}/${progressData.target} (${progressData.percentage}%)`);
  }
});
```

---

## 📚 Related Documentation

| Document                                      | Purpose                        |
|-----------------------------------------------|--------------------------------|
| [02-ARCHITECTURE.md](./02-ARCHITECTURE.md)   | System architecture overview   |
| [04-DATABASE-DESIGN.md](./04-DATABASE-DESIGN.md) | Database schema              |
| [06-BACKEND-PATTERNS.md](./06-BACKEND-PATTERNS.md) | FastAPI implementation patterns |
| [AI Recommender Structure](../Epicourier-Web.wiki/AI-Recommender-Structure.md) | AI pipeline details |

---

## 🔄 Document Updates

This document should be updated when:
- ✅ New API endpoints are added
- ✅ Request/response formats change
- ✅ Authentication methods are modified
- ✅ Error handling patterns are updated

**Last Review**: November 29, 2025  
**Next Review**: December 15, 2025
