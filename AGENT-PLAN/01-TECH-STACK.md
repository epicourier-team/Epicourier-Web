# Epicourier Tech Stack

**Document Version**: 1.2  
**Last Updated**: November 28, 2025  
**Status**: Phase 2 In Progress

## 🌐 Frontend (Web App)

**Framework**: Next.js 15 with App Router  
**Language**: TypeScript  
**Styling**: Tailwind CSS + shadcn/ui components  
**Testing**: Jest + React Testing Library  
**Deployment**: Vercel

### Core Dependencies

```json
{
  "next": "15.5.4",
  "react": "19.1.0",
  "react-dom": "19.1.0",
  "@supabase/supabase-js": "^2.78.0",
  "@supabase/ssr": "^0.7.0",
  "@fullcalendar/react": "^6.1.19",
  "@radix-ui/react-*": "UI component primitives",
  "recharts": "^3.5.0",
  "tailwindcss": "^4.1.17",
  "class-variance-authority": "^0.7.1",
  "lucide-react": "^0.462.0"
}
```

### Key Features

- **App Router**: Modern Next.js file-based routing
- **Server Components**: React Server Components for performance
- **Middleware**: Auth protection and session management
- **UI Components**: shadcn/ui + Radix UI primitives
- **Calendar**: FullCalendar for meal planning
- **Charts**: Recharts for nutrient visualization (Phase 2)
- **Markdown**: react-markdown for recipe rendering

---

## ⚙️ Backend (API Service)

**Framework**: FastAPI  
**Language**: Python 3.11+  
**AI/ML**: Google Gemini + sentence-transformers  
**Testing**: Pytest  
**Deployment**: Vercel Serverless / ngrok (dev)

### Core Dependencies

```toml
# backend/pyproject.toml (managed by uv)
[project]
dependencies = [
    "fastapi>=0.121.2",
    "uvicorn>=0.38.0",
    "python-dotenv>=1.2.1",
    "supabase>=2.24.0",
    "google-genai>=1.47.0",
    "sentence-transformers>=5.1.2",
    "torch>=2.8.0",
    "pandas>=2.3.3",
    "scikit-learn>=1.6.1",
    "pydantic>=2.12.4",
    "transformers>=4.57.1",
]
```

### Key Features

- **AI Recommendation**: Gemini for goal expansion + semantic search
- **Lazy Loading**: `@lru_cache` for model/data initialization
- **GPU Support**: Automatic CUDA detection
- **CORS**: Frontend integration support
- **Pydantic**: Request/response validation

---

## 🗄️ Database & Auth

**Database**: Supabase (PostgreSQL)  
**Authentication**: Supabase Auth (JWT-based)  
**Storage**: Cloud storage for recipe images

### Database Tables

```sql
-- Core entities
Recipe (id, name, description, min_prep_time, green_score, image_url)
Ingredient (id, name, nutritional fields...)
RecipeTag (id, name)

-- Relationships
Recipe-Ingredient_Map (recipe_id, ingredient_id, relative_unit_100)
Recipe-Tag_Map (recipe_id, tag_id)

-- User data
User (public user profile)
Calendar (meal planning entries)

-- Phase 2: Nutrient Tracking
nutrient_tracking (user_id, date, calories_kcal, protein_g, carbs_g, fats_g, ...)
nutrient_goals (user_id, daily nutrient targets)

-- Phase 2: Gamification
achievement_definitions (name, title, description, icon, tier, criteria)
user_achievements (user_id, achievement_id, earned_at, progress)
```

---

## 📂 Project Structure

