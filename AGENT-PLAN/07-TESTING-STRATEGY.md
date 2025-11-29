# Epicourier Testing Strategy

**Document Version**: 1.1  
**Last Updated**: November 29, 2025  
**Status**: Phase 2 Complete (Gamification Tests)

---

## 📋 Document Overview

This document describes the comprehensive testing strategy for Epicourier, covering **frontend testing** (Jest + React Testing Library) and **backend testing** (Pytest). It includes test organization, coverage targets, and CI/CD integration.

**Purpose**:
- Understand test structure and organization
- Learn frontend testing patterns (React components, hooks)
- Learn backend testing patterns (FastAPI endpoints, AI/ML)
- Achieve and maintain >85% code coverage
- Integrate testing into CI/CD pipeline

---

## 🎯 Testing Philosophy

### Core Principles

1. **Test Behavior, Not Implementation**: Focus on what components do, not how they do it
2. **Coverage Target**: Maintain >85% code coverage across all modules
3. **Fast Feedback**: Tests should run quickly in development
4. **Isolated Tests**: Each test should be independent and repeatable
5. **Realistic Testing**: Use integration tests over unit tests where appropriate

---

## 🏗️ Test Organization

### Frontend Test Structure

```
web/
├── __tests__/
│   ├── jsdom/              # Component & hook tests (DOM environment)
│   │   ├── searchbar.test.tsx
│   │   ├── pagination.test.tsx
│   │   ├── AddMealModal.test.tsx
│   │   ├── MealDetailModal.test.tsx
│   │   ├── PushNotifications.test.tsx  # Push notification component tests
│   │   ├── use-recipe.test.tsx
│   │   ├── signin.test.tsx
│   │   ├── signup.test.tsx
│   │   ├── page.test.tsx
│   │   └── ui-*.test.tsx
│   └── node/               # Server-side tests (Node environment)
│       ├── next-config.test.ts
│       ├── middleware.test.ts
│       ├── achievementsApi.test.ts      # Achievements API tests
│       ├── challengesApi.test.ts        # Challenges API tests (37 tests)
│       ├── streaksApi.test.ts           # Streaks API tests
│       ├── notificationsApi.test.ts     # Notifications API tests (22 tests)
│       └── gamificationIntegration.test.ts  # Cross-feature integration (27 tests)
├── jest.config.ts          # Main Jest config (projects)
├── jest.jsdom.config.ts    # JSDOM environment config
├── jest.node.config.ts     # Node environment config
└── jest.setup.ts           # Global test setup
```

### Backend Test Structure

```
backend/
├── tests/
│   ├── __init__.py
│   ├── conftest.py         # Pytest fixtures
│   └── test_recommender.py # API & recommender tests
└── api/
    ├── index.py            # FastAPI app
    └── recommender.py      # AI/ML logic
```

---

## ��️ Frontend Testing

### Jest Configuration

#### Multi-Project Setup (`jest.config.ts`)

```typescript
import type { Config } from "jest";

const config: Config = {
  projects: [
    "<rootDir>/jest.jsdom.config.ts",  // Component tests
    "<rootDir>/jest.node.config.ts"     // Server tests
  ],
};

export default config;
```

**Why Multi-Project?**
- Separate DOM tests (components, hooks) from Node tests (configs, middleware)
- Different environments require different setups
- Faster parallel execution

---

#### JSDOM Configuration (`jest.jsdom.config.ts`)

```typescript
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const customJestConfig = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "es2021",
          parser: {
            syntax: "typescript",
            tsx: true,
            decorators: true,
          },
          transform: {
            react: {
              runtime: "automatic",
              useBuiltins: true,
            },
          },
        },
      },
    ],
  },

  transformIgnorePatterns: [
    "node_modules/(?!(lodash-es|@fullcalendar|lucide-react|@radix-ui|shadcn|react-icons|@supabase|next|@next|react|react-dom)/)",
  ],

  testMatch: ["**/__tests__/jsdom/**/*.[jt]s?(x)"],
};

export default createJestConfig(customJestConfig);
```

