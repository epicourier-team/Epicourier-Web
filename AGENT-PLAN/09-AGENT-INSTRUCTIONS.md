# AI Agent Collaboration Guide

**Document Version**: 1.0  
**Last Updated**: November 17, 2025  
**Status**: Phase 1 Complete

---

## 📋 Document Overview

This guide helps AI coding agents (like GitHub Copilot) collaborate effectively on the Epicourier project. It provides structured workflows for understanding the codebase, implementing features, and maintaining documentation.

**Intended Audience**: AI Agents (Copilot, CodeLens, etc.)  
**Purpose**:
- Understand how to read and apply AGENT-PLAN documentation
- Follow established code patterns for frontend and backend
- Manage issues, pull requests, and sprint tasks
- Maintain code quality and documentation consistency

---

## 🎯 Core Principles

### 1. Documentation-First Approach

**Before Writing Code**:
1. ✅ Read relevant AGENT-PLAN documents
2. ✅ Understand existing patterns and architecture
3. ✅ Check 08-SPRINT-TASKS.md for current priorities
4. ✅ Review issue templates for context

**Key Documents**:
- `00-QUICK-START.md` → Project setup and development
- `01-TECH-STACK.md` → Technology overview
- `02-ARCHITECTURE.md` → System design and structure
- `03-API-SPECIFICATIONS.md` → API contracts
- `04-DATABASE-DESIGN.md` → Database schema and queries
- `05-FRONTEND-PATTERNS.md` → React/Next.js patterns
- `06-BACKEND-PATTERNS.md` → FastAPI/AI-ML patterns
- `07-TESTING-STRATEGY.md` → Testing approach
- `08-SPRINT-TASKS.md` → Current sprint goals

---

### 2. Pattern Consistency

**Always Follow Established Patterns**:
- ✅ Use existing component structures (SearchBar, Modal, Card)
- ✅ Follow naming conventions (`use-*` for hooks, `kebab-case` for files)
- ✅ Match code style (TypeScript types, async/await, error handling)
- ✅ Maintain test coverage (>85%)

**Reference Before Coding**:
- Frontend → `05-FRONTEND-PATTERNS.md`
- Backend → `06-BACKEND-PATTERNS.md`
- Testing → `07-TESTING-STRATEGY.md`

---

### 3. Quality Standards

**Before Committing**:
1. ✅ Run tests: `npm test` (frontend) or `pytest` (backend)
2. ✅ Check linting: `npm run lint` (frontend)
3. ✅ Verify types: `npm run type-check` (frontend)
4. ✅ Ensure >85% coverage on new code

---

## 📖 How to Read AGENT-PLAN Documentation

### Document Structure

Each AGENT-PLAN document follows this template:

```markdown
# Title

**Version**: X.X  
**Last Updated**: Date  
**Status**: Phase N

---

## 📋 Document Overview
[Purpose, scope, audience]

## 🔑 Key Concepts
[Main topics covered]

## �� Implementation Examples
[Code samples with explanations]

## 📚 Related Documentation
[Cross-references]

## 🔄 Document Updates
[Maintenance schedule]
```

### Reading Strategy

**For New Features**:
1. Start with `02-ARCHITECTURE.md` → Understand where it fits
2. Read `03-API-SPECIFICATIONS.md` → Check API contracts
3. Review `04-DATABASE-DESIGN.md` → Understand data model
4. Follow `05-FRONTEND-PATTERNS.md` OR `06-BACKEND-PATTERNS.md`
5. Apply `07-TESTING-STRATEGY.md` → Write tests

**For Bug Fixes**:
1. Identify affected module (frontend/backend/database)
2. Read corresponding pattern document
3. Review related tests in `07-TESTING-STRATEGY.md`
4. Fix + add regression test

---

## 🛠️ Development Workflows

### Workflow 1: Implementing a New Feature

**Example**: Add "Favorite Recipes" Feature

#### Step 1: Understand Requirements
```bash
# Read issue description
# Check AGENT-PLAN/08-SPRINT-TASKS.md for priority
# Review AGENT-PLAN/02-ARCHITECTURE.md for system context
```

#### Step 2: Database Changes
```bash
# Read AGENT-PLAN/04-DATABASE-DESIGN.md
# Design new table or modify existing schema
# Example: Add "favorites" table with user_id and recipe_id
```

**SQL Migration**:
```sql
CREATE TABLE favorites (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  recipe_id INTEGER NOT NULL REFERENCES Recipe(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, recipe_id)
);

-- RLS Policy
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own favorites"
  ON favorites FOR ALL
  USING (auth.uid() = user_id);
```

#### Step 3: Backend API
```bash
# Read AGENT-PLAN/06-BACKEND-PATTERNS.md
# Follow FastAPI patterns for endpoint creation
```