```
Epicourier-Web/
├── web/                    # Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/               # Next.js API routes
│   │   │   │   ├── recipes/       # Recipe CRUD
│   │   │   │   ├── calendar/      # Calendar events (via events/)
│   │   │   │   ├── events/        # Event CRUD
│   │   │   │   ├── recommendations/ # Proxy to Python backend
│   │   │   │   ├── recommender/   # Alternative recommender route
│   │   │   │   ├── ingredients/   # Ingredient search
│   │   │   │   ├── tags/          # Tag filtering
│   │   │   │   ├── users/         # User profile
│   │   │   │   ├── nutrients/     # Nutrient tracking (Phase 2)
│   │   │   │   │   ├── daily/     # Daily/weekly/monthly aggregation
│   │   │   │   │   ├── export/    # CSV/text export
│   │   │   │   │   └── goals/     # User nutrient goals
│   │   │   │   └── achievements/  # Gamification (Phase 2)
│   │   │   │       ├── route.ts   # GET all achievements
│   │   │   │       └── check/     # POST achievement check
│   │   │   ├── dashboard/         # Protected routes
│   │   │   │   ├── recipes/       # Recipe management
│   │   │   │   ├── calendar/      # Meal planning
│   │   │   │   ├── recommender/   # AI recommender
│   │   │   │   ├── nutrients/     # Nutrient dashboard (Phase 2)
│   │   │   │   └── achievements/  # Achievement badges (Phase 2)
│   │   │   ├── signin/            # Auth pages
│   │   │   ├── signup/
│   │   │   ├── layout.tsx         # Root layout
│   │   │   └── page.tsx           # Landing page
│   │   ├── components/
│   │   │   ├── landing/           # Landing page components
│   │   │   ├── sidebar/           # Dashboard sidebar
│   │   │   └── ui/                # Reusable UI components (incl. BadgeCard)
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── lib/                   # Supabase clients & utils
│   │   │   ├── supabaseServer.ts  # Service-role client (Phase 2)
│   │   │   └── auth.ts            # Auth helpers
│   │   ├── types/                 # TypeScript types
│   │   │   ├── data.ts            # All data types incl. Phase 2
│   │   │   └── supabase.ts        # Generated Supabase types
│   │   ├── utils/                 # Helper functions
│   │   └── styles/                # Global CSS
│   ├── __tests__/                 # Jest tests
│   │   ├── jsdom/                 # Component tests
│   │   └── node/                  # Node.js tests
│   └── middleware.ts              # Auth middleware
│
├── backend/                # FastAPI Backend
│   ├── api/
│   │   ├── index.py               # Main FastAPI app
│   │   └── recommender.py         # AI recommendation engine
│   ├── dataset/                   # CSV data for Supabase
│   │   ├── recipes-supabase.csv
│   │   ├── ingredients-supabase.csv
│   │   └── tags-supabase.csv
│   ├── tests/
│   │   ├── conftest.py
│   │   └── test_recommender.py
│   ├── Dockerfile
│   ├── Makefile
│   ├── pyproject.toml             # Dependencies (uv managed)
│   └── uv.lock                    # Lock file
│
├── data/                   # Data Pipeline (separate from backend)
│   ├── llama_recipe_pipeline.py  # LLM-based data generation
│   ├── cache_to_csv.py            # Data export utilities
│   └── prompts/                   # LLM prompts
│
├── AGENT-PLAN/             # This documentation
└── Epicourier-Web.wiki/    # GitHub Wiki documentation
```

---

## 🔧 Development Tools

### Code Quality

- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **Ruff**: Python linting and formatting
- **TypeScript**: Type checking

### Testing

- **Jest**: Frontend unit/integration tests
- **React Testing Library**: Component testing
- **Pytest**: Backend testing
- **Codecov**: Code coverage tracking

### CI/CD

- **GitHub Actions**: Automated testing
- **Vercel**: Frontend deployment
- **ngrok**: Local backend tunneling

---

## 🌐 External Services

| Service           | Purpose                          | Docs Link                                       |
| ----------------- | -------------------------------- | ----------------------------------------------- |
| Supabase          | Database + Auth                  | https://supabase.com/docs                       |
| Google Gemini     | AI goal expansion                | https://ai.google.dev/docs                      |
| HuggingFace       | Sentence embedding models        | https://huggingface.co/sentence-transformers    |
| Vercel            | Frontend hosting                 | https://vercel.com/docs                         |
| ngrok             | Backend tunneling (development)  | https://ngrok.com/docs                          |

---

## 📦 Package Management

### Frontend

```bash
npm install          # Install dependencies
npm update           # Update packages
npm audit fix        # Security fixes
```

### Backend

```bash
uv sync                  # Install dependencies from pyproject.toml
uv add <package>         # Add new dependency
uv run <command>         # Run command in venv
uv run uvicorn api.index:app --reload  # Start dev server
```

---

**Need examples?** Check existing code:

- **Frontend**: `web/src/app/dashboard/recipes/page.tsx`
- **Backend**: `backend/api/recommender.py`
- **API Routes**: `web/src/app/api/recipes/route.ts`
- **Components**: `web/src/components/ui/`
- **Tests**: `web/__tests__/jsdom/*.test.tsx`