**Key Features**:
- **@swc/jest**: Fast TypeScript/JSX transformation
- **transformIgnorePatterns**: Transform ESM modules from node_modules
- **moduleNameMapper**: Path aliases (@/) and CSS mocking

---

#### Node Configuration (`jest.node.config.ts`)

```typescript
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const customJestConfig = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  
  transformIgnorePatterns: [
    "node_modules/(?!(next|react|react-dom)/)"
  ],
  
  testMatch: ["**/__tests__/node/**/*.[jt]s?(x)"],
};

export default createJestConfig(customJestConfig);
```

---

#### Global Setup (`jest.setup.ts`)

```typescript
import "@testing-library/jest-dom";

import { TextDecoder, TextEncoder } from "util";
Object.assign(global, {
  TextEncoder,
  TextDecoder,
});

beforeAll(() => {
  // Suppress console logs in tests
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
});
```

**Purpose**:
- Import `@testing-library/jest-dom` for custom matchers
- Polyfill `TextEncoder`/`TextDecoder` for Node 16+
- Suppress console noise during tests

---

### React Testing Library Patterns

#### Component Testing

**Example**: SearchBar Component

```typescript
import SearchBar from "@/components/ui/searchbar";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

describe("SearchBar", () => {
  it("renders input and button", () => {
    const mockOnSearch = jest.fn();
    render(<SearchBar onSearch={mockOnSearch} />);

    expect(screen.getByPlaceholderText(/search recipes/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();
  });

  it("updates input value on typing", () => {
    const mockOnSearch = jest.fn();
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText(/search recipes/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "pasta" } });

    expect(input.value).toBe("pasta");
  });

  it("calls onSearch when button is clicked", () => {
    const mockOnSearch = jest.fn();
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText(/search recipes/i);
    const button = screen.getByRole("button", { name: /search/i });

    fireEvent.change(input, { target: { value: "pizza" } });
    fireEvent.click(button);

    expect(mockOnSearch).toHaveBeenCalledWith("pizza");
    expect(mockOnSearch).toHaveBeenCalledTimes(1);
  });

  it("calls onSearch when Enter key is pressed", () => {
    const mockOnSearch = jest.fn();
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText(/search recipes/i);

    fireEvent.change(input, { target: { value: "burger" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(mockOnSearch).toHaveBeenCalledWith("burger");
    expect(mockOnSearch).toHaveBeenCalledTimes(1);
  });

  it("does not call onSearch when other keys are pressed", () => {
    const mockOnSearch = jest.fn();
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText(/search recipes/i);

    fireEvent.change(input, { target: { value: "salad" } });
    fireEvent.keyDown(input, { key: "a", code: "KeyA" });

    expect(mockOnSearch).not.toHaveBeenCalled();
  });
});
```

**Best Practices**:
1. ✅ Use `jest.fn()` for callback mocks
2. ✅ Query by role/label/placeholder (accessibility-friendly)
3. ✅ Test user interactions (click, type, keypress)
4. ✅ Verify function calls and arguments
5. ✅ Test edge cases (empty input, special keys)

---

#### Modal Component Testing

```typescript
import AddMealModal from "@/components/ui/AddMealModal";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

describe("AddMealModal", () => {
  const mockRecipe = { id: 1, name: "Test Recipe" };
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    global.fetch = jest.fn();
    global.alert = jest.fn();
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <AddMealModal
        recipe={mockRecipe}
        isOpen={false}
        onClose={mockOnClose}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders modal when isOpen is true", () => {
    render(
      <AddMealModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    expect(screen.getByText(/select date for test recipe/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/choose a date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/choose meal type/i)).toBeInTheDocument();
  });

  it("calls onClose when cancel button is clicked", () => {
    render(
      <AddMealModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("submits form with selected date and meal type", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(
      <AddMealModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const dateInput = screen.getByLabelText(/choose a date/i);
    const mealSelect = screen.getByLabelText(/choose meal type/i);
    const confirmButton = screen.getByRole("button", { name: /confirm/i });

    fireEvent.change(dateInput, { target: { value: "2025-11-20" } });
    fireEvent.change(mealSelect, { target: { value: "dinner" } });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/events",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipe_id: 1,
            date: "2025-11-20",
            meal_type: "dinner",
            status: false,
          }),
        })
      );
    });

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnSuccess).toHaveBeenCalled();
  });
});
```

