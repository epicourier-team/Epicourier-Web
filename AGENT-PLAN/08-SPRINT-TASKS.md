# Epicourier Sprint Tasks & Milestones

**Document Version**: 1.4  
**Last Updated**: November 28, 2025  
**Current Phase**: Phase 2 In Progress (v1.1.0 ✅ | v1.2.0 🚧 | v1.3.0 📝)

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
| v1.2.0  | Gamification      | 🚧 Core Complete     | 6/6 core, remaining features planned |
| v1.3.0  | Smart Cart        | 📝 Planning          | 0/9      |

**Overall Phase 2 Progress**: ~60% (v1.1.0 + v1.2.0 core shipped, v1.2.0 extras + v1.3.0 pending)

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
**Status**: 🚧 Core Complete, Extended Features Pending  
**Core Release Date**: November 28, 2025

**Summary**: Achievement/badge system with auto-unlock, tier-based styling, and progress tracking.

#### ✅ Completed Issues (Core Achievement System)

| Issue | Title                                                         | Type     | Priority | Status                        |
| ----- | ------------------------------------------------------------- | -------- | -------- | ----------------------------- |
| #32   | feat(database): Achievement system database schema            | Database | P1       | ✅ Complete (PR #37)          |
| #33   | chore(types): Add TypeScript types for gamification system    | Frontend | P2       | ✅ Complete (PR #38)          |
| #34   | feat(api): Achievement checking and awarding endpoint         | Backend  | P2       | ✅ Closed (superseded by #35) |
| #35   | feat(api): Achievement checking and awarding endpoint         | Backend  | P1       | ✅ Complete (PR #39)          |
| #36   | feat(frontend): Badge display component and achievements page | Frontend | P1       | ✅ Complete (PR #40)          |
| #41   | fix(achievements): DB error, missing auto-unlock, icon issues | Bug      | P1       | ✅ Complete (PR #42)          |

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

#### 📝 Planned Issues (Extended Gamification Features)

| Issue | Title                                                     | Type       | Priority | Assignee | Status       |
| ----- | --------------------------------------------------------- | ---------- | -------- | -------- | ------------ |
| TBD   | feat(database): Challenge system schema                   | Database   | P1       | -        | 📝 To Create |
| TBD   | feat(backend): Weekly/monthly challenge generation API    | Backend    | P1       | -        | 📝 To Create |
| TBD   | feat(frontend): Challenge participation UI                | Frontend   | P1       | -        | 📝 To Create |
| TBD   | feat(frontend): Streak tracking dashboard widget          | Frontend   | P2       | -        | 📝 To Create |
| TBD   | feat(backend): Streak calculation and persistence         | Backend    | P2       | -        | 📝 To Create |
| TBD   | feat(frontend): Achievement notification toast system     | Frontend   | P2       | -        | 📝 To Create |
| TBD   | feat(backend): Push notification service for achievements | Backend    | P3       | -        | 📝 To Create |
| TBD   | test: Gamification integration tests                      | Testing    | P2       | -        | 📝 To Create |

**Extended Deliverables** (Planned):

- [ ] Challenge system database schema (challenges, user_challenges)
- [ ] Weekly challenge: "Log 5 green recipes this week"
- [ ] Monthly challenge: "Maintain 80% nutrient goal adherence"
- [ ] Streak tracking UI with visual indicators
- [ ] Real-time achievement unlock notifications
- [ ] Integration tests for gamification workflows

---

### 📋 v1.3.0: Smart Cart Integration

**Milestone**: `v1.3.0-smart-cart`  
**Status**: 📝 Planning  
**Target Release**: TBD

**Summary**: Automated shopping list generation from meal plans, inventory tracking, and smart recipe suggestions.

#### 📝 Database Schema Tasks

| Issue | Title                                                    | Type     | Priority | Assignee | Status       |
| ----- | -------------------------------------------------------- | -------- | -------- | -------- | ------------ |
| TBD   | feat(database): shopping_lists table schema              | Database | P1       | -        | 📝 To Create |
| TBD   | feat(database): shopping_list_items table schema         | Database | P1       | -        | 📝 To Create |
| TBD   | feat(database): user_inventory table schema              | Database | P1       | -        | 📝 To Create |
| TBD   | chore(types): Add TypeScript types for shopping/inventory| Frontend | P2       | -        | 📝 To Create |

