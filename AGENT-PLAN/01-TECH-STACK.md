# Epicourier Tech Stack

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
  "tailwindcss": "Latest",
  "class-variance-authority": "0.7.1",
  "lucide-react": "0.462.0"
}
```

### Key Features

- **App Router**: Modern Next.js file-based routing
- **Server Components**: React Server Components for performance
- **Middleware**: Auth protection and session management
- **UI Components**: shadcn/ui + Radix UI primitives
- **Calendar**: FullCalendar for meal planning
- **Markdown**: react-markdown for recipe rendering

---

## ⚙️ Backend (API Service)

**Framework**: FastAPI  
**Language**: Python 3.11+  
**AI/ML**: Google Gemini + sentence-transformers  
**Testing**: Pytest  
**Deployment**: Vercel Serverless / ngrok (dev)

### Core Dependencies

```python
# backend/requirements.txt
fastapi
uvicorn
python-dotenv
supabase
google-generativeai  # Gemini API
sentence-transformers  # Embeddings
torch  # ML inference
pandas  # Data processing
scikit-learn  # KMeans clustering
pydantic  # Data validation
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
Ingredient (id, name)
RecipeTag (id, name)

-- Relationships
Recipe-Ingredient_Map (recipe_id, ingredient_id)
Recipe-Tag_Map (recipe_id, tag_id)

-- User data
Calendar (user events, meal planning)
Users (Supabase managed)
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
│   │   │   │   ├── calendar/      # Calendar events
│   │   │   │   ├── recommendations/  # AI recommendations
│   │   │   │   ├── ingredients/   # Ingredient search
│   │   │   │   └── tags/          # Tag filtering
│   │   │   ├── dashboard/         # Protected routes
│   │   │   │   ├── recipes/       # Recipe management
│   │   │   │   ├── calendar/      # Meal planning
│   │   │   │   └── recommender/   # AI recommender
│   │   │   ├── signin/            # Auth pages
│   │   │   ├── signup/
│   │   │   ├── layout.tsx         # Root layout
│   │   │   └── page.tsx           # Landing page
│   │   ├── components/
│   │   │   ├── landing/           # Landing page components
│   │   │   ├── sidebar/           # Dashboard sidebar
│   │   │   └── ui/                # Reusable UI components
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── lib/                   # Supabase clients & utils
│   │   ├── types/                 # TypeScript types
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
│   └── requirements.txt
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
pip install -r requirements.txt     # Install dependencies
pip freeze > requirements.txt       # Update requirements
```

---

**Need examples?** Check existing code:

- **Frontend**: `web/src/app/dashboard/recipes/page.tsx`
- **Backend**: `backend/api/recommender.py`
- **API Routes**: `web/src/app/api/recipes/route.ts`
- **Components**: `web/src/components/ui/`
- **Tests**: `web/__tests__/jsdom/*.test.tsx`
