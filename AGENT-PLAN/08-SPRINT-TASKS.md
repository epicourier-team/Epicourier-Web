# Epicourier Sprint Tasks & Milestones

**Document Version**: 2.0  
**Last Updated**: November 30, 2025  
**Current Phase**: Phase 2 In Progress (v1.1.0 ✅ | v1.2.0 ✅ | v1.3.0 🚧)

---

## 📋 Document Overview

This document tracks development milestones, tasks, and roadmap for the Epicourier meal planning platform. It organizes work by feature areas and links to GitHub issues for collaboration.

**Purpose**:

- Track implementation progress and completion status
- Define upcoming features and milestones
- Coordinate multi-developer collaboration
- Link to GitHub issues for task management

---

## 🎯 Current Focus - Phase 2 Issue Tracking

### 📊 Phase 2 Status Overview

**Active Phase**: Phase 2 - Advanced Features (v1.1.0 - v1.3.0)  
**Phase 2 Scope**: Nutrient Tracking → Gamification → Smart Cart

| Version | Feature Area      | Status                | Progress |
|---------|-------------------|----------------------|----------|
| v1.1.0  | Nutrient Tracking | ✅ Complete          | 10/10    |
| v1.2.0  | Gamification      | ✅ Complete          | 15/15 (core + extended + testing) |
| v1.3.0  | Smart Cart        | 🚧 In Progress       | 19/30 (E1 ✅, E2 ✅, E3-E5 �) |

**Overall Phase 2 Progress**: ~87% (v1.1.0 + v1.2.0 complete, v1.3.0 63% complete)

---

### 📋 v1.1.0: Nutrient Summary System

**Milestone**: `v1.1.0-nutrient-tracking`  
**Status**: ✅ Complete  
**Release Date**: November 28, 2025

**Summary**: Full nutrient tracking system with dashboard, charts, data export, and goal setting.

| Issue | Title                                                              | Type       | Priority | Assignee     | Status      |
| ----- | ------------------------------------------------------------------ | ---------- | -------- | ------------ | ----------- |
| #16   | feat(frontend): Create nutrient dashboard page                     | Frontend   | P1       | -            | ✅ Complete |
| #15   | feat(backend): Nutrient Aggregation API                            | Backend    | P1       | -            | ✅ Complete |
| #14   | chore(database): Add nutrient_tracking table migration             | Database   | P1       | -            | ✅ Complete |
| #23   | fix(database): IMMUTABLE index function error for month aggregates | Database   | P1       | Yang Zhan    | ✅ Complete |
| #13   | chore(types): Add TypeScript types for nutrient tracking           | Frontend   | P2       | -            | ✅ Complete |
| #17   | test(frontend): Add unit tests for nutrient dashboard page         | Testing    | P2       | Zhendong Liu | ✅ Complete |
| #25   | feat(frontend): Nutrient charts & date-range picker                | Frontend   | P1       | -            | ✅ Complete |
| #26   | feat(backend): Historical nutrient summary endpoints               | Backend    | P1       | -            | ✅ Complete |
| #27   | feat(full-stack): Nutrition data export (CSV/PDF)                  | Full-Stack | P2       | -            | ✅ Complete |
| #28   | feat(database): User nutrient goal preferences                     | Database   | P2       | -            | ✅ Complete |

**Delivered**:

- ✅ `nutrient_tracking` table with IMMUTABLE month_start index
- ✅ `nutrient_goals` table for user-defined daily targets
- ✅ `/api/nutrients/daily` - Aggregated nutrient data (day/week/month)
- ✅ `/api/nutrients/export` - CSV and text report exports
- ✅ `/api/nutrients/goals` - GET/PUT nutrient goals
- ✅ `/dashboard/nutrients` - Interactive dashboard with Recharts
- ✅ Date-range picker component for flexible viewing
- ✅ Jest tests for nutrient dashboard components

---

### 📋 v1.2.0: Gamified Challenges

**Milestone**: `v1.2.0-gamification`  
**Status**: ✅ Complete  
**Release Date**: November 28, 2025

**Summary**: Achievement/badge system, challenge system, and streak tracking with animated UI.

#### ✅ Completed Issues (Core Achievement System)

| Issue | Title                                                         | Type     | Priority | Status                        |
| ----- | ------------------------------------------------------------- | -------- | -------- | ----------------------------- |
| #32   | feat(database): Achievement system database schema            | Database | P1       | ✅ Complete (PR #37)          |
| #33   | chore(types): Add TypeScript types for gamification system    | Frontend | P2       | ✅ Complete (PR #38)          |
| #34   | feat(api): Achievement checking and awarding endpoint         | Backend  | P2       | ✅ Closed (superseded by #35) |
| #35   | feat(api): Achievement checking and awarding endpoint         | Backend  | P1       | ✅ Complete (PR #39)          |
| #36   | feat(frontend): Badge display component and achievements page | Frontend | P1       | ✅ Complete (PR #40)          |
| #41   | fix(achievements): DB error, missing auto-unlock, icon issues | Bug      | P1       | ✅ Complete (PR #42)          |

#### ✅ Completed Issues (Challenge System - Epic #66)

| Issue | Title                                                     | Type       | Priority | Status               |
| ----- | --------------------------------------------------------- | ---------- | -------- | -------------------- |
| #65   | feat(database): Challenge system schema                   | Database   | P1       | ✅ Complete (PR #69) |
| #66   | feat(api): Challenge CRUD and progress tracking API       | Backend    | P1       | ✅ Complete (PR #69) |
| #68   | feat(frontend): Challenge participation UI                | Frontend   | P1       | ✅ Complete (PR #69) |