**Schema Design Preview**:
```sql
-- shopping_lists: User's shopping list metadata
shopping_lists (
  id, user_id, name, date_range_start, date_range_end, 
  status: 'draft'|'active'|'completed', created_at
)

-- shopping_list_items: Individual items in a shopping list
shopping_list_items (
  id, list_id, ingredient_id, quantity, unit, 
  is_checked, added_from_recipe_id, notes
)

-- user_inventory: User's pantry/fridge items
user_inventory (
  id, user_id, ingredient_id, quantity, unit, 
  expiration_date, location: 'pantry'|'fridge'|'freezer'
)
```

#### 📝 Backend API Tasks

| Issue | Title                                                       | Type    | Priority | Assignee | Status       |
| ----- | ----------------------------------------------------------- | ------- | -------- | -------- | ------------ |
| TBD   | feat(api): Shopping list CRUD endpoints                     | Backend | P1       | -        | 📝 To Create |
| TBD   | feat(api): Auto-generate shopping list from calendar        | Backend | P1       | -        | 📝 To Create |
| TBD   | feat(api): Inventory CRUD endpoints                         | Backend | P1       | -        | 📝 To Create |
| TBD   | feat(api): Smart ingredient aggregation algorithm           | Backend | P1       | -        | 📝 To Create |
| TBD   | feat(api): Recipe suggestions based on inventory            | Backend | P2       | -        | 📝 To Create |

**API Endpoints Preview**:
```
GET/POST /api/shopping-lists           - List/create shopping lists
GET/PUT/DELETE /api/shopping-lists/[id] - Manage specific list
POST /api/shopping-lists/generate      - Auto-generate from calendar date range
GET/POST /api/inventory                - List/add inventory items
PUT/DELETE /api/inventory/[id]         - Update/remove inventory item
GET /api/recipes/suggestions           - Recipes matching current inventory
```

#### 📝 Frontend UI Tasks

| Issue | Title                                                      | Type     | Priority | Assignee | Status       |
| ----- | ---------------------------------------------------------- | -------- | -------- | -------- | ------------ |
| TBD   | feat(frontend): Shopping List Page `/dashboard/shopping`   | Frontend | P1       | -        | 📝 To Create |
| TBD   | feat(frontend): Inventory Management `/dashboard/inventory`| Frontend | P1       | -        | 📝 To Create |
| TBD   | feat(frontend): Shopping list item checkbox interactions   | Frontend | P1       | -        | 📝 To Create |
| TBD   | feat(frontend): "Add to shopping list" from recipe page    | Frontend | P2       | -        | 📝 To Create |
| TBD   | feat(frontend): Inventory expiration warnings              | Frontend | P2       | -        | 📝 To Create |
| TBD   | feat(frontend): Shopping list export (print/email/share)   | Frontend | P2       | -        | 📝 To Create |

#### 📝 Testing Tasks

| Issue | Title                                                   | Type    | Priority | Assignee | Status       |
| ----- | ------------------------------------------------------- | ------- | -------- | -------- | ------------ |
| TBD   | test: Shopping list API unit tests                      | Testing | P1       | -        | 📝 To Create |
| TBD   | test: Inventory API unit tests                          | Testing | P1       | -        | 📝 To Create |
| TBD   | test: Shopping list generation algorithm tests          | Testing | P1       | -        | 📝 To Create |
| TBD   | test: Frontend shopping/inventory component tests       | Testing | P2       | -        | 📝 To Create |

**Expected Deliverables**:

- [ ] Shopping list database schema with RLS policies
- [ ] Inventory tracking database schema
- [ ] Auto-generate shopping list from meal calendar (date range)
- [ ] Smart ingredient aggregation (combine same ingredients from multiple recipes)
- [ ] `/dashboard/shopping` - Interactive shopping list UI
- [ ] `/dashboard/inventory` - Inventory management interface
- [ ] Checkbox to mark items as purchased
- [ ] Recipe suggestions based on available inventory
- [ ] Expiration date warnings for inventory items
- [ ] Export shopping list (print-friendly, email, share link)
- [ ] Integration with calendar (quick "add ingredients to cart" from meal)

---

## 🚀 Phase 2 Completion Roadmap

### Current Progress Summary