**Backend Code** (`backend/api/favorites.py`):
```python
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/favorites", tags=["favorites"])

class FavoriteRequest(BaseModel):
    recipe_id: int

@router.post("/")
async def add_favorite(request: FavoriteRequest, user_id: str = Depends(get_current_user)):
    """Add recipe to user's favorites."""
    try:
        supabase = load_supabase()
        result = supabase.table("favorites").insert({
            "user_id": user_id,
            "recipe_id": request.recipe_id
        }).execute()
        return {"success": True, "data": result.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/")
async def get_favorites(user_id: str = Depends(get_current_user)):
    """Get user's favorite recipes."""
    supabase = load_supabase()
    result = supabase.table("favorites") \
        .select("*, Recipe(*)") \
        .eq("user_id", user_id) \
        .execute()
    return {"favorites": result.data}

@router.delete("/{recipe_id}")
async def remove_favorite(recipe_id: int, user_id: str = Depends(get_current_user)):
    """Remove recipe from favorites."""
    supabase = load_supabase()
    result = supabase.table("favorites") \
        .delete() \
        .eq("user_id", user_id) \
        .eq("recipe_id", recipe_id) \
        .execute()
    return {"success": True}
```

#### Step 4: Frontend Integration
```bash
# Read AGENT-PLAN/05-FRONTEND-PATTERNS.md
# Follow React patterns for components and hooks
```

**Custom Hook** (`web/src/hooks/use-favorites.ts`):
```typescript
"use client";

import { useState, useEffect } from "react";

export function useFavorites() {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchFavorites() {
      try {
        const response = await fetch("/api/favorites", {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Failed to fetch favorites");
        const data = await response.json();
        setFavorites(data.favorites.map((f: any) => f.recipe_id));
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error fetching favorites:", error);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchFavorites();
    return () => controller.abort();
  }, []);

  const addFavorite = async (recipeId: number) => {
    const response = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipe_id: recipeId }),
    });
    if (response.ok) {
      setFavorites([...favorites, recipeId]);
    }
  };

  const removeFavorite = async (recipeId: number) => {
    const response = await fetch(`/api/favorites/${recipeId}`, {
      method: "DELETE",
    });
    if (response.ok) {
      setFavorites(favorites.filter((id) => id !== recipeId));
    }
  };

  return { favorites, isLoading, addFavorite, removeFavorite };
}
```

**Component** (`web/src/components/ui/FavoriteButton.tsx`):
```typescript
"use client";

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/use-favorites";

interface FavoriteButtonProps {
  recipeId: number;
}

export default function FavoriteButton({ recipeId }: FavoriteButtonProps) {
  const { favorites, addFavorite, removeFavorite } = useFavorites();
  const isFavorite = favorites.includes(recipeId);

  const handleClick = () => {
    if (isFavorite) {
      removeFavorite(recipeId);
    } else {
      addFavorite(recipeId);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        className={`h-5 w-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`}
      />
    </Button>
  );
}
```

#### Step 5: Testing
```bash
# Read AGENT-PLAN/07-TESTING-STRATEGY.md
# Write tests for backend and frontend
```

**Backend Test** (`backend/tests/test_favorites.py`):
```python
def test_add_favorite(client):
    """Test adding a recipe to favorites."""
    response = client.post(
        "/favorites/",
        json={"recipe_id": 1},
        headers={"Authorization": "Bearer mock-token"}
    )
    assert response.status_code == 200
    assert response.json()["success"] is True

def test_get_favorites(client):
    """Test retrieving user favorites."""
    response = client.get(
        "/favorites/",
        headers={"Authorization": "Bearer mock-token"}
    )
    assert response.status_code == 200
    assert "favorites" in response.json()
```

**Frontend Test** (`web/__tests__/jsdom/FavoriteButton.test.tsx`):
```typescript
import FavoriteButton from "@/components/ui/FavoriteButton";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

describe("FavoriteButton", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("renders unfavorited heart", () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ favorites: [] }),
    });

    render(<FavoriteButton recipeId={1} />);
    expect(screen.getByLabelText(/add to favorites/i)).toBeInTheDocument();
  });

  it("adds recipe to favorites on click", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ favorites: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(<FavoriteButton recipeId={1} />);
    const button = screen.getByRole("button");

    fireEvent.click(button);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/favorites",
        expect.objectContaining({ method: "POST" })
      );
    });
  });
});
```

#### Step 6: Documentation
```bash
# Update AGENT-PLAN/08-SPRINT-TASKS.md
# Mark task as completed in Phase tracking
```

#### Step 7: Pull Request
```bash
# Create PR using template in .github/PULL_REQUEST_TEMPLATE.md
# Reference issue number
# Include screenshots if UI change
# Request code review
```

---

### Workflow 2: Fixing a Bug

**Example**: Fix Recipe Search Not Returning Results