#### ✅ Completed Issues (Streak System - Epic #67)

| Issue | Title                                                     | Type       | Priority | Status               |
| ----- | --------------------------------------------------------- | ---------- | -------- | -------------------- |
| #61   | feat(database): Streak tracking schema                    | Database   | P2       | ✅ Complete (PR #70) |
| #60   | feat(full-stack): Streak tracking dashboard widget        | Full-Stack | P2       | ✅ Complete (PR #70) |

**Core Deliverables** (Shipped):

- ✅ `achievement_definitions` table with 8 seed achievements
- ✅ `user_achievements` table with progress tracking
- ✅ `/api/achievements` - GET all achievements with progress
- ✅ `/api/achievements/check` - POST to trigger achievement check
- ✅ Auto-unlock logic when criteria are met (service-role client)
- ✅ `BadgeCard` component with tier-based styling
- ✅ `/dashboard/achievements` - Tabbed interface (Earned/Available/All)
- ✅ Lucide icon map with next/image fallback
- ✅ Jest tests for achievements API

**Challenge System Deliverables** (PR #69):

- ✅ `challenges` table with 6 seed challenges (weekly/monthly/special)
- ✅ `user_challenges` table with progress tracking
- ✅ `/api/challenges` - GET available challenges
- ✅ `/api/challenges/[id]/join` - POST to join a challenge
- ✅ `/api/challenges/[id]/progress` - PUT to update progress
- ✅ `ChallengeCard` component with progress bar
- ✅ `/dashboard/challenges` - Challenge listing and participation UI
- ✅ Jest tests for challenges API

**Streak System Deliverables** (PR #70):

- ✅ `streak_history` table with RLS policies
- ✅ `update_streak()` PostgreSQL function for atomic updates
- ✅ `/api/streaks` - GET user streak data
- ✅ `/api/streaks/update` - POST to update streak progress
- ✅ `StreakWidget` component with 3-level flame animations
- ✅ Visual intensity scaling based on streak length
- ✅ "At Risk!" warning when streak may break
- ✅ `/dashboard` home page integrating all gamification widgets
- ✅ Home link added to sidebar navigation
- ✅ 50 unit tests (92.98% coverage)

#### ✅ Completed Issues (Testing & Quality)

| Issue | Title                                                     | Type       | Priority | Status               |
| ----- | --------------------------------------------------------- | ---------- | -------- | -------------------- |
| #64   | test: Gamification integration tests                      | Testing    | P2       | ✅ Complete (PR #74) |

**Integration Testing Deliverables** (PR #74):

- ✅ `notificationsApi.test.ts` - 22 tests for push notification APIs
- ✅ `gamificationIntegration.test.ts` - 27 tests for cross-feature integration
- ✅ `challengesApi.test.ts` - 37 tests for challenges API
- ✅ Enhanced `PushNotifications.test.tsx` - 76% coverage
- ✅ 240+ total tests passing across gamification features
- ✅ 80%+ overall statement coverage for gamification modules

#### ⚠️ v1.2.0 Deferred Features (Moved to Future Versions)

The following features were originally planned for v1.2.0 but deferred due to priority adjustments or complexity:

| Feature | Original Description | Status | Deferral Reason | Target Version |
|---------|---------------------|--------|-----------------|----------------|
| **Rewards System** | Unlock features through achievements | ❌ Not Implemented | High complexity, requires incentive mechanism design | v2.0.0 |
| **Leaderboard** | Community rankings (optional) | ❌ Not Implemented | Requires social feature infrastructure | v3.1.0 |
| **Achievement Toast** | Notify on unlocks (frontend) | 🟡 API Ready, Frontend Not Implemented | Prioritized core functionality | v1.3.0 or v2.0.0 |
| **Push Notification Trigger** | Auto-send push on achievement unlock | 🟡 API Ready, Trigger Logic Not Implemented | Requires Service Worker completion | v2.0.0 |

**Notes**:
- `🟡` indicates backend API is ready (`/api/notifications/*`), but frontend integration or trigger logic is incomplete
- Rewards and Leaderboard are "Nice to Have" and do not affect core Gamification experience
- Achievement Toast (#62) can be quickly implemented in v1.3.0 as a polish task

#### 📝 Backlog Issues (Post v1.2.0)

| Issue | Title                                                     | Type       | Priority | Target   | Status       |
| ----- | --------------------------------------------------------- | ---------- | -------- | -------- | ------------ |
| #62   | feat(frontend): Achievement notification toast system     | Frontend   | P2       | v1.3.0   | 📝 Backlog   |
| #63   | feat(backend): Push notification service for achievements | Next.js API| P3       | v2.0.0   | 📝 Backlog   |
| TBD   | feat(gamification): Rewards system - unlock features      | Full-Stack | P3       | v2.0.0   | 📝 To Create |
| TBD   | feat(gamification): Community leaderboard                 | Full-Stack | P3       | v3.1.0   | 📝 To Create |

---

### 📋 v1.3.0: Smart Cart Integration

**Milestone**: `v1.3.0-smart-cart`  
**Status**: 🚧 In Progress  
**Target Release**: TBD (3 Sprints remaining)

**Summary**: Automated shopping list generation from meal plans, inventory tracking, and **AI-powered recipe suggestions based on available ingredients** (extends Python backend).

#### Epic Overview

| Epic # | Title                                           | Sub-Issues | Priority | Status        |
| ------ | ----------------------------------------------- | ---------- | -------- | ------------- |
| #75    | Epic: Database Foundation (E1)                  | #76-#79    | P0       | ✅ Complete   |
| #80    | Epic: Shopping List System (E2)                 | #81-#86    | P0       | ✅ Complete   |
| #87    | Epic: Inventory Management System (E3)          | #88-#92    | P0       | 🚧 In Progress |
| #93    | Epic: AI Recipe Recommendations (E4)            | #94-#98    | P1       | 📝 Planned    |
| #99    | Epic: Integration, Polish & Deployment (E5)     | #100-#104  | P0       | 📝 Planned    |

#### ✅ Epic 1: Database Foundation (Sprint 1) - COMPLETE

| Issue | Title                                                    | Type     | Priority | Status        |
| ----- | -------------------------------------------------------- | -------- | -------- | ------------- |
| #75   | epic: Smart Cart System - Database Foundation (E1)       | Epic     | P0       | ✅ Complete (PR #105) |
| #76   | feat(database): shopping_lists table schema              | Database | P0       | ✅ Complete (PR #105) |
| #77   | feat(database): shopping_list_items table schema         | Database | P0       | ✅ Complete (PR #105) |
| #78   | feat(database): user_inventory table schema              | Database | P0       | ✅ Complete (PR #105) |
| #79   | chore(types): TypeScript types for shopping/inventory    | Frontend | P1       | ✅ Complete (PR #105) |

**Schema Design Preview**:
```sql
-- shopping_lists: User's shopping list metadata
shopping_lists (
  id, user_id, name, description, is_archived, created_at, updated_at
)

-- shopping_list_items: Individual items in a shopping list
shopping_list_items (
  id, shopping_list_id, ingredient_id, item_name, quantity, unit,
  category, is_checked, position, created_at
)

-- user_inventory: User's pantry/fridge items
user_inventory (
  id, user_id, ingredient_id, quantity, unit, location,
  expiration_date, min_quantity, notes, created_at, updated_at
)
```

#### ✅ Epic 2: Shopping List System (Sprint 2) - COMPLETE

| Issue | Title                                                    | Type     | Priority | Status     |
| ----- | -------------------------------------------------------- | -------- | -------- | ---------- |
| #80   | Epic: Shopping List System (E2)                          | Epic     | P0       | ✅ Complete |
| #81   | feat(frontend): Shopping list create/read UI             | Frontend | P0       | ✅ Complete (PR #106) |
| #82   | feat(frontend): Shopping list update/delete              | Frontend | P0       | ✅ Complete (PR #107) |
| #83   | feat(frontend): Shopping list items management           | Frontend | P0       | ✅ Complete (PR #112) |
| #84   | feat(frontend): Shopping list export (copy/print)        | Frontend | P2       | ✅ Complete (PR #112) |
| #85   | feat(frontend): Recipe to shopping list integration      | Frontend | P1       | ✅ Complete (PR #112) |
| #86   | test(frontend): Shopping list unit and integration tests | Testing  | P1       | ✅ Complete (PR #112) |

**Epic 2 Deliverables**:
- ✅ Shopping list CRUD UI with cards
- ✅ Shopping list detail page with item management
- ✅ Generate shopping list from calendar date range
- ✅ Add recipe ingredients to shopping list
- ✅ Export: Copy to clipboard & Print
- ✅ 5 API routes (CRUD + Generate)
- ✅ 8 React components
- ✅ 12 unit tests (100% pass)

#### 🚧 Epic 3: Inventory Management System (Sprint 3) - IN PROGRESS

| Issue | Title                                                    | Type     | Priority | Status     |
| ----- | -------------------------------------------------------- | -------- | -------- | ---------- |
| #87   | Epic: Inventory Management System (E3)                   | Epic     | P0       | 🚧 In Progress |
| #88   | feat(frontend): Inventory CRUD UI                        | Frontend | P0       | 📝 To Do   |
| #89   | feat(frontend): Expiration tracking and alerts           | Frontend | P0       | 📝 To Do   |
| #90   | feat(frontend): Low stock alerts                         | Frontend | P1       | 📝 To Do   |
| #91   | feat(frontend): Recipe match indicator on recipe cards   | Frontend | P1       | ✅ Complete (PR #109) |
| #92   | test(frontend): Inventory system tests                   | Testing  | P1       | 📝 To Do   |

#### 🚧 Epic 4: AI Recipe Recommendations (Sprint 4) - IN PROGRESS

| Issue | Title                                                    | Type       | Priority | Status     |
| ----- | -------------------------------------------------------- | ---------- | -------- | ---------- |
| #93   | Epic: AI Recipe Recommendations from Inventory (E4)      | Epic       | P1       | 🚧 In Progress |
| #94   | feat(python): AI recipe suggestions from inventory       | Python API | P0       | 📝 To Do   |
| #95   | feat(python): Expiration priority in suggestions         | Python API | P0       | 📝 To Do   |
| #96   | feat(frontend): Suggest recipes from inventory button    | Frontend   | P0       | ✅ Complete (PR #108) |
| #97   | feat(frontend): Recipe recommendation modal              | Frontend   | P0       | 📝 To Do   |
| #98   | test(python): Inventory recommendation API tests         | Testing    | P1       | 📝 To Do   |

#### 🚧 Epic 5: Integration, Polish & Deployment (Sprint 5) - IN PROGRESS

| Issue | Title                                                    | Type       | Priority | Status     |
| ----- | -------------------------------------------------------- | ---------- | -------- | ---------- |
| #99   | Epic: Integration, Polish & Deployment (E5)              | Epic       | P0       | 🚧 In Progress |
| #100  | feat(frontend): Dashboard smart cart widget              | Frontend   | P1       | 📝 To Do   |
| #101  | feat(frontend): Shopping list → Inventory transfer flow  | Frontend   | P0       | 📝 To Do   |
| #102  | feat(frontend): Performance optimization                 | Frontend   | P1       | 📝 To Do   |
| #103  | test(e2e): Smart cart user journey tests                 | Testing    | P1       | 📝 To Do   |
| #104  | docs: Smart cart feature documentation                   | Docs       | P1       | ✅ Complete (PR #110) |

---

### 📋 Recent Bug Fixes & Improvements (v1.3.x)

The following issues were addressed during v1.3.0 development:

| Issue | Title                                                    | Type     | Status     | PR     |
| ----- | -------------------------------------------------------- | -------- | ---------- | ------ |
| #113  | fix(Database): Missing 'aisle' column in shopping list   | Bug      | ✅ Fixed   | #114   |
| #115  | fix(frontend): Shopping list feature locked              | Bug      | ✅ Fixed   | #122   |
| #123  | fix(Challenge): Progress not saved, calculations wrong   | Bug      | ✅ Fixed   | #125   |
| #124  | fix(API): Fail to generate shopping list from calendar   | Bug      | ✅ Fixed   | #125   |
| #126  | fix(test): StreakWidget timezone test failure            | Bug      | ✅ Fixed   | #127   |
| #128  | fix: Hydration mismatch in AppSidebar DropdownMenu       | Bug      | ✅ Fixed   | #129   |
| #130  | feat: Add concurrently for dev:full command              | DX       | ✅ Done    | #131   |
| #133  | fix: Improve Recommender page layout and styling         | UI       | ✅ Fixed   | #134   |

#### Backend API Design

> **Note**: Shopping list CRUD uses Next.js API Routes. **AI-powered recipe suggestions** require extending the Python FastAPI backend with a new `/inventory-recommend` endpoint.

| Issue | Title                                                       | Type           | Priority | Assignee | Status       |
| ----- | ----------------------------------------------------------- | -------------- | -------- | -------- | ------------ |
| #94   | feat(python): AI recipe suggestions from inventory          | Python API     | P0       | -        | 📝 To Do     |
| #95   | feat(python): Expiration priority in suggestions            | Python API     | P0       | -        | 📝 To Do     |

**AI Inventory Recommendation Design** (Python FastAPI Extension):
```python
# New endpoint: POST /inventory-recommend
# Extends existing recommender.py architecture

class InventoryRecommendRequest(BaseModel):
    inventory: List[InventoryItem]  # [{ingredient_id, quantity, expiration_date}]
    preferences: Optional[str] = None  # "low carb", "high protein", etc.
    num_recipes: int = 5

class InventoryItem(BaseModel):
    ingredient_id: int
    quantity: float
    unit: str
    expiration_date: Optional[str] = None  # ISO date string

# Algorithm Flow:
# 1. Load user inventory → map to ingredient embeddings
# 2. Find recipes that use inventory ingredients (SQL filter)
# 3. Rank by:
#    - Ingredient coverage (% of recipe ingredients available)
#    - Expiration urgency (prioritize soon-to-expire items)
#    - User preferences (if provided, use Gemini expansion)
# 4. Use existing KMeans diversity selection
# 5. Return top N diverse recipes with reasoning

def recommend_from_inventory(inventory: List[InventoryItem], preferences: str = None):
    # Reuse existing embedding + clustering infrastructure
    recipe_data = load_recipe_data()
    embedder = load_embedder()
    
    # Filter recipes by available ingredients
    available_ingredient_ids = [item.ingredient_id for item in inventory]
    candidate_recipes = filter_by_ingredients(recipe_data, available_ingredient_ids)
    
    # Score by coverage + expiration urgency
    scored = score_recipes(candidate_recipes, inventory)
    
    # Optional: Apply preference filter via Gemini
    if preferences:
        scored = apply_preference_filter(scored, preferences)
    
    # Diversity selection (reuse existing KMeans)
    diverse = select_diverse_recipes(scored, n_meals=5)
    
    return diverse, generate_reasoning(diverse, inventory)
```

**API Endpoints Preview**:
```
# Next.js API Routes (CRUD)
GET/POST /api/shopping-lists           - List/create shopping lists
GET/PUT/DELETE /api/shopping-lists/[id] - Manage specific list
POST /api/shopping-lists/generate      - Auto-generate from calendar date range
GET/POST /api/inventory                - List/add inventory items
PUT/DELETE /api/inventory/[id]         - Update/remove inventory item

# Python FastAPI (AI Recommendations) - NEW in v1.3.0
POST /inventory-recommend              - AI recipe suggestions from inventory
  Request:  { inventory: [{ingredient_id, quantity, expiration_date}], preferences?: string }
  Response: { recipes: [...], reasoning: string }
```

**v1.3.0 Sprint Plan**:

| Sprint | Focus Area                    | Issues                          | Duration |
| ------ | ----------------------------- | ------------------------------- | -------- |
| 1      | Database Foundation           | #75, #76, #77, #78, #79         | 1 week   |
| 2      | Shopping List System          | #80, #81, #82, #83, #84, #85, #86 | 2 weeks |
| 3      | Inventory Management          | #87, #88, #89, #90, #91, #92    | 2 weeks  |
| 4      | AI Recommendations            | #93, #94, #95, #96, #97, #98    | 2 weeks  |
| 5      | Integration & Polish          | #99, #100, #101, #102, #103, #104 | 2 weeks |

**Expected Deliverables**:

- [x] Shopping list database schema with RLS policies (#76) ✅
- [x] Shopping list items schema (#77) ✅
- [x] Inventory tracking database schema (#78) ✅
- [x] TypeScript types for all new entities (#79) ✅
- [x] `/dashboard/shopping` - Interactive shopping list UI (#81-#85) ✅
- [ ] `/dashboard/inventory` - Inventory management interface (#88-#90)
- [x] Recipe match indicator on cards (#91) ✅
- [ ] AI recipe suggestions from inventory (#94-#95)
- [x] Suggest recipes from inventory button (#96) ✅
- [ ] Recipe recommendation modal (#97)
- [ ] Dashboard smart cart widget (#100)
- [ ] Shopping → Inventory transfer flow (#101)
- [ ] Performance optimization (#102)
- [ ] E2E tests (#103)
- [x] Smart cart documentation (#104) ✅

---

## 🚀 Phase 2 Completion Roadmap

### Current Progress Summary

```
Phase 2: Advanced Features (v1.1.0 - v1.3.0)
├── v1.1.0 Nutrient Tracking ████████████████████ 100% ✅
├── v1.2.0 Gamification      ████████████████████ 100% ✅
└── v1.3.0 Smart Cart        ████████████░░░░░░░░  63% 🚧
    ├── Epic 1 (Database)    ████████████████████ 100% ✅
    ├── Epic 2 (Shopping)    ████████████████████ 100% ✅
    ├── Epic 3 (Inventory)   ████░░░░░░░░░░░░░░░░  20% 🚧
    ├── Epic 4 (AI Recs)     ████░░░░░░░░░░░░░░░░  20% �
    └── Epic 5 (Integration) ████░░░░░░░░░░░░░░░░  20% �

Overall Phase 2: ██████████████████░░ ~87%
```

### v1.3.0 Development Roadmap

**Current Focus**: Epic 3-5 - Inventory, AI Recommendations, Integration

**Completed**:
1. ✅ GitHub issues created (30 issues total)
2. ✅ Epic 1: Database migrations (#76, #77, #78)
3. ✅ Epic 1: TypeScript types (#79)
4. ✅ Epic 2: Shopping List UI (#81-#86)
5. ✅ Epic 3: Recipe match indicator (#91)
6. ✅ Epic 4: Suggest recipes button (#96)
7. ✅ Epic 5: Documentation (#104)

**In Progress**:
- 🚧 Epic 3: Inventory CRUD UI (#88)
- 🚧 Epic 3: Expiration tracking (#89)
- 🚧 Epic 3: Low stock alerts (#90)
- 🚧 Epic 4: AI recipe suggestions API (#94, #95)
- 🚧 Epic 5: Dashboard widget & transfer flow (#100, #101)

### Issue Labels for v1.3.0

| Label        | Usage                              |
| ------------ | ---------------------------------- |
| `epic`       | Epic-level tracking issue          |
| `v1.3.0`     | Version milestone                  |
| `phase-2`    | Phase 2 features                   |
| `frontend`   | Frontend-related work              |
| `backend`    | Backend-related work               |
| `database`   | Database changes                   |
| `testing`    | Test coverage                      |
| `priority-p0`| Critical (must have)               |
| `priority-p1`| High (should have)                 |
| `priority-p2`| Medium (nice to have)              |

---

## ✅ Phase 1 - Completed Milestones (v1.0.0)

### v1.0.0-alpha: Core Architecture Setup ✅

**Completion**: 100%  
**Status**: Production
**Release Date**: Completed

| Component  | Features Implemented             | Status      |
| ---------- | -------------------------------- | ----------- |
| Frontend   | Next.js 15 + App Router scaffold | ✅ Complete |
| Backend    | FastAPI + Supabase integration   | ✅ Complete |
| Database   | Supabase PostgreSQL setup        | ✅ Complete |
| Deployment | Vercel + ngrok configuration     | ✅ Complete |

**Key Deliverables**:

- ✅ Project structure established
- ✅ Development environment configured
- ✅ CI/CD pipeline with GitHub Actions
- ✅ Code quality tools (ESLint, Prettier, Ruff)

---

### v1.0.0-beta: User Authentication & Database Integration ✅

**Completion**: 100%  
**Status**: Production
**Release Date**: Completed

| Component          | Features Implemented                 | Status      |
| ------------------ | ------------------------------------ | ----------- |
| Auth System        | Supabase Auth integration            | ✅ Complete |
| User Sign Up       | Email/password registration          | ✅ Complete |
| User Sign In       | Login with session management        | ✅ Complete |
| Protected Routes   | Middleware authentication            | ✅ Complete |
| Environment Config | .env setup for both frontend/backend | ✅ Complete |

**Key Deliverables**:

- ✅ Complete user authentication flow
- ✅ Protected dashboard routes
- ✅ Session management with Supabase
- ✅ Secure environment variable handling

---

### v1.0.0-rc1: Recipe Management Dashboard ✅

**Completion**: 100%  
**Status**: Production
**Release Date**: Completed

| Component       | Features Implemented                     | Status      |
| --------------- | ---------------------------------------- | ----------- |
| Recipe List     | `/dashboard/recipes` with search         | ✅ Complete |
| Recipe Detail   | `/dashboard/recipes/[id]` with full info | ✅ Complete |
| Search & Filter | Keyword, ingredient, tag filtering       | ✅ Complete |
| Green Score     | Sustainability metrics display           | ✅ Complete |
| Database        | Recipe, Ingredient, Tag tables           | ✅ Complete |

**API Endpoints Implemented**:

- ✅ `GET /api/recipes` - List recipes with filtering
- ✅ `GET /api/recipes/[id]` - Recipe details
- ✅ `GET /api/ingredients` - Ingredient search
- ✅ `GET /api/tags` - Tag filtering

**Key Deliverables**:

- ✅ Full recipe browsing interface
- ✅ Advanced search and filtering
- ✅ Green Score sustainability feature
- ✅ Responsive UI with Tailwind CSS

---

### v1.0.0: Meal Calendar & AI Recommender ✅

**Completion**: 100%  
**Status**: Production
**Release Date**: Completed

| Component             | Features Implemented                    | Status      |
| --------------------- | --------------------------------------- | ----------- |
| Meal Calendar         | `/dashboard/calendar` with FullCalendar | ✅ Complete |
| Meal Planning         | Add recipes to breakfast/lunch/dinner   | ✅ Complete |
| Meal Tracking         | Mark meals as completed                 | ✅ Complete |
| AI Recommender        | `/dashboard/recommender` with Gemini    | ✅ Complete |
| Recommendation Engine | Semantic search + clustering            | ✅ Complete |

**API Endpoints Implemented**:

- ✅ `GET /api/calendar` - Get user's meal calendar
- ✅ `POST /api/calendar` - Add meal to calendar
- ✅ `PATCH /api/events/[id]` - Update meal status
- ✅ `POST /recommender` (Backend) - AI meal recommendations
- ✅ `GET /api/recommendations` - Fetch recommendations

**AI Features**:

- ✅ Google Gemini for goal expansion
- ✅ SentenceTransformers for semantic embeddings
- ✅ KMeans clustering for diversity
- ✅ Lazy loading for performance
- ✅ GPU support (CUDA detection)

**Key Deliverables**:

- ✅ Interactive meal calendar
- ✅ AI-powered personalized recommendations
- ✅ Goal-based meal planning
- ✅ Complete recommendation pipeline

---

## 📊 Phase 1 Summary (v1.0.0)

### Overall Statistics

- **Version Released**: v1.0.0
- **Total Features**: 15+
- **Completion Rate**: 100%
- **Test Coverage**: Jest tests implemented
- **Deployment**: Production on Vercel

### Technology Implementation

| Layer      | Technology                    | Status      |
| ---------- | ----------------------------- | ----------- |
| Frontend   | Next.js 15 + TypeScript       | ✅ Complete |
| Backend    | FastAPI + Python              | ✅ Complete |
| Database   | Supabase PostgreSQL           | ✅ Complete |
| Auth       | Supabase Auth                 | ✅ Complete |
| AI/ML      | Gemini + SentenceTransformers | ✅ Complete |
| Deployment | Vercel + ngrok                | ✅ Complete |
| Testing    | Jest + Pytest                 | ✅ Complete |

---

## 🚀 Phase 2 - Upcoming Milestones (v1.1.0 - v1.3.0)

> **Note**: Issues for Phase 2 features should be created using the template in the "Issue Tracking Guidelines" section below. Once created, update the issue tracking tables at the top of this document.

### 🛠️ Foundation & Tooling

**Status**: ✅ Complete
**Priority**: P0

| Issue | Title                                                 | Type     | Priority | Assignee  | Status      |
| ----- | ----------------------------------------------------- | -------- | -------- | --------- | ----------- |
| #3    | chore(backend): Refactor dev tools (uv, ruff)         | Backend  | P0       | @zhanyang | ✅ Complete |
| #7    | fix(backend): Refactor Calendar API & DB              | Backend  | P1       | @zhanyang | ✅ Complete |
| #9    | chore(database): Build local Supabase with migrations | Database | P1       | @zhanyang | ✅ Complete |
| #11   | fix(frontend): responsive design issues               | Frontend | P1       | @sdxshuai | ✅ Complete |
| #23   | fix(database): IMMUTABLE index on nutrient_tracking   | Database | P0       | @zhanyang | ✅ Complete |

### v1.1.0: Monthly Nutrient Summary

**Status**: 🚧 In Progress (charts + historical endpoints shipped; exports/goals pending)  
**Priority**: P1  
**Milestone**: `v1.1.0-nutrient-tracking`
**Target Release**: TBD

#### Planned Features

| Feature           | Description                                | Complexity | Issue #             |
| ----------------- | ------------------------------------------ | ---------- | ------------------- |
| Nutrient Tracking | Track daily/weekly/monthly nutrient intake | Medium     | #13/#14/#15/#16/#17 |
| Visualization     | Charts and graphs for nutrition trends     | Medium     | #25                 |
| Goal Setting      | Set personal nutrition goals               | Low        | #28                 |
| Progress Reports  | Weekly/monthly nutrition reports           | Medium     | #26                 |
| Export Data       | Export nutrition data (CSV/PDF)            | Low        | #27                 |

#### Technical Requirements

**Frontend Tasks**:

- [x] Nutrient dashboard page (`/dashboard/nutrients`)
- [x] Basic nutrient dashboard tests (Jest, >85% target)
- [x] Chart components (Recharts)
- [x] Date range picker for historical data
- [x] Export functionality

**Backend Tasks**:

- [x] Nutrient calculation aggregation API (`/api/nutrients/daily`)
- [x] Historical data query endpoints (week/month summaries)
- [x] Report generation service
- [x] Data export endpoints

**Database**:

- [x] Nutrient tracking table + RLS
- [x] Aggregation indexes (immutable `month_start` for monthly index)
- [x] User goal preferences table

**Estimated Effort**: Medium to Large  
**Dependencies**: Meal calendar data

---

### v1.2.0: Gamified Challenges

**Status**: ✅ Core Complete (Extended features deferred)  
**Priority**: P2  
**Milestone**: `v1.2.0-gamification`
**Release Date**: November 28, 2025

#### Delivered / Planned Features

| Feature      | Description                              | Complexity | Issue # | Status |
| ------------ | ---------------------------------------- | ---------- | ------- | ------ |
| Badge System | Earn badges for achievements             | Medium     | #32     | ✅ Complete |
| Achievements | UI + API to view/unlock badges           | Medium     | #35/#36 | ✅ Complete |
| Types        | Gamification TS types                    | Low        | #33     | ✅ Complete |
| Streaks      | Track consecutive days of healthy eating | Medium     | #60/#61 | ✅ Complete |
| Challenges   | Weekly/monthly challenges                | Medium     | #65/#66/#68 | ✅ Complete |
| Rewards      | Unlock features through achievements     | Medium     | TBD     | ⏸️ Deferred to v2.0.0 |
| Leaderboard  | Community rankings (optional)            | High       | TBD     | ⏸️ Deferred to v3.1.0 |
| Notifications| Notify on unlocks                        | Medium     | #62/#63 | 🚧 API Ready, Frontend Pending |

#### Technical Requirements

**Frontend Tasks**:

- [x] Badges & achievements page (#36)
- [x] Challenge tracking UI (#68)
- [x] Progress animations (StreakWidget)
- [ ] Notification system for achievements (Toast - #62 Backlog)

**Backend Tasks**:

- [x] Achievement tracking logic + auto-award (#35/#41 follow-up)
- [x] Badge assignment system (#35)
- [x] Challenge creation/management API (#66)
- [x] Streak tracking API (#60)
- [x] Push notification subscribe/unsubscribe API
- [ ] Push notification trigger on achievement unlock (#63 Backlog)

**Database**:

- [x] User achievements table & schema (#32)
- [x] Challenges table (#65)
- [x] User challenges progress tracking (#65)
- [x] Streak history table (#61)

**Estimated Effort**: Medium to Large  
**Dependencies**: Nutrient tracking system (v1.1.0)

---

### v1.3.0: Smart Cart Integration

**Status**: 📝 Planning  
**Priority**: P1  
**Milestone**: `v1.3.0-smart-cart`
**Target Release**: TBD

#### Planned Features

| Feature               | Description                         | Complexity | Issue # |
| --------------------- | ----------------------------------- | ---------- | ------- |
| Shopping List         | Generate from weekly meal plan      | Medium     | TBD     |
| Ingredient Quantities | Calculate exact amounts needed      | High       | TBD     |
| Inventory Tracking    | Track pantry items                  | High       | TBD     |
| Smart Suggestions     | Suggest recipes based on inventory  | High       | TBD     |
| Integration Ready     | Prepare for grocery API integration | Medium     | TBD     |

#### Technical Requirements

**Frontend Tasks**:

- [ ] Shopping list page (`/dashboard/shopping`)
- [ ] Inventory management UI
- [ ] Quantity adjustment interface
- [ ] Export shopping list (print/email)

**Backend Tasks**:

- [ ] Shopping list generation algorithm
- [ ] Quantity calculation service
- [ ] Inventory tracking API
- [ ] Smart suggestion engine

**Database**:

- [ ] Shopping list table
- [ ] Inventory table
- [ ] Recipe-to-ingredients mapping enhancement

**Estimated Effort**: Large  
**Dependencies**: Meal calendar (v1.0.0)

---

## 🎯 Long-Term Vision (v2.0.0+)

### v2.0.0: User Personalization & AI Enhancement

- Continuous refinement of AI recommendations
- User feedback integration
- Dietary preference learning
- Adaptive meal suggestions

### v2.1.0: Sustainability Enhancement

- CO₂ impact metrics per recipe
- Eco-friendly meal suggestions
- Seasonal ingredient recommendations
- Local sourcing information

### v3.0.0: Cross-Platform Expansion

- Mobile app (React Native / Flutter)
- Offline mode support
- Push notifications
- Wearable device integration

### v3.1.0: Community Features

- Recipe sharing between users
- User-generated content
- Social meal planning
- Community challenges

---

## 📋 Issue Tracking Guidelines

### Quick Start: Creating Phase 2 Issues

For each feature in Phase 2, follow this process:

1. **Choose a feature** from the tables at the top of this document
2. **Create GitHub Issue** with the template below
3. **Add to milestone** (e.g., `phase-2-month-1-nutrient-tracking`)
4. **Add labels**: `feature`, `phase-2`, component type, priority
5. **Update this document** with the issue number in the tracking table
6. **Self-assign** or leave for team assignment

### Example: Creating a Nutrient Dashboard Issue

```markdown
Title: feat(frontend): Nutrient Dashboard Page with Chart Components

Labels: feature, frontend, phase-2, priority-p1

Milestone: v1.1.0-nutrient-tracking

## Feature: Nutrient Dashboard Page

### Description

Create a comprehensive nutrient tracking dashboard that displays daily, weekly,
and monthly nutrition intake with interactive charts and graphs.

### User Story

As a health-conscious user, I want to visualize my nutrient intake over time
so that I can track my progress toward nutrition goals.

### Acceptance Criteria

- [ ] Dashboard displays daily nutrient breakdown
- [ ] Charts show weekly and monthly trends
- [ ] Date range picker allows historical data viewing
- [ ] Responsive design works on mobile and desktop
- [ ] Loading states and error handling implemented

### Technical Requirements

**Frontend**:

- [ ] Create `/dashboard/nutrients` page
- [ ] Integrate Chart.js or Recharts for visualization
- [ ] Implement date range picker component
- [ ] Connect to nutrient aggregation API
- [ ] Add responsive layout with Tailwind CSS

**API Dependencies**:

- [ ] Requires `GET /api/nutrients/summary` endpoint (Backend Issue #TBD)
- [ ] Requires `GET /api/nutrients/history` endpoint (Backend Issue #TBD)

### Testing Requirements

- [ ] Component unit tests with Jest
- [ ] Chart rendering tests
- [ ] API integration tests
- [ ] Responsive layout tests

### Dependencies

- Backend nutrient aggregation API (Issue #TBD)
- Meal calendar data must be available

### Estimated Effort

Medium (3-5 days)
```

---

### Creating New Issues - Full Template

Use this template for new feature issues:

\`\`\`markdown

## Feature: [Feature Name]

### Description

[Brief description of the feature]

### User Story

As a [user type], I want [goal] so that [benefit]

### Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

### Technical Requirements

**Frontend**:

- [ ] Task 1
- [ ] Task 2

**Backend**:

- [ ] Task 1
- [ ] Task 2

**Database**:

- [ ] Schema changes
- [ ] Migrations

### Testing Requirements

- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests

### Dependencies

- Issue #X
- Feature Y must be complete

### Estimated Effort

[Small / Medium / Large]

### Labels

\`feature\`, \`frontend\`, \`backend\`, \`priority-p1\`, \`phase-2\`
\`\`\`

### Issue Labels

| Label              | Usage                        |
| ------------------ | ---------------------------- |
| `feature`          | New feature implementation   |
| `bug`              | Bug fix                      |
| `phase-2`          | Phase 2 features (Month 1-3) |
| `documentation`    | Documentation updates        |
| `frontend`         | Frontend-related work        |
| `backend`          | Backend-related work         |
| `ai-ml`            | AI/ML components             |
| `database`         | Database changes             |
| `priority-p0`      | Critical                     |
| `priority-p1`      | High                         |
| `priority-p2`      | Medium                       |
| `priority-p3`      | Low                          |
| `good-first-issue` | Good for newcomers           |

---

## 🤝 Multi-Developer Collaboration

### Task Assignment Process

1. **Review Available Tasks**: Check Phase 2 milestones above
2. **Create GitHub Issue**: Use the template provided
3. **Self-Assign**: Assign yourself to the issue
4. **Create Branch**: \`feat/issue-<number>-<description>\`
5. **Development**: Follow patterns in AGENT-PLAN docs
6. **Create PR**: Link to the original issue
7. **Code Review**: Get at least 1 approval
8. **Merge**: Squash and merge after approval

### Branch Naming Convention

\`\`\`
feat/issue-123-nutrient-dashboard
fix/issue-456-calendar-bug
docs/issue-789-api-documentation
refactor/issue-012-recommender-optimization
\`\`\`

### Commit Message Format

\`\`\`
<type>(<scope>): <subject>

<body>

Closes #<issue-number>
\`\`\`

**Types**: \`feat\`, \`fix\`, \`docs\`, \`style\`, \`refactor\`, \`test\`, \`chore\`

**Example**:
\`\`\`
feat(nutrient): add monthly nutrient summary dashboard

- Implemented chart components for visualization
- Added date range picker
- Created aggregation API endpoint

Closes #123
\`\`\`

---

## 📚 Related Documentation

| Document                                               | Purpose                    |
| ------------------------------------------------------ | -------------------------- |
| [Roadmap](../Epicourier-Web.wiki/Roadmap.md)           | High-level feature roadmap |
| [01-TECH-STACK.md](./01-TECH-STACK.md)                 | Technology details         |
| [02-ARCHITECTURE.md](./02-ARCHITECTURE.md)             | System architecture        |
| [03-API-SPECIFICATIONS.md](./03-API-SPECIFICATIONS.md) | API documentation          |
| [05-FRONTEND-PATTERNS.md](./05-FRONTEND-PATTERNS.md)   | Frontend coding patterns   |
| [06-BACKEND-PATTERNS.md](./06-BACKEND-PATTERNS.md)     | Backend coding patterns    |

---

## 🔄 Document Updates

This document should be updated:

- ✅ When new milestones are defined
- ✅ When features are completed
- ✅ Monthly during sprint planning
- ✅ When roadmap priorities change

**Last Review**: November 17, 2025  
**Next Review**: December 1, 2025
