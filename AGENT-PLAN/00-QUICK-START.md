# Epicourier Agent Quick Start

## 🚀 For New Agent Sessions

```
Read: /AGENT-PLAN/00-QUICK-START.md
Task: [TASK-ID from 08-SPRINT-TASKS.md]
Context: I need to implement [brief description]
```

## 📁 Essential Documents

| Purpose         | Document                                                                                                   | When to Read  |
| --------------- | ---------------------------------------------------------------------------------------------------------- | ------------- |
| Find your task  | [08-SPRINT-TASKS.md](./08-SPRINT-TASKS.md)                                                                 | First         |
| Understand tech | [01-TECH-STACK.md](./01-TECH-STACK.md)                                                                     | Before coding |
| API standards   | [03-API-SPECIFICATIONS.md](./03-API-SPECIFICATIONS.md)                                                     | Backend tasks |
| Database schema | [04-DATABASE-DESIGN.md](./04-DATABASE-DESIGN.md)                                                           | Data tasks    |
| Code patterns   | [05-FRONTEND-PATTERNS.md](./05-FRONTEND-PATTERNS.md) or [06-BACKEND-PATTERNS.md](./06-BACKEND-PATTERNS.md) | Always        |

## ⚡ Quick Commands

### Frontend (Next.js)

```bash
cd web
npm install              # Install dependencies
npm run dev              # Start development server (http://localhost:3000)
npm run build            # Build for production
npm test                 # Run all tests
npm run lint             # Run ESLint
```

### Backend (FastAPI)

```bash
cd backend
uv sync                          # Install dependencies
make dev                         # Start development server (http://localhost:8000)
# OR
uv run uvicorn api.index:app --reload --host 0.0.0.0 --port 8000
uv run pytest                    # Run tests
```

### Database (Supabase Local)

```bash
npx supabase@beta start          # Start local Supabase
npx supabase@beta stop           # Stop local Supabase
npx supabase@beta db reset       # Reset DB & apply seeds
npx supabase@beta status         # Check service status
```

### Using ngrok for Backend Exposure

```bash
# Terminal 1: Start backend
cd backend && make dev

# Terminal 2: Expose with ngrok
ngrok http 8000

# Update web/.env with ngrok URL
BACKEND_URL=https://your-ngrok-url.ngrok-free.app
```

## 🎯 Current Project Status

**Phase**: Phase 2 In Progress - Advanced Features  
**Current Version**: v1.2.0 (Gamification Core Complete)  
**Deployment**: Vercel (Frontend) + ngrok/Render (Backend)

### ✅ Completed Features

- ✅ User Authentication (Supabase Auth)
- ✅ Recipe Management Dashboard
- ✅ Meal Calendar with Planning
- ✅ AI Meal Recommender (Gemini + SentenceTransformers)
- ✅ Recipe Search & Filtering
- ✅ Green Score Sustainability Metrics

### 🚀 Next Phase Priorities

See [Roadmap](../Epicourier-Web.wiki/Roadmap.md) for upcoming features:

- Monthly Nutrient Summary
- Gamified Challenges
- Smart Cart Integration

---

**Next Step**: Go to [08-SPRINT-TASKS.md](./08-SPRINT-TASKS.md) to find your task or [Roadmap](../Epicourier-Web.wiki/Roadmap.md) for feature planning.