```
Phase 2: Advanced Features (v1.1.0 - v1.3.0)
├── v1.1.0 Nutrient Tracking ████████████████████ 100% ✅
├── v1.2.0 Gamification
│   ├── Core (Achievements) ████████████████████ 100% ✅
│   └── Extended (Challenges) ░░░░░░░░░░░░░░░░░░░░ 0% 📝
└── v1.3.0 Smart Cart       ░░░░░░░░░░░░░░░░░░░░ 0% 📝

Overall Phase 2: ████████████░░░░░░░░ ~55%
```

### Recommended Next Steps

#### Option A: Complete v1.2.0 Extended Features First
**Rationale**: Finish gamification before starting new feature area

1. Create GitHub issues for v1.2.0 extended features (8 issues)
2. Implement Challenge database schema
3. Build Weekly/Monthly challenge generation API
4. Create Challenge participation UI
5. Add Streak tracking widget
6. Implement achievement notifications

**Estimated Effort**: 2-3 sprints

#### Option B: Start v1.3.0 Smart Cart (MVP First)
**Rationale**: Deliver core shopping functionality, defer gamification extras

1. Create GitHub issues for v1.3.0 core features (focus on P1 items)
2. Implement database schema (shopping_lists, shopping_list_items, user_inventory)
3. Build shopping list CRUD API
4. Create auto-generate from calendar feature
5. Build basic shopping list UI
6. Add inventory management later

**Estimated Effort**: 3-4 sprints for MVP

#### Option C: Parallel Development
**Rationale**: If multiple developers available

- **Stream A**: v1.2.0 extended (challenges, streaks)
- **Stream B**: v1.3.0 database + API foundation

### Issue Creation Checklist

When ready to start the next milestone, create issues using this template:

```markdown
## Description
[Clear description of what needs to be built]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Technical Notes
- Related tables/APIs
- Dependencies on other issues

## Labels
`phase-2`, `v1.2.0` or `v1.3.0`, `frontend`/`backend`/`database`, `priority-p1`
```

### 🚨 How to Create Issues for Phase 2

When ready to start a Phase 2 feature, create a GitHub issue using this workflow:

1. **Use the Issue Template** (from this document's "Issue Tracking Guidelines" section)
2. **Add to Project Board**: Link to Epicourier Phase 2 project
3. **Set Milestone**: Choose appropriate version (v1.1.0/v1.2.0/v1.3.0)
4. **Add Labels**: `feature`, `frontend`/`backend`, `phase-2`, `priority-p1`
5. **Update This Document**: Add issue number to the table above
6. **Assign**: Self-assign or leave for team assignment

**Example Issue Title Format**:

```
feat(frontend): Nutrient Dashboard Page with Chart Components
```

**Example Labels**:

```
feature, frontend, phase-2, priority-p1, good-first-issue
```

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

**Status**: 🚀 Core shipped, regression open (#41)  
**Priority**: P2  
**Milestone**: `v1.2.0-gamification`
**Target Release**: TBD

#### Delivered / Planned Features

| Feature      | Description                              | Complexity | Issue # | Status |
| ------------ | ---------------------------------------- | ---------- | ------- | ------ |
| Badge System | Earn badges for achievements             | Medium     | #32     | ✅     |
| Achievements | UI + API to view/unlock badges           | Medium     | #35/#36 | ✅     |
| Types        | Gamification TS types                    | Low        | #33     | ✅     |
| Streaks      | Track consecutive days of healthy eating | Low        | #35     | ✅ (in API) |
| Challenges   | Weekly/monthly challenges                | Medium     | TBD     | 📝 Planned |
| Rewards      | Unlock features through achievements     | Medium     | TBD     | 📝 Planned |
| Leaderboard  | Community rankings (optional)            | High       | TBD     | 📝 Planned |
| Notifications| Notify on unlocks                        | Medium     | TBD     | 📝 Planned |

#### Technical Requirements

**Frontend Tasks**:

- [x] Badges & achievements page (#36)
- [ ] Challenge tracking UI
- [ ] Progress animations
- [ ] Notification system for achievements

**Backend Tasks**:

- [x] Achievement tracking logic + auto-award (#35/#41 follow-up)
- [x] Badge assignment system (#35)
- [ ] Challenge creation/management API
- [ ] Notification service

**Database**:

- [x] User achievements table & schema (#32)
- [ ] Challenges table
- [ ] User progress tracking for challenges

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