**Testing Modals**:
- ✅ Conditional rendering (`isOpen`)
- ✅ Form inputs (date, select)
- ✅ API calls with `fetch` mocking
- ✅ Success/failure callbacks

---

#### Custom Hook Testing

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { useRecipes } from "@/hooks/use-recipe";

describe("useRecipes", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("fetches recipes successfully", async () => {
    const mockData = {
      recipes: [
        { id: 1, name: "Recipe 1" },
        { id: 2, name: "Recipe 2" },
      ],
      pagination: { page: 1, totalPages: 5, total: 100 },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() =>
      useRecipes({ query: "pasta", page: 1, limit: 20 })
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.recipes).toEqual(mockData.recipes);
    expect(result.current.pagination).toEqual(mockData.pagination);
    expect(result.current.error).toBeNull();
  });

  it("handles fetch errors", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      text: async () => "Server error",
    });

    const { result } = renderHook(() =>
      useRecipes({ query: "pizza", page: 1 })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Server error");
    expect(result.current.recipes).toEqual([]);
  });

  it("aborts request on unmount", () => {
    const mockAbort = jest.fn();
    global.AbortController = jest.fn(() => ({
      abort: mockAbort,
      signal: {},
    })) as any;

    const { unmount } = renderHook(() =>
      useRecipes({ query: "salad", page: 1 })
    );

    unmount();

    expect(mockAbort).toHaveBeenCalled();
  });
});
```

**Hook Testing**:
- ✅ Use `renderHook` from `@testing-library/react`
- ✅ Test loading states
- ✅ Test success/error scenarios
- ✅ Test cleanup (AbortController)

---

### Running Frontend Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test searchbar.test.tsx

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch

# Run only JSDOM tests
npm test -- --selectProjects jsdom

# Run only Node tests
npm test -- --selectProjects node
```

---

## 🐍 Backend Testing

### Pytest Configuration

#### Fixtures (`tests/conftest.py`)

```python
import sys
import os
import pytest
from fastapi.testclient import TestClient

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from api.index import app

@pytest.fixture
def client():
    """Provides a FastAPI test client for all tests."""
    with TestClient(app) as c:
        yield c
```

**Fixtures Provide**:
- FastAPI test client
- Shared setup/teardown logic
- Dependency injection for tests

---

### API Endpoint Testing

```python
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

def test_health_check(client):
    """Test /test endpoint."""
    response = client.get("/test")
    assert response.status_code == 200
    assert "message" in response.json()


def test_recommend_meals_success(client):
    """Test successful recommendation request."""
    with patch("api.recommender.create_meal_plan") as mock_plan:
        mock_plan.return_value = (
            [
                {
                    "meal_number": 1,
                    "name": "Grilled Chicken",
                    "tags": ["protein", "healthy"],
                    "key_ingredients": ["chicken", "olive oil"],
                    "similarity_score": 0.85,
                }
            ],
            "For weight loss, aim for 1500 kcal with high protein."
        )

        response = client.post(
            "/recommender",
            json={"goal": "lose weight", "numMeals": 3}
        )

        assert response.status_code == 200
        data = response.json()
        assert "recipes" in data
        assert "goal_expanded" in data
        assert len(data["recipes"]) == 1
        assert data["recipes"][0]["name"] == "Grilled Chicken"


def test_recommend_meals_empty_goal(client):
    """Test validation: empty goal."""
    response = client.post(
        "/recommender",
        json={"goal": "", "numMeals": 3}
    )
    
    assert response.status_code == 400
    assert "Goal cannot be empty" in response.json()["detail"]


def test_recommend_meals_invalid_num_meals(client):
    """Test validation: invalid number of meals."""
    response = client.post(
        "/recommender",
        json={"goal": "build muscle", "numMeals": 10}
    )
    
    assert response.status_code == 400
    assert "must be one of 3, 5, or 7" in response.json()["detail"]


def test_recommend_meals_missing_field(client):
    """Test validation: missing required field."""
    response = client.post(
        "/recommender",
        json={"goal": "get healthy"}  # Missing numMeals
    )
    
    assert response.status_code == 422  # Unprocessable Entity
```