#### Step 1: Reproduce Issue
```bash
# Run the application locally
# Verify the bug exists
# Check console/network logs for errors
```

#### Step 2: Locate Code
```bash
# Frontend search → web/src/components/ui/searchbar.tsx
# Backend API → backend/api/index.py (search endpoint)
# Read AGENT-PLAN/05-FRONTEND-PATTERNS.md or 06-BACKEND-PATTERNS.md
```

#### Step 3: Identify Root Cause
```bash
# Debug with breakpoints or logging
# Check database queries in AGENT-PLAN/04-DATABASE-DESIGN.md
# Review API specs in AGENT-PLAN/03-API-SPECIFICATIONS.md
```

#### Step 4: Fix + Test
```bash
# Apply fix following existing patterns
# Write regression test in AGENT-PLAN/07-TESTING-STRATEGY.md style
# Run tests: npm test (frontend) or pytest (backend)
```

#### Step 5: Document
```bash
# Update CHANGELOG.md with fix
# Add comment explaining the fix in code
```

---

### Workflow 3: Updating Documentation

**When to Update AGENT-PLAN**:
- ✅ New pattern introduced (component, hook, API endpoint)
- ✅ Technology version upgraded
- ✅ Architecture changes
- ✅ New sprint phase started

**How to Update**:
1. Identify affected document (01-09)
2. Update content following document template
3. Increment version number (semantic versioning)
4. Update "Last Updated" date
5. Add entry to "Document Updates" section

**Example**:
```markdown
## 🔄 Document Updates

**v1.1** (November 20, 2025):
- Added "Favorite Recipes" feature documentation
- Updated API endpoint table with `/favorites` routes
- Added custom hook pattern: `useFavorites`
```

---

## 🐛 Issue Management

### Creating Issues

**Use Templates**:
- 🐛 Bug Report → `.github/ISSUE_TEMPLATE/BUG_REPORT.md`
- ✨ Feature Request → `.github/ISSUE_TEMPLATE/FEATURE_REQUEST.md`
- 📝 Documentation → `.github/ISSUE_TEMPLATE/DOCUMENTATION.md`

**Title Format**:
```
[Type] Brief description
Examples:
- [Bug] Search returns empty results for valid queries
- [Feature] Add favorite recipes functionality
- [Docs] Update API specifications with new endpoints
```

**Labels** (from `08-SPRINT-TASKS.md`):
- Priority: `P0`, `P1`, `P2`, `P3`
- Type: `bug`, `feature`, `docs`, `test`
- Status: `in-progress`, `blocked`, `review`
- Sprint: `phase-1`, `phase-2`, `phase-3`

---

### Working on Issues

**Workflow**:
1. Assign yourself to the issue
2. Move to "In Progress" (GitHub Projects)
3. Create feature branch: `feature/issue-123-favorite-recipes`
4. Follow development workflow (see above)
5. Link PR to issue with "Closes #123"
6. Request review
7. Merge after approval

---

## 🔀 Pull Request Process

### PR Template

**Use** `.github/PULL_REQUEST_TEMPLATE.md`:
```markdown
## Description
[Brief summary of changes]

## Related Issue
Closes #123

## Type of Change
- [ ] Bug fix
- [x] New feature
- [ ] Documentation update

## Testing
- [x] Frontend tests pass (`npm test`)
- [x] Backend tests pass (`pytest`)
- [x] Manual testing completed

## Screenshots (if applicable)
[Add images for UI changes]

## Checklist
- [x] Code follows style guidelines
- [x] Tests cover new code (>85%)
- [x] Documentation updated
- [x] No breaking changes
```

### Review Checklist

**Before Requesting Review**:
- ✅ All tests pass
- ✅ Code coverage >85%
- ✅ No linting errors
- ✅ Documentation updated
- ✅ Commit messages follow convention (see below)

---

## 📝 Commit Message Convention

**Format**:
```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Types**:
- `feat` → New feature
- `fix` → Bug fix
- `docs` → Documentation update
- `test` → Test updates
- `refactor` → Code refactoring
- `style` → Formatting changes
- `chore` → Maintenance tasks

**Examples**:
```bash
feat(search): add autocomplete to recipe search
fix(api): resolve empty search results bug
docs(agent-plan): update 05-frontend-patterns with new hook
test(favorites): add tests for favorite recipes feature
refactor(calendar): simplify event grouping logic
```

**Reference**: See `Epicourier-Web.wiki/Commit-message-convention.md`

---

## 🎯 Sprint Task Management

### Reading Sprint Tasks

**File**: `AGENT-PLAN/08-SPRINT-TASKS.md`

**Structure**:
```markdown
## Phase 1: Foundation (Weeks 1-2)

### Backend Tasks
- [ ] Task 1 [P0] → Description
  - Implementation notes
  - Testing requirements

