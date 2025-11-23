# Epicourier API Specifications

**Document Version**: 1.0  
**Last Updated**: November 17, 2025  
**Status**: Phase 1 Complete

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

**Last Review**: November 17, 2025  
**Next Review**: December 1, 2025