**API Testing Patterns**:
1. ✅ Mock expensive operations (`create_meal_plan`)
2. ✅ Test happy path (200 OK)
3. ✅ Test validation (400 Bad Request)
4. ✅ Test missing fields (422 Unprocessable Entity)
5. ✅ Verify response structure

---

### AI/ML Testing with Mocks

```python
from unittest.mock import patch, MagicMock
import pandas as pd

def test_rank_recipes_by_goal():
    """Test recipe ranking logic."""
    with patch("api.recommender.load_recipe_data") as mock_data, \
         patch("api.recommender.nutrition_goal") as mock_goal, \
         patch("api.recommender.load_embedder") as mock_embedder:
        
        # Mock recipe data
        mock_data.return_value = pd.DataFrame({
            "id": [1, 2, 3],
            "name": ["Recipe A", "Recipe B", "Recipe C"],
            "description": ["Desc A", "Desc B", "Desc C"],
            "ingredients": [["ing1"], ["ing2"], ["ing3"]],
            "tags": [["tag1"], ["tag2"], ["tag3"]],
        })
        
        # Mock Gemini response
        mock_goal.return_value = "1500 kcal, 100g protein"
        
        # Mock embedder
        mock_model = MagicMock()
        mock_model.encode.return_value = [[0.1, 0.2], [0.3, 0.4], [0.5, 0.6]]
        mock_embedder.return_value = mock_model
        
        from api.recommender import rank_recipes_by_goal
        
        ranked, nutri = rank_recipes_by_goal("lose weight", top_k=2)
        
        assert len(ranked) == 2
        assert "similarity" in ranked.columns
        assert nutri == "1500 kcal, 100g protein"
```

**Mocking Strategy**:
- ✅ Mock external APIs (Gemini, Supabase)
- ✅ Mock ML models (SentenceTransformer)
- ✅ Use `MagicMock` for complex objects
- ✅ Test logic without hitting real services

---

### Property-Based Testing (Hypothesis)

```python
from hypothesis import given, strategies as st, settings

@given(
    goal=st.text(min_size=1, max_size=100),
    num_meals=st.sampled_from([3, 5, 7])
)
@settings(max_examples=50)
def test_create_meal_plan_properties(goal, num_meals):
    """Test meal plan creation with random inputs."""
    with patch("api.recommender.rank_recipes_by_goal"), \
         patch("api.recommender.expand_goal"):
        
        from api.recommender import create_meal_plan
        
        plan, expanded = create_meal_plan(goal, n_meals=num_meals)
        
        # Properties that should always hold
        assert isinstance(plan, list)
        assert len(plan) <= num_meals
        assert all("meal_number" in meal for meal in plan)
        assert all("name" in meal for meal in plan)
```

**Benefits**:
- ✅ Test with many random inputs
- ✅ Find edge cases automatically
- ✅ Verify invariants (properties that always hold)

---

### Running Backend Tests

```bash
# Run all tests
pytest backend/tests/ -v

# Run with coverage
pytest backend/tests/ --cov=backend/api --cov-report=html

# Run specific test
pytest backend/tests/test_recommender.py::test_recommend_meals_success

# Run in parallel
pytest backend/tests/ -n auto
```

---