### Frontend Tasks
- [x] Task 2 [P1] → Description (Completed)
  - Implementation notes
  - Testing requirements
```

**Priority Levels**:
- `P0` → Critical (blocking)
- `P1` → High (important)
- `P2` → Medium (nice to have)
- `P3` → Low (future)

---

### Updating Sprint Tasks

**After Completing a Task**:
1. Mark checkbox: `- [x]`
2. Add completion date: `(Completed: Nov 17, 2025)`
3. Link to PR: `(PR #45)`
4. Update "Progress Tracking" section

**Example**:
```markdown
- [x] Implement recipe search with filters [P0] (Completed: Nov 17, 2025, PR #45)
  - ✅ Added SearchBar component with debouncing
  - ✅ Integrated with /api/search endpoint
  - ✅ Tests: 30 passing tests, 92% coverage
```

---

## 🔍 Code Quality Guidelines

### Frontend (Next.js/React)

**Component Structure**:
```typescript
"use client"; // Only if using hooks/state

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ComponentProps {
  title: string;
  onAction: () => void;
}

export default function Component({ title, onAction }: ComponentProps) {
  const [state, setState] = useState<string>("");

  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={onAction}>Click Me</Button>
    </div>
  );
}
```

**Best Practices**:
- ✅ Use TypeScript types for props
- ✅ Export default for page components
- ✅ Use named exports for utilities
- ✅ Async/await for API calls
- ✅ AbortController for cleanup

---

### Backend (FastAPI)

**Endpoint Structure**:
```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/resource", tags=["resource"])

class ResourceRequest(BaseModel):
    name: str
    value: int

@router.post("/")
async def create_resource(request: ResourceRequest):
    """Create a new resource."""
    try:
        # Lazy load dependencies
        client = load_client()
        result = client.create(request.dict())
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
```

**Best Practices**:
- ✅ Use Pydantic models for validation
- ✅ Lazy load heavy dependencies (@lru_cache)
- ✅ Proper error handling (HTTPException)
- ✅ Type hints for all functions
- ✅ Async/await for I/O operations

---

## 📊 Monitoring Progress

### Metrics to Track

**Coverage**:
```bash
# Frontend
npm test -- --coverage
# Target: >85%

# Backend
pytest --cov=backend/api
# Target: >85%
```

**Performance**:
- Frontend build time: <30s
- Backend API response: <2s (recommendation endpoint)
- Database queries: <100ms

**Quality**:
- No linting errors: `npm run lint`
- No type errors: `npm run type-check`
- All tests passing: `npm test && pytest`

---

## 🤝 Collaboration Tips

### Working with Humans

1. **Ask for Clarification**: If requirements are unclear, ask before implementing
2. **Provide Updates**: Comment on issues/PRs with progress
3. **Request Reviews**: Tag specific reviewers for domain expertise
4. **Document Decisions**: Explain "why" in comments and commit messages

### Working with Other Agents

1. **Check Recent Activity**: Review recent commits/PRs before starting
2. **Avoid Conflicts**: Communicate which files you're modifying
3. **Merge Frequently**: Pull latest changes before creating PRs
4. **Follow Conventions**: Stick to established patterns

---

## 📚 Related Documentation

| Document                                      | Purpose                        |
|-----------------------------------------------|--------------------------------|
| [00-QUICK-START.md](./00-QUICK-START.md)     | Project setup guide            |
| [08-SPRINT-TASKS.md](./08-SPRINT-TASKS.md)   | Current sprint priorities      |
| `Epicourier-Web.wiki/`                       | Community wiki                 |
| `.github/ISSUE_TEMPLATE/`                    | Issue templates                |
| `.github/PULL_REQUEST_TEMPLATE.md`           | PR template                    |

---

## 🔄 Document Updates

This document should be updated when:
- ✅ New workflows are established
- ✅ Code quality standards change
- ✅ Collaboration tools are introduced
- ✅ Agent capabilities expand

**Last Review**: November 17, 2025  
**Next Review**: December 1, 2025

---

## 🎓 Learning Resources

**For Understanding Epicourier**:
- Wiki: `Epicourier-Web.wiki/Home.md` → Project overview
- Architecture: `AGENT-PLAN/02-ARCHITECTURE.md` → System design
- Tech Stack: `AGENT-PLAN/01-TECH-STACK.md` → Technologies used

**For Improving Code Quality**:
- Frontend Patterns: `AGENT-PLAN/05-FRONTEND-PATTERNS.md`
- Backend Patterns: `AGENT-PLAN/06-BACKEND-PATTERNS.md`
- Testing: `AGENT-PLAN/07-TESTING-STRATEGY.md`

**For Contributing**:
- Contributing: `CONTRIBUTE.md`
- Code of Conduct: `CODE_OF_CONDUCT.md`
- License: `LICENSE.md`
