# Epicourier System Architecture

**Document Version**: 1.2  
**Last Updated**: November 28, 2025  
**Status**: Phase 2 In Progress (v1.1.0 ✅ | v1.2.0 🚧)

---

## 📋 Document Overview

This document describes the complete system architecture of Epicourier, a full-stack meal planning platform. It covers frontend structure, backend services, database design, AI/ML pipeline, and deployment architecture.

**Purpose**:
- Understand high-level system design and component relationships
- Learn data flow between frontend, backend, and database
- Understand authentication and middleware layers
- Reference AI/ML recommendation pipeline architecture

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Users (Web Browser)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Next.js 15 Frontend (Vercel)                   │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │   Public Pages   │  │  Protected Routes │  │  Middleware   │ │
│  │  /, /signin,     │  │  /dashboard/*     │  │  Auth Check   │ │
│  │  /signup         │  │                   │  │  Session Mgmt │ │
│  └──────────────────┘  └──────────────────┘  └───────────────┘ │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Next.js API Routes (/app/api/*)                  │   │
│  │  /recipes, /calendar, /events, /recommendations          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────┬───────────────────────────────┬───────────────────┘
              │                               │
              │ Supabase Client               │ HTTP (ngrok in dev)
              │                               │
              ▼                               ▼
┌─────────────────────────┐    ┌──────────────────────────────────┐
│   Supabase Platform     │    │   FastAPI Backend (Python 3.11+) │
│                         │    │                                   │
│  ┌──────────────────┐  │    │  ┌────────────────────────────┐  │
│  │  PostgreSQL DB   │  │    │  │  /recommender Endpoint     │  │
│  │  - Recipe        │  │    │  │  - Gemini AI Integration   │  │
│  │  - Ingredient    │  │    │  │  - SentenceTransformers    │  │
│  │  - RecipeTag     │  │    │  │  - KMeans Clustering       │  │
│  │  - Calendar      │  │    │  └────────────────────────────┘  │
│  │  - Events        │  │    │                                   │
│  └──────────────────┘  │    │  ┌────────────────────────────┐  │
│                         │    │  │  Lazy-Loaded Components    │  │
│  ┌──────────────────┐  │    │  │  - Model Cache (LRU)       │  │
│  │  Supabase Auth   │  │    │  │  - CUDA Support            │  │
│  │  - JWT Sessions  │  │    │  │  - Data Preprocessing      │  │
│  │  - Email/Password│  │    │  └────────────────────────────┘  │
│  └──────────────────┘  │    └──────────────────────────────────┘
│                         │                     │
│  ┌──────────────────┐  │                     │
│  │  Row Level       │  │                     │
│  │  Security (RLS)  │  │                     │
│  └──────────────────┘  │                     │
└─────────────────────────┘                     │
                                                │
                                                ▼
                                    ┌───────────────────────┐
                                    │  Google Gemini API    │
                                    │  gemini-2.5-flash     │
                                    │  (Goal Expansion)     │
                                    └───────────────────────┘
```

---

## 🎨 Frontend Architecture (Next.js 15)

### App Router Structure

Epicourier uses **Next.js 15 App Router** with the following directory organization:

```
web/src/app/
├── layout.tsx                # Root layout with fonts
├── page.tsx                  # Landing page (/)
├── signin/                   # Sign-in page
│   └── page.tsx
├── signup/                   # Sign-up page
│   └── page.tsx
├── dashboard/                # Protected area (requires auth)
│   ├── layout.tsx            # Dashboard layout with sidebar
│   ├── recipes/              # Recipe browsing
│   │   ├── page.tsx          # Recipe list with search/filter
│   │   └── [id]/             # Dynamic route for recipe details
│   │       └── page.tsx
│   ├── calendar/             # Meal planning calendar
│   │   └── page.tsx          # FullCalendar integration
│   ├── recommender/          # AI meal recommendations
│   │   └── page.tsx
│   ├── nutrients/            # Nutrient tracking dashboard (Phase 2)
│   │   └── page.tsx          # Charts with Recharts
│   └── achievements/         # Gamification badges (Phase 2)
│       └── page.tsx          # BadgeCard grid display
└── api/                      # Next.js API Routes (Server-side)
    ├── recipes/
    │   └── route.ts          # GET /api/recipes (search, filter)
    ├── ingredients/
    │   └── route.ts          # GET /api/ingredients
    ├── tags/
    │   └── route.ts          # GET /api/tags
    ├── calendar/
    │   └── route.ts          # GET/POST /api/calendar
    ├── events/
    │   └── [id]/
    │       └── route.ts      # PATCH /api/events/[id]
    ├── recommendations/
    │   └── route.ts          # POST /api/recommendations (proxy to FastAPI)
    ├── nutrients/            # Phase 2: Nutrient Tracking
    │   ├── daily/
    │   │   └── route.ts      # GET /api/nutrients/daily
    │   ├── export/
    │   │   └── route.ts      # GET /api/nutrients/export
    │   └── goals/
    │       └── route.ts      # GET/PUT /api/nutrients/goals
    └── achievements/         # Phase 2: Gamification
        ├── route.ts          # GET /api/achievements
        └── check/
            └── route.ts      # POST /api/achievements/check
```

### Component Architecture

```
web/src/components/
├── landing/                  # Landing page components
│   ├── Hero.tsx
│   ├── Features.tsx
│   └── FAQ.tsx
├── sidebar/                  # Dashboard navigation
│   └── AppSidebar.tsx
└── ui/                       # Reusable UI components
    ├── button.tsx            # shadcn/ui button
    ├── card.tsx              # shadcn/ui card
    ├── dialog.tsx            # shadcn/ui dialog
    ├── sheet.tsx             # shadcn/ui sheet (mobile nav)
    ├── sidebar.tsx           # shadcn/ui sidebar
    ├── accordion.tsx         # FAQ accordion
    ├── input.tsx             # Form input
    ├── label.tsx             # Form label
    ├── textarea.tsx          # Multi-line input
    ├── toast.tsx             # Notifications
    ├── toaster.tsx           # Toast container
    ├── skeleton.tsx          # Loading placeholders
    ├── separator.tsx         # Visual divider
    ├── tooltip.tsx           # Hover tooltips
    ├── dropdown-menu.tsx     # Dropdown menus
    ├── date-range-picker.tsx # Date selection
    ├── searchbar.tsx         # Recipe search
    ├── filterpanel.tsx       # Tag filtering
    ├── pagenation.tsx        # Page navigation
    ├── recipecard.tsx        # Recipe display card
    ├── AddMealModal.tsx      # Add meal to calendar
    ├── MealDetailModal.tsx   # View meal details
    └── BadgeCard.tsx         # Phase 2: Achievement badge
```

### Key Libraries

| Library            | Version  | Purpose                                    |
|--------------------|----------|--------------------------------------------|
| Next.js            | 15.5.4   | React framework with App Router            |
| React              | 19.1.0   | UI library                                 |
| TypeScript         | 5.x      | Type safety                                |
| Tailwind CSS       | 4.1.17   | Utility-first styling                      |
| shadcn/ui          | Latest   | Accessible UI components                   |
| FullCalendar       | 6.1.19   | Interactive calendar for meal planning     |
| Recharts           | 3.5.0    | Charts for nutrient visualization (Phase 2)|
| @supabase/ssr      | 0.7.0    | Supabase client for Next.js                |
| lucide-react       | 0.462.0  | Icon library                               |

---

## ⚙️ Backend Architecture (FastAPI)

### Project Structure

```
backend/
├── api/
│   ├── __init__.py
│   ├── index.py              # Main FastAPI app with CORS
│   └── recommender.py        # AI recommendation engine
├── dataset/                  # CSV data for development
│   ├── recipes-supabase.csv
│   ├── ingredients-supabase.csv
│   ├── recipe_ingredient_map-supabase.csv
│   ├── tags-supabase.csv
│   └── recipe_tag_map-supabase.csv
├── tests/
│   ├── conftest.py
│   └── test_recommender.py
├── pyproject.toml            # Python dependencies (uv managed)
├── uv.lock                   # Dependency lock file
├── Dockerfile
├── Makefile
└── vercel.json              # Deployment config
```

### FastAPI Application (`index.py`)

**Key Components**:

1. **CORS Middleware**: Allows frontend to call API
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["*"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

2. **Supabase Integration**:
   ```python
   url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
   key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
   supabase: Client = create_client(url, key)
   ```

3. **Endpoints**:
   - `GET /test` - Test Supabase connection
   - `POST /recommender` - AI meal recommendations

### AI Recommendation Engine (`recommender.py`)

**Architecture Layers**:

| Layer                   | Description                                         |
|-------------------------|-----------------------------------------------------|
| **Global Setup**        | Device detection (CUDA/CPU), env variables          |
| **Lazy Loaders**        | `@lru_cache()` for models, data, API clients        |
| **Utilities**           | Recipe text formatting, embedding generation        |
| **Goal Expansion**      | Gemini API for nutrition goal understanding         |
| **Recommendation**      | Semantic search + KMeans clustering for diversity   |

**Data Flow**:

```
User Goal (Natural Language)
    ↓
[Gemini API] → Expanded Nutrition Goal
    ↓
[SentenceTransformer] → Goal Embedding
    ↓
[Cosine Similarity] → Ranked Recipes (Top-20)
    ↓
[KMeans Clustering] → Diverse Selection (n meals)
    ↓
Final Meal Plan
```

**Key Technologies**:

- **Google Gemini** (`gemini-2.5-flash`): Goal expansion
- **SentenceTransformers** (`all-MiniLM-L6-v2`): Text embeddings
- **PyTorch**: Model inference (with CUDA support)
- **KMeans Clustering**: Recipe diversity
- **Pandas**: Data processing

---

## 🗄️ Database Architecture (Supabase PostgreSQL)

### Tables

| Table                  | Description                                  | Phase |
|------------------------|----------------------------------------------|-------|
| `Recipe`               | Recipe metadata (name, description, etc.)    | 1     |
| `Ingredient`           | Ingredient master list with nutrients        | 1     |
| `RecipeTag`            | Tag categories (vegetarian, gluten-free)     | 1     |
| `Recipe-Ingredient_Map`| Many-to-many: Recipe ↔ Ingredient            | 1     |
| `Recipe-Tag_Map`       | Many-to-many: Recipe ↔ Tag                   | 1     |
| `Calendar`             | User meal plans with date and meal type      | 1     |
| `nutrient_tracking`    | Daily aggregated nutrient data per user      | 2     |
| `nutrient_goals`       | User-defined daily nutrient targets          | 2     |
| `achievement_definitions` | Master list of available achievements     | 2     |
| `user_achievements`    | User earned achievements with progress       | 2     |

### Relationships

```
Recipe ─┬─ Recipe-Ingredient_Map ─ Ingredient
        │
        └─ Recipe-Tag_Map ─ RecipeTag

User (auth.users)
    ├── Calendar (meal planning)
    ├── nutrient_tracking (daily nutrients)
    ├── nutrient_goals (1:1 nutrient targets)
    └── user_achievements ─ achievement_definitions
```

**Reference**: See [04-DATABASE-DESIGN.md](./04-DATABASE-DESIGN.md) for detailed schema.

---

## 🔐 Authentication & Middleware

### Supabase Auth Flow

```
User Sign-Up/Sign-In
    ↓
[Supabase Auth] → JWT Token
    ↓
[Next.js Middleware] → Session Validation
    ↓
Protected Routes Accessible
```

### Middleware (`web/src/middleware.ts`)

**Protected Route Pattern**:
```typescript
export const config = {
  matcher: [
    '/((?!landing|signup|signin|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Session Management**:
- Uses `@supabase/ssr` for server-side session handling
- Automatically refreshes tokens
- Redirects unauthenticated users to `/signin`

### Supabase Clients

**Client-Side** (`lib/supabaseClient.ts`):
```typescript
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

**Server-Side** (`lib/supabaseServer.ts`):
```typescript
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

---

## 🚀 Deployment Architecture

### Frontend Deployment (Vercel)

- **Platform**: Vercel
- **Framework**: Next.js 15 with App Router
- **Build Command**: `npm run build`
- **Output**: Static + Server-Side Rendered pages
- **Environment Variables**:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_BACKEND_URL` (FastAPI endpoint)

### Backend Deployment

**Development**:
- **Tool**: ngrok
- **Command**: `ngrok http 8000`
- **Purpose**: Expose local FastAPI to internet for testing

**Production** (Planned):
- Platform TBD (Railway, Fly.io, or AWS Lambda)
- Docker containerization ready (`backend/Dockerfile`)

### Database (Supabase)

- **Hosted**: Supabase Cloud
- **Type**: PostgreSQL with Row Level Security (RLS)
- **Backups**: Automatic daily backups
- **Scaling**: Managed by Supabase

---

## 📊 Data Flow Diagrams

### Recipe Search Flow

```
User enters search query
    ↓
[Next.js Client] → GET /api/recipes?keyword=...
    ↓
[Next.js API Route] → Supabase Query
    ↓
[Supabase] → Filter recipes by keyword/tags/ingredients
    ↓
[Next.js API] → JSON response
    ↓
[Frontend] → Display RecipeCard components
```

### AI Recommendation Flow

```
User enters dietary goal
    ↓
[Next.js Client] → POST /api/recommendations
    ↓
[Next.js API Route] → POST /recommender (FastAPI)
    ↓
[FastAPI] → Gemini API (goal expansion)
    ↓
[FastAPI] → SentenceTransformer embeddings
    ↓
[FastAPI] → Cosine similarity ranking
    ↓
[FastAPI] → KMeans clustering (diversity)
    ↓
[FastAPI] → Return meal plan JSON
    ↓
[Next.js API] → Forward to client
    ↓
[Frontend] → Display recommended meals
```

### Meal Planning Flow

```
User selects recipe + date + meal type
    ↓
[Next.js Client] → POST /api/calendar
    ↓
[Next.js API Route] → Supabase Insert
    ↓
[Supabase] → Calendar table
    ↓
[FullCalendar] → Re-fetch and display updated calendar
```

### Nutrient Tracking Flow (Phase 2)

```
User views Nutrients Dashboard
    ↓
[Next.js Client] → GET /api/nutrients/daily?period=day
    ↓
[Next.js API Route] → Supabase Query
    ↓
[Supabase] → Join Calendar + Recipe-Ingredient_Map + Ingredient
    ↓
[API Route] → Aggregate nutrients, upsert to nutrient_tracking
    ↓
[Frontend] → Display Recharts visualizations
```

### Achievement Check Flow (Phase 2)

```
User logs a meal / views dashboard
    ↓
[Next.js Client] → POST /api/achievements/check
    ↓
[Next.js API Route] → Query user stats from Calendar
    ↓
[API Route] → Compare against achievement_definitions criteria
    ↓
[API Route] → Insert earned achievements (via service-role)
    ↓
[Frontend] → Display newly earned badges (toast notification)
```

---

## 🧩 Component Interaction Matrix

| Component        | Interacts With                     | Protocol/Method         |
|------------------|------------------------------------|-------------------------|
| Next.js Frontend | Supabase Auth                      | Supabase Client SDK     |
| Next.js Frontend | Supabase Database                  | Supabase Client SDK     |
| Next.js Frontend | FastAPI Backend                    | HTTP REST API           |
| Next.js API      | Supabase Database                  | Supabase Server SDK     |
| Next.js API      | Supabase (Service Role)            | supabaseServer.ts (Phase 2) |
| FastAPI Backend  | Supabase Database                  | Supabase Python Client  |
| FastAPI Backend  | Google Gemini API                  | HTTP REST API           |
| FastAPI Backend  | SentenceTransformers (Local Model) | PyTorch                 |
| Middleware       | Supabase Auth                      | Session Validation      |

---

## 🔧 Development Environment

### Local Development Setup

**Frontend**:
```bash
cd web
npm install
npm run dev        # http://localhost:3000
```

**Backend**:
```bash
cd backend
uv sync                              # Install dependencies
uv run uvicorn api.index:app --reload  # http://localhost:8000
```

**Database**:
- Supabase project on cloud
- Connection via environment variables

### Environment Variables

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

**Backend** (`.env`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
GEMINI_KEY=AIzxxx...
```

---

## 🎯 Performance Optimizations

### Frontend

1. **Server Components**: Default to Server Components, use Client Components only when needed
2. **Image Optimization**: Next.js `<Image>` component with automatic optimization
3. **Code Splitting**: Automatic route-based code splitting
4. **Static Generation**: Pre-render pages where possible

### Backend

1. **Lazy Loading**: Models and data loaded once with `@lru_cache()`
2. **CUDA Support**: Automatic GPU detection for faster inference
3. **Batch Processing**: Recipe embeddings computed once and cached
4. **Connection Pooling**: Supabase client reuse

### Database

1. **Indexes**: Optimized queries with proper indexing
2. **RLS Policies**: Row-level security for data isolation
3. **Query Optimization**: Efficient joins for recipe data

---

## 🔮 Future Architecture Enhancements

### Phase 2 Implemented (v1.1.0 - v1.2.0)

1. **Nutrient Tracking**: Daily/weekly/monthly nutrient aggregation with Recharts visualization
2. **Achievement System**: Gamification with badges, tiers, and progress tracking
3. **Service Role Client**: `supabaseServer.ts` for bypassing RLS in trusted operations
4. **Export Feature**: CSV and text export of nutrient data

### Phase 2 Remaining (v1.2.0 Extension)

1. **Streak Tracking**: Consecutive day tracking for achievement system
2. **Challenge System**: Time-limited achievement challenges
3. **Notification System**: Achievement unlock notifications
4. **Social Sharing**: Share achievement badges

### Phase 3 Planned (v1.3.0 Smart Cart)

1. **Shopping Lists**: Generate shopping lists from meal plans
2. **Inventory Management**: Track pantry items
3. **Smart Suggestions**: Suggest meals based on inventory

---

## 📚 Related Documentation

| Document                                      | Purpose                        |
|-----------------------------------------------|--------------------------------|
| [01-TECH-STACK.md](./01-TECH-STACK.md)       | Technology details and versions|
| [03-API-SPECIFICATIONS.md](./03-API-SPECIFICATIONS.md) | API endpoint documentation |
| [04-DATABASE-DESIGN.md](./04-DATABASE-DESIGN.md) | Database schema and migrations |
| [05-FRONTEND-PATTERNS.md](./05-FRONTEND-PATTERNS.md) | Frontend coding patterns    |
| [06-BACKEND-PATTERNS.md](./06-BACKEND-PATTERNS.md) | Backend coding patterns      |
| [Software Overview](../Epicourier-Web.wiki/Software-Overview.md) | High-level system overview |

---

## 🔄 Document Updates

This document should be updated when:
- ✅ New services or components are added
- ✅ Architecture patterns change
- ✅ Deployment infrastructure updates
- ✅ Major technology stack changes

**Last Review**: November 28, 2025  
**Next Review**: December 15, 2025

