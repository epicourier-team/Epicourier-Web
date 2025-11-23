# Epicourier Sprint Tasks & Milestones

**Document Version**: 1.0  
**Last Updated**: November 17, 2025  
**Current Phase**: Phase 1 Complete - Planning Phase 2

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
**Total Planned Issues**: 1  
**Completed**: 1  
**In Progress**: 0  
**Planned**: All Phase 2 features below

---

### 📋 v1.1.0: Nutrient Summary System (Issues TBD)

**Milestone**: `v1.1.0-nutrient-tracking`  
**Status**: 📝 Planning  
**Target Release**: TBD

| Issue | Title                                          | Type       | Priority | Assignee | Status       |
| ----- | ---------------------------------------------- | ---------- | -------- | -------- | ------------ |
| TBD   | feat(frontend): Nutrient Dashboard Page        | Frontend   | P1       | -        | 📝 To Create |
| TBD   | feat(frontend): Chart Components for Nutrition | Frontend   | P1       | -        | 📝 To Create |
| TBD   | feat(backend): Nutrient Aggregation API        | Backend    | P1       | -        | 📝 To Create |
| TBD   | feat(backend): Historical Data Query Endpoints | Backend    | P1       | -        | 📝 To Create |
| TBD   | feat(database): Nutrient Tracking Schema       | Database   | P1       | -        | 📝 To Create |
| TBD   | feat: Export Nutrition Data (CSV/PDF)          | Full-Stack | P2       | -        | 📝 To Create |
| TBD   | test: Nutrient Tracking Integration Tests      | Testing    | P1       | -        | 📝 To Create |

**Expected Deliverables**:

- [ ] Complete nutrient tracking system
- [ ] Visualization dashboard with charts
- [ ] Data export functionality
- [ ] > 85% test coverage

---

### 📋 v1.2.0: Gamified Challenges (Issues TBD)

**Milestone**: `v1.2.0-gamification`  
**Status**: 📝 Planning  
**Target Release**: TBD

| Issue | Title                                            | Type       | Priority | Assignee | Status       |
| ----- | ------------------------------------------------ | ---------- | -------- | -------- | ------------ |
| TBD   | feat(frontend): Badges & Achievements Page       | Frontend   | P2       | -        | 📝 To Create |
| TBD   | feat(frontend): Challenge Tracking UI            | Frontend   | P2       | -        | 📝 To Create |
| TBD   | feat(backend): Achievement Tracking API          | Backend    | P2       | -        | 📝 To Create |
| TBD   | feat(backend): Challenge Management System       | Backend    | P2       | -        | 📝 To Create |
| TBD   | feat(database): Achievements & Challenges Schema | Database   | P2       | -        | 📝 To Create |
| TBD   | feat: Streak Tracking System                     | Full-Stack | P2       | -        | 📝 To Create |
| TBD   | feat: Notification System for Achievements       | Full-Stack | P3       | -        | 📝 To Create |
| TBD   | test: Gamification System Tests                  | Testing    | P2       | -        | 📝 To Create |

**Expected Deliverables**:

- [ ] Badge and achievement system
- [ ] Weekly/monthly challenges
- [ ] Streak tracking
- [ ] Notification integration

---

### 📋 v1.3.0: Smart Cart Integration (Issues TBD)

**Milestone**: `v1.3.0-smart-cart`  
**Status**: 📝 Planning  
**Target Release**: TBD

| Issue | Title                                             | Type       | Priority | Assignee | Status       |
| ----- | ------------------------------------------------- | ---------- | -------- | -------- | ------------ |
| TBD   | feat(frontend): Shopping List Page                | Frontend   | P1       | -        | 📝 To Create |
| TBD   | feat(frontend): Inventory Management UI           | Frontend   | P1       | -        | 📝 To Create |
| TBD   | feat(backend): Shopping List Generation Algorithm | Backend    | P1       | -        | 📝 To Create |
| TBD   | feat(backend): Inventory Tracking API             | Backend    | P1       | -        | 📝 To Create |
| TBD   | feat(backend): Smart Suggestion Engine            | Backend    | P1       | -        | 📝 To Create |
| TBD   | feat(database): Shopping List & Inventory Schema  | Database   | P1       | -        | 📝 To Create |
| TBD   | feat: Quantity Calculation Service                | Backend    | P1       | -        | 📝 To Create |
| TBD   | feat: Shopping List Export (Print/Email)          | Full-Stack | P2       | -        | 📝 To Create |
| TBD   | test: Shopping Cart Integration Tests             | Testing    | P1       | -        | 📝 To Create |

**Expected Deliverables**:

- [ ] Automated shopping list generation
- [ ] Inventory management system
- [ ] Recipe suggestions based on inventory
- [ ] Export and sharing capabilities

---

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

### v1.1.0: Monthly Nutrient Summary

**Status**: 📝 Planning  
**Priority**: P1  
**Milestone**: `v1.1.0-nutrient-tracking`
**Target Release**: TBD

#### Planned Features

| Feature           | Description                                | Complexity | Issue # |
| ----------------- | ------------------------------------------ | ---------- | ------- |
| Nutrient Tracking | Track daily/weekly/monthly nutrient intake | Medium     | TBD     |
| Visualization     | Charts and graphs for nutrition trends     | Medium     | TBD     |
| Goal Setting      | Set personal nutrition goals               | Low        | TBD     |
| Progress Reports  | Weekly/monthly nutrition reports           | Medium     | TBD     |
| Export Data       | Export nutrition data (CSV/PDF)            | Low        | TBD     |

#### Technical Requirements

**Frontend Tasks**:

- [ ] Nutrient dashboard page (`/dashboard/nutrients`)
- [ ] Chart components (Chart.js or Recharts)
- [ ] Date range picker for historical data
- [ ] Export functionality

**Backend Tasks**:

- [ ] Nutrient calculation aggregation API
- [ ] Historical data query endpoints
- [ ] Report generation service
- [ ] Data export endpoints

**Database**:

- [ ] Nutrient tracking table
- [ ] User goal preferences table
- [ ] Aggregation indexes

**Estimated Effort**: Medium to Large  
**Dependencies**: Meal calendar data

---

### v1.2.0: Gamified Challenges

**Status**: 📝 Planning  
**Priority**: P2  
**Milestone**: `v1.2.0-gamification`
**Target Release**: TBD

#### Planned Features

| Feature      | Description                              | Complexity | Issue # |
| ------------ | ---------------------------------------- | ---------- | ------- |
| Badge System | Earn badges for achievements             | Medium     | TBD     |
| Challenges   | Weekly/monthly health challenges         | Medium     | TBD     |
| Leaderboard  | Community rankings (optional)            | High       | TBD     |
| Streaks      | Track consecutive days of healthy eating | Low        | TBD     |
| Rewards      | Unlock features through achievements     | Medium     | TBD     |

#### Technical Requirements

**Frontend Tasks**:

- [ ] Badges & achievements page
- [ ] Challenge tracking UI
- [ ] Progress animations
- [ ] Notification system for achievements

**Backend Tasks**:

- [ ] Achievement tracking logic
- [ ] Badge assignment system
- [ ] Challenge creation/management API
- [ ] Notification service

**Database**:

- [ ] User achievements table
- [ ] Challenges table
- [ ] User progress tracking

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