## 📊 Coverage Targets

### Coverage Goals

| Module              | Target | Current |
|---------------------|--------|---------|
| Frontend Components | >90%   | 92%     |
| Frontend Hooks      | >85%   | 88%     |
| Backend API         | >85%   | 87%     |
| Backend AI/ML       | >80%   | 83%     |
| **Overall**         | **>85%** | **87%** |

### Gamification Module Coverage (v1.2.0)

| Module                      | Statements | Branches | Lines   |
|-----------------------------|------------|----------|---------|
| achievements/route.ts       | 100%       | 84.93%   | 100% ✅ |
| achievements/check/route.ts | 95.49%     | 80.3%    | 96.07% ✅|
| notifications/subscribe     | 91.11%     | 78.26%   | 91.11% ✅|
| notifications/unsubscribe   | 89.47%     | 75%      | 89.47% ✅|
| notifications/vapid-key     | 100%       | 100%     | 100% ✅ |
| streaks/route.ts            | 89.65%     | 100%     | 88.88% ✅|
| streaks/update/route.ts     | 93.1%      | 76.92%   | 93.1% ✅ |
| challenges/join/route.ts    | 84.84%     | 75%      | 84.84% ✅|
| challenges/route.ts         | 73.41%     | 54.95%   | 75.15%  |
| challenges/[id]/route.ts    | 57.34%     | 35.29%   | 58.69%  |
| UI Components               | 89.84%     | 83.56%   | 92.62% ✅|
| usePushNotifications        | 76%        | 60.52%   | 78.35%  |

### Viewing Coverage Reports

**Frontend**:
```bash
npm test -- --coverage
# Opens coverage/lcov-report/index.html
```

**Backend**:
```bash
pytest backend/tests/ --cov=backend/api --cov-report=html
# Opens htmlcov/index.html
```

---

## 🔄 CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        working-directory: ./web
        run: npm ci
      
      - name: Run tests
        working-directory: ./web
        run: npm test -- --coverage --maxWorkers=2
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./web/coverage/lcov.info
          flags: frontend

  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install uv
        run: pip install uv
      
      - name: Install dependencies
        working-directory: ./backend
        run: |
          uv sync
          uv add pytest pytest-cov --dev
      
      - name: Run tests
        working-directory: ./backend
        run: uv run pytest tests/ --cov=api --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage.xml
          flags: backend
```

---

## 🎯 Testing Best Practices

### General Rules

1. ✅ **Test One Thing**: Each test should verify one behavior
2. ✅ **Arrange-Act-Assert**: Structure tests clearly
3. ✅ **Descriptive Names**: Test names should explain what they verify
4. ✅ **No Logic in Tests**: Tests should be simple and readable
5. ✅ **Independent Tests**: Each test should run in isolation

### What to Test

**DO Test**:
- ✅ User interactions (clicks, typing, form submission)
- ✅ API responses and error handling
- ✅ Component rendering and state changes
- ✅ Edge cases and validation logic
- ✅ Integration between modules

**DON'T Test**:
- ❌ Third-party libraries (trust they work)
- ❌ Implementation details (internal state)
- ❌ CSS styling (use visual regression instead)
- ❌ Exact HTML structure (focus on behavior)

---

## 📚 Related Documentation

| Document                                      | Purpose                        |
|-----------------------------------------------|--------------------------------|
| [01-TECH-STACK.md](./01-TECH-STACK.md)       | Technology stack overview      |
| [05-FRONTEND-PATTERNS.md](./05-FRONTEND-PATTERNS.md) | Frontend patterns |
| [06-BACKEND-PATTERNS.md](./06-BACKEND-PATTERNS.md) | Backend patterns |

---

## 🔄 Document Updates

This document should be updated when:
- ✅ New testing tools are added
- ✅ Coverage targets change
- ✅ CI/CD pipeline is modified
- ✅ New testing patterns are established

**Last Review**: November 17, 2025  
**Next Review**: December 1, 2025
